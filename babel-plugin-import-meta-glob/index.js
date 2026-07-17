import { globSync } from 'glob';
import { dirname, join, relative, resolve } from 'path';
import createDebug from 'debug';

const debug = createDebug('babel:plugin-inport-meta-glob');

// https://astexplorer.net/#/gist/14696755417f9d41c8c2bd72c187b0da/41a903d14d860270fa4eefab69c8ae8934971cdc
function ImportMetaGlobPlugin ({ types: t }) {
  let program;

  const isImportMetaGlobExpression = (node) => {
    return node.callee.object?.meta?.name === 'import' ||
      node.callee.object?.property?.name === 'meta' ||
      node.callee.property?.name === 'glob'
  }

  const isEagerImportMetaGlobExpression = (node) => {
    return node.arguments.length >= 2 &&
      node.arguments[1].properties[0].key.name === 'eager' &&
      node.arguments[1].properties[0].value.value
  }

  const isAppEmbroiderWebpack = (filename) => {
    const embroiderAppPath = 'node_modules/.embroider/rewritten-app';
    return filename.includes(embroiderAppPath);
  }

  const transformEagerImportMetaGlob = (path, files) => {
    let importDeclarations = [];
    let newObjectProperties = [];

    [...files.entries()].forEach(([file, importedPath], index) => {
      const importName = `emberGlob${index}`;
      importDeclarations.push(
        t.importDeclaration(
          [
            t.importNamespaceSpecifier(
              t.identifier(importName)
            )
          ],
          t.stringLiteral(importedPath)
        )
      )
      newObjectProperties.push(
        t.objectProperty(
          t.stringLiteral(file),
          t.identifier(importName)
        )
      )
    })
  
    program.unshiftContainer('body', importDeclarations);
    path.replaceWith(t.objectExpression(newObjectProperties));
  }

  const transformLazyImportMetaGlob = (path, files) => {
    const newObjectProperties = [...files.entries()].map(([file, importedPath]) => {
      return t.objectProperty(
        t.stringLiteral(file),
        t.arrowFunctionExpression(
          [],
          t.callExpression(
            t.identifier('import'),
            [t.stringLiteral(importedPath)]
          )
        )
      );
    });
    path.replaceWith(t.objectExpression(newObjectProperties));
  }

  return {
    name: 'ember-import-meta-glob',
    visitor: {
      Program(path) {
        program = path;
      },
      CallExpression(path, state) {
        const { node } = path;

        if (!isImportMetaGlobExpression(node)) return;
        const isEager = isEagerImportMetaGlobExpression(node);
        const glob = node.arguments[0].value;

        let cwd = process.cwd();
        let classicBuild = false;

        if (state?.cwd && state?.filename) {
          if (isAppEmbroiderWebpack(state.filename)) {
            // In Ember Webpack, the app we need to transform is the rewritten app.
            cwd = dirname(state.filename)
          } else {
            /* In Ember Classic, we end up with path-to-app/app-prefix/app-prefix/path-to-file
             * in state filename instead of path-to-app/app-prefix/app/path-to-file */
            const [ appPrefix ] = state.cwd.split('/').slice(-1);
            const regex = new RegExp(`^(?:.*?\\b${appPrefix}\/${appPrefix}\\b){1}`);
            cwd = dirname(join(state.cwd, state.filename.replace(regex, 'app')));
            classicBuild = { appPrefix, appRoot: join(state.cwd, 'app') };
          }
        }

        const files = globSync(glob, {
          ignore: 'node_modules/**',
          cwd,
        }).reduce((files, file) => {
          // Remove extensions from found files
          const extensionRegexp = new RegExp(/.[tjhbcs]s?$/g);
          file = extensionRegexp.test(file) ? file.replace(/\.\w+$/, '') : file;

          let importedPath = file;

          if (!isEager && classicBuild) {
            // Use app prefix path in classic builds for lazy globs
            const absolute = resolve(cwd, file);
            const fromRoot = relative(classicBuild.appRoot, absolute);
            importedPath = join(classicBuild.appPrefix, fromRoot);
          }

          files.set(file, importedPath);
          return files;
        }, new Map())

        debug('files from glob', files);

        isEager
          ? transformEagerImportMetaGlob(path, files)
          : transformLazyImportMetaGlob(path, files);
      },
    },
  };
};

ImportMetaGlobPlugin.cacheKey = function () {
  return 'babel-plugin-import-meta-glob';
};

import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
ImportMetaGlobPlugin.baseDir = function() {
  return __dirname;
};

export default ImportMetaGlobPlugin;

// eslint-disable-next-line no-undef
const { globSync } = require('glob');
const { dirname, join } = require('path');
const debug = require('debug')('babel:plugin-meta-glob');

// https://astexplorer.net/#/gist/14696755417f9d41c8c2bd72c187b0da/41a903d14d860270fa4eefab69c8ae8934971cdc
module.exports = function ({ types: t }) {
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

    files.forEach((source, index) => {
      const importName = `emberGlob${index}`;
      importDeclarations.push(
        t.importDeclaration(
          [
            t.importNamespaceSpecifier(
              t.identifier(importName)
            )
          ],
          t.stringLiteral(source)
        )
      )
      newObjectProperties.push(
        t.objectProperty(
          t.stringLiteral(source),
          t.identifier(importName)
        )
      )
    })
  
    program.unshiftContainer('body', importDeclarations);
    path.replaceWith(t.objectExpression(newObjectProperties));
  }

  const transformLazyImportMetaGlob = (path, files, useImport) => {
    const functionIdentifier = useImport ? 'import' : 'require';
    const newObjectProperties = files.map((file) => {
      return t.objectProperty(
        t.stringLiteral(file),
        t.arrowFunctionExpression(
          [],
          t.callExpression(
            t.identifier(functionIdentifier),
            [t.stringLiteral(file)]
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

        // Lazy imports will use require by default.
        let useImport = false;

        let cwd = process.cwd();
        if (state?.cwd && state?.filename) {
          if (isAppEmbroiderWebpack(state.filename)) {
            // In Ember Webpack, the app we need to transform is the rewritten app.
            cwd = dirname(state.filename)
            useImport = true;
          } else {
            /* In Ember Classic, we end up with path-to-app/app-prefix/app-prefix/path-to-file
             * in state filename instead of path-to-app/app-prefix/app/path-to-file */
            const [ appPrefix ] = state.cwd.split('/').slice(-1);
            const regex = new RegExp(`^(?:.*?\\b${appPrefix}\/${appPrefix}\\b){1}`);
            cwd = dirname(join(state.cwd, state.filename.replace(regex, 'app')));
          }
        }

        let files = globSync(glob, {
          ignore: 'node_modules/**',
          cwd,
        }).map((file) => {
          // Remove extensions from found files
          const extensionRegexp = new RegExp(/.[tjhbcs]s?$/g);
          return extensionRegexp.test(file) ? file.replace(/\.\w+$/, '') : file
        });
        // Dedupe if necessary
        files = [...new Set(files)];
        debug('files from glob', files);

        isEager
          ? transformEagerImportMetaGlob(path, files)
          : transformLazyImportMetaGlob(path, files, useImport);
      },
    },
  };
};

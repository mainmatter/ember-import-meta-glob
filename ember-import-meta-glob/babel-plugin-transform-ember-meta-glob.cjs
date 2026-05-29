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

  const transformLazyImportMetaGlob = (path, files) => {
    const newObjectProperties = files.map((file) => {
      return t.objectProperty(
        t.stringLiteral(file),
        t.arrowFunctionExpression(
          [],
          t.callExpression(
            t.identifier('require'),
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
        debug('Plugin running', state);

        if (!isImportMetaGlobExpression(node)) return;
        const isEager = isEagerImportMetaGlobExpression(node);
        const glob = node.arguments[0].value;

        // TODO: find cwd
        let cwd = process.cwd();
        if (state?.cwd && state?.filename) {
          const [ appPrefix ] = state.cwd.split('/').slice(-1);
          const regex = new RegExp(`^(?:.*?\\b${appPrefix}\/${appPrefix}\\b){1}`);
          const embroiderAppPath = 'node_modules/.embroider/rewritten-app';
          cwd = state.filename.includes(embroiderAppPath)
            /* In Ember Webpack, the app we need to transform is the rewritten app. */
            ? dirname(state.filename)
            /* In Ember Classic, we end up with path-to-app/app-prefix/app-prefix/path-to-file
             * in state filename instead of path-to-app/app-prefix/app/path-to-file */
            : dirname(join(state.cwd, state.filename.replace(regex, 'app')));
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

        isEager
          ? transformEagerImportMetaGlob(path, files)
          : transformLazyImportMetaGlob(path, files);
      },
    },
  };
};

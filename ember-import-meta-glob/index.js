'use strict';

const BabelPluginImportMetaGlob = require.resolve('babel-plugin-import-meta-glob');

module.exports = {
  name: require('./package').name,

  included(appOrParent) {
    this._super.included.apply(this, arguments);
    appOrParent.options.babel.plugins.push(
      BabelPluginImportMetaGlob
    );
  },
};

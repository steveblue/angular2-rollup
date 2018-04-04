// rollup.config.lib-umd.js

export default {
  entry: 'ngfactory/default-lib.js',
  moduleName: 'default-lib',
  dest: 'dist/bundles/default-lib.umd.js',
  sourceMap: false,
  onwarn: function ( message ) {

    return;

  }
}

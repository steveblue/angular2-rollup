// rollup.config.lib.js

export default {
  entry: 'ngfactory/default-lib.js',
  moduleName: 'default-lib',
  dest: 'dist/esm2015/default-lib.js',
  sourceMap: false,
  onwarn: function ( message ) {

    return;

  }
}

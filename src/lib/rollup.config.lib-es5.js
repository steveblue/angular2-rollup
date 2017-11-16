// rollup.config.lib-es5.js

export default {
  entry: 'ngfactory/default-lib.js',
  moduleName: 'default-lib',
  dest: 'dist/default-lib.es5.js',
  sourceMap: false,
  onwarn: function ( message ) {

    return;

  }

}

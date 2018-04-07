// rollup.config.lib.js

export default {
  input: 'ngfactory/default-lib.js',
  output: {
    file: 'dist/fesm2015/default-lib.js',
    format: 'es',
    sourcemap: false
  },
  onwarn: function ( message ) {

    return;

  }
}

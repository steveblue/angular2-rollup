// rollup.config.lib.js

export default {
  input: 'out-tsc/default-lib.js',
  output: {
    file: 'dist/{{projectName}}/fesm2015/default-lib.js',
    format: 'es',
    sourcemap: false
  },
  onwarn: function ( message ) {

    return;

  }
}

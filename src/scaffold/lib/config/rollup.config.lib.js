// rollup.config.lib.js

export default {
  input: 'out-tsc/es2015/{{projectName}}.js',
  output: {
    file: 'dist/{{projectName}}/fesm2015/{{projectName}}.js',
    format: 'es',
    sourcemap: false
  },
  onwarn: function ( message ) {

    return;

  }
}

// rollup.config.lib-es5.js

export default {
  input: 'out-tsc/default-lib.js',
  output: {
    file: 'dist/{{projectName}}/fesm5/default-lib.js',
    format: 'es',
    sourcemap: true
  },
  onwarn: function ( message ) {

    return;

  }

}

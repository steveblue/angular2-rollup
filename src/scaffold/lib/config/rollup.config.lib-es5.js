// rollup.config.lib-es5.js

export default {
  input: 'out-tsc/es5/{{projectName}}.js',
  output: {
    file: 'dist/{{projectName}}/fesm5/{{projectName}}.js',
    format: 'es',
    sourcemap: true
  },
  onwarn: function ( message ) {

    return;

  }

}

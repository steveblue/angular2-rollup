// rollup.config.lib.js

export default {
  input: 'out-tsc/es2015/{{folderName}}.js',
  output: {
    file: 'dist/{{projectName}}/fesm2015/{{folderName}}.js',
    format: 'es',
    sourcemap: false
  },
  onwarn: function ( message ) {

    return;

  }
}

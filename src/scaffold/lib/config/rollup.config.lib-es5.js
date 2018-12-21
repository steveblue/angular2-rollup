// rollup.config.lib-es5.js

export default {
  input: 'out-tsc/es5/{{folderName}}.js',
  output: {
    file: 'dist/{{projectName}}/fesm5/{{folderName}}.js',
    format: 'es',
    sourcemap: true
  },
  onwarn: function ( message ) {

    return;

  }

}

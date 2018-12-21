// rollup.config.lib-umd.js

export default {
  input: 'out-tsc/es5/{{folderName}}.js',
  output: {
    file: 'dist/{{projectName}}/bundles/{{folderName}}.umd.js',
    format: 'cjs',
    sourcemap: true
  },
  onwarn: function ( message ) {

    return;

  }
}

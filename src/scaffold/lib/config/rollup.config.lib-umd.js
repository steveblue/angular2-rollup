// rollup.config.lib-umd.js

export default {
  input: 'out-tsc/es5/{{projectName}}.js',
  output: {
    file: 'dist/{{projectName}}/bundles/{{projectName}}.umd.js',
    format: 'cjs',
    sourcemap: true
  },
  onwarn: function ( message ) {

    return;

  }
}

// rollup.config.lib-umd.js

export default {
  input: 'out-tsc/default-lib.js',
  output: {
    file: 'dist/bundles/default-lib.umd.js',
    format: 'cjs',
    sourcemap: true
  },
  onwarn: function ( message ) {

    return;

  }
}

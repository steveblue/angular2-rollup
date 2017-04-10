// rollup.config.js

import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve-angular';
import cleanup from 'rollup-plugin-cleanup';
import commonjs from 'rollup-plugin-commonjs';

const paths = require('./paths.config.js');

export default {
  entry: 'main.prod.js',
  format: 'iife',
  dest: paths.build+'/bundle.es2015.js',
  sourceMap: false,
  treeshake: true,
  plugins: [
    replace({ 'ENVIRONMENT': JSON.stringify( 'production' ) }),
    commonjs({
     include: 'node_modules/rxjs/**'
    }),
    resolve({
      es2015: true,
      module: true,
      jsnext: true,
      main: true,
      extensions: [ '.js', '.json' ],
      preferBuiltins: false
    }),
    cleanup()
  ],
  onwarn: function ( message ) {
    if ( /at the top level of an ES module, and has been rewritten/.test( message ) ) {
      return;
    }
    console.error( message );
  }
}

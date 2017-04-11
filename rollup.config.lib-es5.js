// rollup.config.lib.js

import angular from 'rollup-plugin-angular';

const paths = require('./paths.config.js');

export default {
  entry: 'ngfactory/default-lib.js',
  format: 'iife',
  module: 'none',
  dest: paths.dist+'/default-lib.es5.js',
  sourceMap: false,
  onwarn: function ( message ) {
    if ( /at the top level of an ES module, and has been rewritten/.test( message ) ) {
      return;
    }
    console.error( message );
  }
}

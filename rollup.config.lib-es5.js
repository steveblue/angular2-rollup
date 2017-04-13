// rollup.config.lib.js

const paths = require('./paths.config.js');

export default {
  entry: 'ngfactory/'+paths.libFilename+'.js',
  format: 'iife',
  moduleName: paths.libFilename,
  dest: paths.dist+'/'+paths.libFilename+'.es5.js',
  sourceMap: false,
  onwarn: function ( message ) {

    return;

  }
}

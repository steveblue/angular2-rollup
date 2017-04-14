// rollup.config.lib.js

const paths = require('./build.config.js');

export default {
  entry: 'ngfactory/'+paths.libFilename+'.js',
  format: 'iife',
  moduleName: paths.libFilename,
  dest: paths.dist+'/'+paths.libFilename+'.js',
  sourceMap: false,
  onwarn: function ( message ) {

    return;

  }
}

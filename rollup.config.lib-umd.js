// rollup.config.lib.js

const paths = require('./paths.config.js');

export default {
  entry: 'ngfactory/'+paths.libFilename+'.js',
  format: 'umd',
  moduleName: paths.libFilename,
  dest: paths.dist+'/bundles/'+paths.libFilename+'.umd.js',
  sourceMap: false,
  onwarn: function ( message ) {

    return;

  }
}

// rollup.config.lib-umd.js

const paths = require('./build.config.js');

export default {
  entry: 'ngfactory/'+paths.libFilename+'.js',
  moduleName: paths.libFilename,
  dest: paths.dist+'/bundles/'+paths.libFilename+'.umd.js',
  sourceMap: false,
  onwarn: function ( message ) {

    return;

  }
}

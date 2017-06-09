// rollup.config.lib-es5.js

const paths = require('./build.config.js');

export default {
  entry: 'ngfactory/'+paths.libFilename+'.js',
  moduleName: paths.libFilename,
  dest: paths.dist+'/'+paths.libFilename+'.es5.js',
  sourceMap: false,
  onwarn: function ( message ) {

    return;

  }

}

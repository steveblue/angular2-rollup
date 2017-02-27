// rollup.build.js

const rollup  = require('rollup');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const cleanup = require('rollup-plugin-cleanup');
const commonjs = require('rollup-plugin-commonjs');

var bundle = rollup.rollup({
    entry: './main.prod.js',
    sourceMap: false,
    treeshake: true,
    plugins: [
      replace({ 'ENVIRONMENT': JSON.stringify( 'production' ) }),
      commonjs({
       include: 'node_modules/rxjs/**'
      }),
      resolve({ jsnext: true, module: true }),
      cleanup()
    ],
    onwarn: function ( message ) {
      if ( /at the top level of an ES module, and has been rewritten/.test( message ) ) {
        return;
      }
      console.error( message );
    }
  }
})
.then(bundle => {
    return bundle.write({
        format: 'iife',
        dest: 'dist/bundle.es2015.js'
    })
}).catch(err => console.log(err));

Promise.all([bundle]).then(() => console.log('Rollup!'))

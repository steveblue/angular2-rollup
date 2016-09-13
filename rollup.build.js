// rollup.build.js

const rollup  = require('rollup');
const alias   = require('rollup-plugin-alias');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const include = require('rollup-plugin-includepaths');
const closure = require('google-closure-compiler-js');
const cleanup = require('rollup-plugin-cleanup');

var bundle = rollup.rollup({
    entry: './main.prod.js',
    plugins: [
      alias({ rxjs: __dirname + '/node_modules/rxjs-es' }),
      resolve({ module: true }),
      replace({ 'ENVIRONMENT': JSON.stringify( 'production' ) }),
      cleanup()
    ]
})
.then(bundle => {
    return bundle.write({
        format: 'iife',
        dest: 'dist/bundle.es2015.js'
    })
}).catch(err => console.log(err));

Promise.all([bundle]).then(() => console.log('Rollup!'))

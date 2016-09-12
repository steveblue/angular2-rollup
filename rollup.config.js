// rollup.config.js

import alias from 'rollup-plugin-alias';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import include from 'rollup-plugin-includepaths';
import typescript from 'rollup-plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';

const closure = require('google-closure-compiler-js');

function transpile(){
  return {
    transformBundle(bundle){
      var transformed = closure.compile({jsCode: [{src: bundle}]});
      return transformed.compiledCode;
    }
  }
}

export default {
  entry: 'main.prod.js',
  format: 'iife',
  dest: 'dist/bundle.es2015.js',
  sourceMap: false,
  plugins: [
    alias({ rxjs: __dirname + '/node_modules/rxjs-es' }),
    replace({ 'ENVIRONMENT': JSON.stringify( 'production' ) }),
    resolve({ module: true }),
    cleanup()
  ]
}

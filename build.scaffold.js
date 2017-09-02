"use strict";

require('shelljs/global');

const fs          = require('fs');
const path        = require('path');
const colors      = require('colors');
const clim = require('clim');
const cons = clim();

let lib = false;

const log = function (action, noun, verb, next) {
    let a = action ? colors.magenta(action) : '';
    let n = noun ? colors.green(noun) : '';
    let v = verb ? colors.cyan(verb) : '';
    let x = next ? colors.dim(colors.white(next)) : '';
    cons.log(a + ' ' + n + ' ' + v + ' ' + x );
};


const files     = [
    'src',
    '.editorconfig',
    '.gitignore',
    '.npmignore',
    'build.config.js',
    'karma-test-shim.js',
    'karma.conf.js',
    'main.prod.ts',
    'main.ts',
    'postcss.dev.js',
    'postcss.prod.js',
    'protractor.config.js',
    'rollup.config.js',
    'rollup.config.lib.js',
    'rollup.config.lib-es5.js',
    'rollup.config.lib-umd.js',
    'router.js',
    'server.config.dev.js',
    'server.config.prod.js',
    'server.js',
    'tsconfig.dev.json',
    'tsconfig.prod.json',
    'tsconfig.lib.json',
    'tsconfig.lib.es5.json',
    'tsconfig.json',
    'tslint.json'
];



/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg)=>{
  if (arg.includes('lib')) {
      lib = true;
  }
});


/*

  Copy Tasks

- file: Copies a file to /dist

*/

const copy = {
    file: (p) => {
        cp('-R', p, path.dirname(process.cwd()) + '/' + path.basename(process.cwd())+'/');
        log(p.split('/')[p.split('/').length - 1], 'copied', 'to', path.dirname(process.cwd()) + '/' + path.basename(process.cwd())+'/');
    },
    scaffold: (files) => {
        files.forEach((filename)=>{
            copy.file(path.dirname(fs.realpathSync(__filename)) + '/' + filename);
        })
    }
};



let init = function() {

    if (lib == false) {

        copy.scaffold(files.filter((filename)=>{
            return filename.includes('lib') === false;
        }));

        rm('-rf', path.dirname(process.cwd()) + '/' + path.basename(process.cwd()) + '/src/lib');

    } else {
        copy.scaffold(files);
    }

    cp(path.dirname(fs.realpathSync(__filename)) + '/package.scaffold.json', path.dirname(process.cwd()) + '/' + path.basename(process.cwd())+'/package.json');

    fs.readFile(path.dirname(fs.realpathSync(__filename)) + '/package.scaffold.json', (err, script) => {

        if (err) throw err;

        script = JSON.parse(script);
        script.name = path.basename(process.cwd());

        fs.writeFile(path.dirname(process.cwd()) + '/' + path.basename(process.cwd())+'/package.json', JSON.stringify(script, null, 4), function (err) {
            if (err) log(err);
        });

      });


};


init();
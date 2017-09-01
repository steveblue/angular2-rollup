"use strict";

require('shelljs/global');

const fs          = require('fs');
const path        = require('path');
const utils       = require(path.dirname(fs.realpathSync(__filename))+'/build.utils.js');


const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const paths     = utils.paths;
const log       = utils.log;
const warn      = utils.warn;
const clean     = utils.clean;



const files     = [
    'conf',
    'src',
    '.editorconfig',
    '.gitignore',
    '.npmignore',
    'karma-test-shim.js',
    'karma.conf.js',
    'main.prod.ts',
    'main.ts',
    'package.json',
    'postcss.dev.js',
    'postcss.prod.js',
    'protractor.config.js',
    'rollup.config.js',
    'rollup.config.lib.js',
    'rollup.config.lib-es5.js',
    'rollup.config.lib-umd.js',
    'router.js',
    'server.js',
    'tsconfig.dev.json',
    'tsconfig.prod.json',
    'tsconfig.lib.json',
    'tsconfig.lib-es5.json',
    'tsconfig.json',
    'tslint.json'
];



/* Test for arguments the ngr cli spits out */

// process.argv.forEach((arg)=>{
//   if (arg.includes('watch')) {}
// });


/*

  Copy Tasks

- file: Copies a file to /dist

*/

const copy = {
    file: (path) => {
        cp('-R', path, paths.projectRoot+'/');
        log(path, 'copied', 'to', paths.projectRoot+'/');
    },
    scaffold: (files) => {
        files.forEach((filename)=>{
            copy.file(paths.cliRoot + '/' + filename);
        })
    }
};



let init = function() {

    // console.log('GLOBAL ', paths.cliRoot);
    // console.log('LOCAL ', paths.projectRoot);
    copy.scaffold(files);


};


init();
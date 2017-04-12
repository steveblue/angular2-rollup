"use strict";

require('shelljs/global');

const clim = require('clim');
const cons = clim();
const colors = require('chalk');
const scripts = require('./package.json').scripts;
const paths = require('./paths.config.js');

const linter = require('tslint').Linter;
const tslintConfig = require('tslint').Configuration;
const tslintOptions = {
    formatter: 'json',
    rulesDirectory: 'node_modules/codelyzer'
};

/* Log Formatting */

clim.getTime = function(){
  let now = new Date();
  return colors.gray(colors.dim('['+
         now.getHours() + ':' +
         now.getMinutes() + ':' +
         now.getSeconds() + ']'));
};

const utils = {
    paths: paths,
    scripts: scripts,
    console: cons,
    colors: colors,
    log : (action, noun, verb, next) => {
        let a = action ? colors.magenta(action) : '';
        let n = noun ? colors.green(noun) : '';
        let v = verb ? colors.cyan(verb) : '';
        let x = next ? colors.dim(colors.white(next)) : '';
        cons.log(a + ' ' + n + ' ' + v + ' ' + x );
    },
    warn : function(action, noun) {
        let a = action ? colors.red(action) : '';
        let n = noun ? colors.white(noun) : '';
        cons.warn(a + ' ' + n);
    },
    tslint : (path, env) => {

        if (!path) {
        return;
        }

        let program = Linter.createProgram('./tsconfig.'+env+'.json', path ? path.substring(0, path.lastIndexOf('/')) : './'+paths.src+'/');
        let files = Linter.getFileNames(program);
        let results = files.map(file => {

            let fileContents = fs.readFileSync(file, 'utf8');
            let linter = new Linter(options);
            console.log(file);
            let configLoad = Configuration.findConfiguration('./tsconfig.'+env+'.json', file );
            let results = linter.lint(file, fileContents, configLoad.results);

            if (results && results.failureCount > 0) {
                let failures = JSON.parse(results.output);
                for (let i = 0; i < failures.length; i++) {
                    log('tslint:',
                        colors.red(failures[i].failure),
                        colors.white('[' + failures[i].startPosition.line +
                        ', ' + failures[i].startPosition.character + ']'),
                        failures[i].name);
                }

            }

        });
    }

};

module.exports = utils;

const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const util = require('./../util.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class BabelBuilder {

    constructor() { }

    compileUMD(outFile) {
        return new Promise((res, rej) => {
            console.log(outFile);
            let transpile = exec(path.normalize(config.processRoot + '/node_modules/.bin/babel') +
                ' --source-maps' +
                ' --presets=es2015-rollup ' +
                ' --plugins=transform-es2015-modules-commonjs ' +
                ' --module umd ' +
                path.normalize(outFile) +
                ' --out-file ' + path.normalize(outFile), (code, output, error) => {

                    let fetchHelpers = exec(path.normalize(config.processRoot + '/node_modules/.bin/babel-external-helpers') +
                        ' --output-type global ', { silent: true }, (code, output, error) => {

                            fs.readFile(path.normalize(outFile), 'utf8', (err, contents) => {
                                if (err) rej(err);
                                if (!err) {
                                    contents = contents.replace("'use strict';", "'use strict';" + "\n" + output);
                                    fs.writeFile(path.normalize(outFile), contents, 'utf-8', () => { });
                                }
                            });
                        });

                    util.alert('babel', 'transpiled', path.normalize(outFile));
                    res(outFile);

                });


        });
    }

    compileES5(outFile) {
        return new Promise((res, rej) => {


            let transpile = exec(path.normalize(config.processRoot + '/node_modules/.bin/babel') +
                ' --source-maps' +
                ' --presets=es2015-rollup ' + (outFile) +
                ' --out-file ' + (outFile), (code, output, error) => {

                    let fetchHelpers = exec(path.normalize(config.processRoot + '/node_modules/.bin/babel-external-helpers') +
                        ' --output-type global ', { silent: true }, (code, output, error) => {

                            fs.readFile(path.normalize(outFile), 'utf8', (err, contents) => {
                                if (!err) {
                                    contents = output + '\n' + contents;
                                    fs.writeFile(path.normalize(outFile), contents, 'utf-8', () => { });
                                }
                            });
                        });

                    util.alert('babel', 'transpiled', path.normalize(outFile));
                    res(outFile);

                });

        });
    }

}


module.exports = BabelBuilder;

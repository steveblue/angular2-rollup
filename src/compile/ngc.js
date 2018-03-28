const path = require('path');
const fs = require('fs');
const colors = require('colors');
const exec = require('child_process').exec;
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class AOTBuilder {

    constructor() {}

    compile(tsConfigPath) {

        return new Promise((res) => {

            let hasCompiled = false;

            if (util.hasArg('watch')) {
                let lastData = '';

                log.message('@angular/compiler started AOT compilation');

                const ngc = exec(path.join('node_modules', '.bin', 'ngc') + ' -p ' + tsConfigPath + ' --watch', { silent: true });


                ngc.stderr.on('data', (stderr) => {

                    if (stderr.includes('Compilation complete.')) {
                        log.clear();
                        log.message(colors.green(stderr));
                        lastData = '';
                    }
                    else if (stderr.includes('File change')) {
                       log.message(colors.white(stderr).dim);
                    }
                    else if (stderr.includes('Compilation failed.')) {
                        log.message(colors.white(stderr).dim);
                    }
                    else {

                        log.line();

                        if (stderr.split('\n').length > 0) {

                            let tsError = stderr.split('\n').filter((e) => {
                                return e.length > 0;
                            }).forEach((e) => {
                                if (e.includes('error TS')) {
                                    log.formatTSError(e)
                                }
                            });

                        }
                        if (stderr.split(/\n:\s/g).length > 0) {

                            let templateErr = stderr.split(/\n:\s/g).filter((e) => {
                                return e.includes('error TS') === false;
                            }).forEach((e) => {
                                log.formatTemplateError(e)
                            });

                        }

                    }
                    if (hasCompiled == false && stderr.includes('Compilation complete.')) {
                        hasCompiled = true;
                        res();
                    }
                });

            } else {

                let ngc = exec(path.join('node_modules', '.bin', 'ngc') + ' -p ' + tsConfigPath, {silent: true}, (error, stdout, stderr) => {

                    if (stderr) {

                        log.line();

                        if (stderr.split('\n').length > 0) {

                            let tsError = stderr.split('\n').filter((e) => {
                                return e.length > 0;
                            }).forEach((e) => {
                                if (e.includes('error TS')) {
                                    log.formatTSError(e)
                                }
                            });

                        }
                        if (stderr.split(/\n:\s/g).length > 0) {

                            let templateErr = stderr.split(/\n:\s/g).filter((e) => {
                                return e.includes('error TS') === false;
                            }).forEach((e) => {
                                log.formatTemplateError(e)
                            });

                        }

                    } else {
                        log.message('Compilation complete.');
                        res();
                    }
                });


            }

        });
    }



    compileMain() {

        return new Promise((res) => {

            const outFile = path.join(config.projectRoot, config.build, 'main.ts');
            const tscPath = path.join(config.projectRoot, 'node_modules', '.bin', 'tsc');

            fs.readFile(path.join(config.projectRoot, 'main.ts'), 'utf8', (err, contents) => {
                if (!err) {
                    contents = contents.replace("./ngfactory/" + config.src + "/app/app.module.ngfactory", config.src + "/app/app.module.ngfactory");
                    contents = contents.replace("import { enableProdMode } from '@angular/core';", '');
                    contents = contents.replace("enableProdMode();", "");
                    fs.writeFile(outFile, contents, (err) => {
                        if (!err) {

                        let transpile = exec(`${tscPath} ${outFile} --target es5 --module commonjs --emitDecoratorMetadata true --experimentalDecorators true --sourceMap true --moduleResolution node --typeRoots node --lib dom,es2017`,
                                            { silent: true },
                                            (error, stdout, stderr) => {
                                                rm(outFile);
                                                if(error.killed) {
                                                    log.error(log.formatTSError(error));
                                                } else {
                                                    res();
                                                }
                                            });
                        } else {
                            rej(err);
                        }
                    });
                } else {
                    rej(err);
                }

            });

        });
    }



}


module.exports = AOTBuilder;
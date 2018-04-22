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

                log.message('@angular/compiler started AOT compilation');

                const ngc = exec(path.join(config.projectRoot, 'node_modules', '.bin', 'ngc') + ' -p ' + tsConfigPath + ' --watch', { silent: true });

                ngc.stderr.on('data', (stderr) => {
                    //console.log('STDERR:', stderr);
                    let hasLine = false;

                    if (hasCompiled == false && stderr.includes('Compilation complete.')) {
                        hasCompiled = true;
                        log.success('Compilation complete.', ['TypeScript']);
                        res();
                    } else {
                      this.handleError(stderr);
                    }
                });

            } else {

                let ngc = exec(path.join(config.projectRoot, 'node_modules', '.bin', 'ngc') + ' -p ' + tsConfigPath, {silent: true}, (error, stdout, stderr) => {

                    if (stderr) {
                        this.handleError(stderr);
                    } else {
                        log.success('Compilation complete.', ['TypeScript']);

                        if (cli.env === 'dev') {
                            log.break();
                        }

                        res();
                    }
                });


            }

        });
    }

    handleError(stderr) {

        if (stderr.includes('Compilation complete.')) {
          log.success(stderr, ['TypeScript']);
        }
        else if (stderr === ': Compilation failed. Watching for file changes.') {
          log.fail(stderr);
        }
        else if (stderr.includes('File change')) {
          log.message(stderr, ['TypeScript']);
        }
        else {

            if (stderr.split('\n').length > 0) {
                //if (!hasLine) log.line();
                //hasLine = true;
                let tsError = stderr.split('\n').filter((e) => {
                    return e.length > 0;
                }).forEach((e) => {
                    if (e.includes('error TS')) {
                        //console.log('TS ERROR:', e);
                        log.formatTSError(e)
                    }
                });

            }

            if (stderr.split(/\n:\s/g).length > 0) {
                //if (!hasLine) log.line();
                //hasLine = true;
                let templateErr = stderr.split(/\n:\s/g).filter((e) => {
                    return e.includes('error TS') === false;
                }).forEach((e) => {
                    //console.log('Template ERROR:', e);
                    log.formatTemplateError(e)
                });

            }

        }

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
                                                  log.formatTSError(error);
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

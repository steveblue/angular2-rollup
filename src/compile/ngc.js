const path = require('path');
const fs = require('fs');
const colors = require('colors');
const exec = require('child_process').exec;
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

let interval;

class AOTBuilder {

    constructor() {}

    compile(tsConfigPath) {

        return new Promise((res) => {

            let hasCompiled = false;

            if (util.hasArg('watch')) {

                log.process('@angular/compiler');

                const ngc = exec(path.join(config.projectRoot, 'node_modules', '.bin', 'ngc') + ' -p ' + tsConfigPath + ' --watch', { silent: true });

                ngc.stderr.on('data', (stderr) => {

                    log.stop('@angular/compiler');
                    let hasLine = false;

                    if (hasCompiled == false && stderr.includes('Compilation complete.')) {
                        hasCompiled = true;
                        if (!cli.program.verbose) log.destroy();
                        log.message('Compilation complete. Watching for file changes.', ['TypeScript']);
                        res();
                    } else {
                      this.handleError(stderr);
                    }

                });

            } else {

                log.process('@angular/compiler');

                let ngc = exec(path.join(config.projectRoot, 'node_modules', '.bin', 'ngc') + ' -p ' + tsConfigPath, {silent: true}, (error, stdout, stderr) => {
                    //if (config.build !== 'lib') clearInterval(interval);
                    log.stop('@angular/compiler');
                    if (stderr) {
                        this.handleError(stderr);
                    } else {
                        if (!cli.program.verbose) log.destroy();
                        log.message('Compilation complete.', ['TypeScript']);
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
          log.success(stderr, ['TypeScript']);
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
            let inFile = path.join(config.src, 'main.ts');
            let outFile = path.join(config.projectRoot, config.build, 'main.ts');
            let modulePattern = 'commonjs';
            const tscPath = path.join(config.projectRoot, 'node_modules', '.bin', 'tsc');


            if (cli.env === 'prod') {
                outFile = path.join('out-tsc/src/main.ts');
                modulePattern = 'ES2015';
            }

            fs.readFile(inFile,  'utf8', (err, contents) => {
                if (!err) {

                    contents = contents.replace(/platformBrowserDynamic/g, 'platformBrowser');
                    contents = contents.replace(/platform-browser-dynamic/g, 'platform-browser');
                    contents = contents.replace(/bootstrapModule/g, 'bootstrapModuleFactory');
                    contents = contents.replace(/AppModule/g, 'AppModuleNgFactory');
                    if (cli.env === 'dev') {
                        contents = contents.replace('./app/app.module', './src/app/app.module.ngfactory');
                    } if (cli.env === 'prod') {
                        contents = contents.replace('./app/app.module', './app/app.module.ngfactory');
                    }

                    fs.writeFile(outFile, contents, (err) => {
                        if (!err) {

                        let transpile = exec(`${tscPath} ${outFile} --target es5 --module ${modulePattern} --emitDecoratorMetadata true --experimentalDecorators true --sourceMap true --moduleResolution node --typeRoots node --lib dom,es2017`,
                                            { silent: true },
                                            (error, stdout, stderr) => {
                                                rm(outFile);
                                                if(error && error.killed) {
                                                  log.formatTSError(error);
                                                } else {
                                                    res();
                                                }
                                            });
                        }
                        else {
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

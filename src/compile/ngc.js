const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const util = require('./../util.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class AOTBuilder {

    constructor() {}

    compile(tsConfigPath) {

        return new Promise((res) => {

            let hasCompiled = false;

            if (util.hasArg('watch')) {
                let lastData = '';

                util.log('@angular/compiler started AOT compilation');

                const ngc = exec(path.join('node_modules', '.bin', 'ngc') + ' -p ' + tsConfigPath + ' --watch');

                ngc.stderr.on('data', (data) => {
                    if (data.includes('Compilation complete.')) {
                        util.log(data);
                    }

                    if (data.includes('error') && data !== lastData) {
                        let err = data.split('\n').filter((e) => {
                            return e.length > 0;
                        }).forEach((e) => {
                            util.error(util.formatTSError(e));
                        });
                        lastData = data;
                    }

                    if (hasCompiled == false && data.includes('Compilation complete.')) {
                        hasCompiled = true;
                        res();
                    }
                });

            } else {


                let ngc = exec(path.normalize(path.resolve('node_modules', '.bin', 'ngc') +
                ' -p ' + path.normalize('./tsconfig.' + cli.env + '.json')), { silent: true }, function (code, output, error) {
                    if (error) {

                        let err = error.split('\n').filter((e) => {
                            return e.length > 0;
                        }).forEach((e) => {
                            util.error(util.formatTSError(e));
                        });

                    } else {
                        util.log('Compilation complete.');
                        res('done');
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
                                                    util.error(util.formatTSError(error));
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
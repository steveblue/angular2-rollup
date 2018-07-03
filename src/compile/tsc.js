const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class TSBuilder {

    constructor() {}

    compile(tsConfigPath) {

        return new Promise((res) => {

            let hasCompiled = false;
            log.process('typescript');

            let tsc = exec(path.normalize(path.resolve('node_modules', '.bin', 'tsc') +
                ' -p ' + tsConfigPath), {}, function (error, stdout, stderr) {
                    log.stop('typescript');
                if (error) {
                    log.warn(stdout);
                } else {
                    log.message('Compilation complete.', ['TypeScript']);
                    res('done');
                }
            });

        });
    }


    compileToCommonJS(filePath, outFile) {

        const tscPath = path.join(config.projectRoot, 'node_modules', '.bin', 'tsc');
        return new Promise((res) => {

            if(!outFile) outFile = filePath.replace('.ts', '.js');

            log.process('typescript');

            exec(`${tscPath} ${filePath} --outFile ${outFile} --target es5 --module commonjs --emitDecoratorMetadata true --experimentalDecorators true --sourceMap true --moduleResolution node --typeRoots node --lib dom,es2017`,
                { silent: true },
                (error) => {
                    log.stop('typescript');
                    if (error.killed) {
                        log.error(error);
                    } else {
                        res();
                    }
                });

        });
    }

    compileMain() {

        return new Promise((res) => {

            const outFile = path.join(config.projectRoot, config.build, 'main.ts');
            const tscPath = path.join(config.projectRoot, 'node_modules', '.bin', 'tsc');

            fs.readFile(path.join(config.projectRoot, 'main.ts'), 'utf8', (err, contents) => {

                if (!err) {
                    contents = contents.replace("./out-tsc/" + config.src + "/app/app.module.ngfactory", config.src + "/app/app.module");
                    contents = contents.replace("import { enableProdMode } from '@angular/core';", '');
                    contents = contents.replace("enableProdMode();", "");
                    contents = contents.replace(/platformBrowser/g, "platformBrowserDynamic");
                    contents = contents.replace(/AppModuleNgFactory/g, "AppModule");
                    contents = contents.replace("@angular/platform-browser", "@angular/platform-browser-dynamic");
                    contents = contents.replace("bootstrapModuleFactory", "bootstrapModule");
                    fs.writeFile(outFile, contents, (err) => {
                        if (!err) {

                        let transpile = exec(`${tscPath} ${outFile} --target es5 --module commonjs --emitDecoratorMetadata true --experimentalDecorators true --sourceMap true --moduleResolution node --typeRoots node --lib dom,es2017`,
                                            { silent: true },
                                            (error, stdout, stderr) => {
                                                rm(outFile);
                                                if(error.killed) {
                                                    log.error(error);
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


module.exports = TSBuilder;

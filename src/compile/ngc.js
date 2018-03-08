const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const util = require('./../util.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class AOTBuilder {

    constructor() {}

    // TODO: Allow any tsconfig
    compileSrc() {

        let hasCompiled = false;

        return new Promise((res, rej) => {

            if (cli.program.watch) {

                util.log('@angular/compiler started');
                console.log('');

                const child = exec(path.resolve('node_modules', '.bin', 'ngc') + ' -p ' + path.normalize('./tsconfig.' + cli.env + '.json') + ' --watch');

                child.stderr.on('data', (data) => {
                    if (hasCompiled === false && data.includes('Compilation complete.')) {
                        hasCompiled = true;
                        res();
                    }
                    if (data.includes('Compilation complete.')) {
                        util.log(data);
                    }
                    if (data.includes('error')) {
                        util.error(data);
                    }
                });

            } else {

        
                let ngc = exec(path.normalize(path.resolve('node_modules', '.bin', 'ngc') +
                    ' -p ' + path.normalize('./tsconfig.' + cli.env + '.json')), { silent: true }, function (code, output, error) {
                        if (error) {
                            warn(error);
                            return;
                        } else {
                            res('done');
                        }
                    });
                

            }
        });

    }

    compileMain() {

        return new Promise((res, rej) => {

            const outFile = path.join(config.projectRoot, config.build, 'main.ts');

            fs.readFile(path.join(config.projectRoot, 'main.prod.js'), 'utf8', (err, contents) => {
                if (!err) {
                    contents = contents.replace("./ngfactory/" + config.src + "/app/app.module.ngfactory", config.src + "/app/app.module.ngfactory");
                    contents = contents.replace('import { enableProdMode } from "@angular/core";', '');
                    contents = contents.replace("enableProdMode();", "");
                    fs.writeFile(outFile, contents, (err) => {
                        if (!err) {
                            let transpile = exec(path.join(config.projectRoot, 'node_modules/.bin/tsc') +
                                ' ' + outFile + ' --target es5 --module commonjs' +
                                ' --emitDecoratorMetadata true --experimentalDecorators true' +
                                ' --noImplicitAny false --sourceMap true --moduleResolution node' +
                                ' --typeRoots node --lib dom,es2017', { silent: true },
                                (error, stdout, stderr) => {

                                    res(outFile);

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
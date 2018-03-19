const path = require('path');
const fs = require('fs');
const util = require('./../util.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class ClosureBuilder {

    constructor() {

        this.jarPath = util.hasConfigProperty('jarPath', config.prodOptions) ? config.prodOptions.jarPath : path.resolve('node_modules', 'google-closure-compiler', 'compiler.jar');
        this.warningLevel = util.hasConfigProperty('warningLevel', config.prodOptions) ? config.prodOptions.warningLevel : 'QUIET';
        this.confPath = util.hasConfigProperty('confPath', config.prodOptions) ? config.prodOptions.confPath : path.normalize('closure.conf');
        this.outFile = util.hasConfigProperty('outBundle', config.prodOptions) ? config.prodOptions.outBundle : './' + config.build + '/bundle.js';
        this.manifestPath = util.hasConfigProperty('manifestPath', config.prodOptions) ? config.prodOptions.manifestPath : path.normalize('closure/manifest.MF');

    }

    bundle() {
        return new Promise((res) => {

            util.log('closure compiler started');
            // console.log(`java -jar ${this.jarPath} --warning_level=${this.warningLevel} --flagfile ${this.confPath} --js_output_file ${this.outFile} --output_manifest=${this.manifestPath}`);
            let closure = exec(`java -jar ${this.jarPath} --warning_level=${this.warningLevel} --flagfile ${this.confPath} --js_output_file ${this.outFile} --output_manifest=${this.manifestPath}`,
                { silent: true },
                (error, stdout, stderr) => {

                    if (stdout.includes('ERROR')) {
                        if (rej) rej(error);
                        util.error(error)
                    }
                    else if (stderr.includes('ERROR')) {

                        util.error(stderr);

                    }
                     else {
                        util.log('Compilation complete.');
                        if (res) {
                            res('done');
                        }
                    }

                });
        })
    }

}


module.exports = ClosureBuilder;
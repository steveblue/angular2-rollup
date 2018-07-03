const path = require('path');
const fs = require('fs');
const util = require('./../util.js');
const log = require('./../log.js');
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

            if (cli.program.rollup) {
                this.confPath = path.normalize('closure.rollup.conf')
            }

            log.process('closure compiler');
            let closure = exec(`java -jar ${this.jarPath} --warning_level=${this.warningLevel} --flagfile ${this.confPath} --js_output_file ${this.outFile} --output_manifest=${this.manifestPath}`,
                { silent: true },
                (error, stdout, stderr) => {
                    log.stop('closure compiler');
                    if (stdout.includes('ERROR')) {
                       error.split(/\n\n/g).forEach((str) => {
                         log.formatClosureError(str);
                       });
                    }
                    else if (stderr.includes('ERROR')) {
                       stderr.split(/\n\n/g).forEach((str) => {
                          log.formatClosureError(str);
                       });
                    }
                     else {
                        log.success('Optimization complete.', ['closure']);
                        if (res) {
                            res('done');
                        }
                    }

                });
        })
    }

}


module.exports = ClosureBuilder;

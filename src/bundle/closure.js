const path = require('path');
const fs = require('fs');
const util = require('./../util.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class ClosureBuilder {

    constructor() { }

    bundle() {
        return new Promise((res, rej) => {

            util.log('closure compiler started');
 
            let closure = exec(
                            //    `java -jar node_modules/google-closure-compiler/compiler.jar 
                            //    --warning_level=QUIET 
                            //    --flagfile closure.conf 
                            //    --js_output_file ./${config.build}/bundle.js 
                            //    --output_manifest=closure/manifest.MF`,
                require(config.projectRoot + '/package.json').scripts['bundle:closure'],
                { silent: true },
                (error, stdout, stderr) => {
                    
                    if (stdout.includes('ERROR')) {
                        util.error(error);
                        if (rej) {
                            rej(error);
                        }
                    } else {
                        util.log('closure compiler bundled');
                        if (res) {
                            res('done');
                        }
                    }

                });
        }) 
    }

}


module.exports = ClosureBuilder;
const path = require('path');
const fs = require('fs');
const util = require('./../util.js');
const config = require('./../config');
const log = require('./../log.js');
const cli = require('./../../cli.config.json');

class RollupBuilder {

    constructor() {}

    bundle(rollupConfigPath) {

        return new Promise((res, rej) => {

            log.message('rollup started');

            let rollup = exec(path.normalize(config.projectRoot + '/node_modules/.bin/rollup') +
                ' -c ' + rollupConfigPath, {silent: true}, (error, stdout, stderr) => {

                    if (stderr.includes('Error')) {
                        if (rej) rej(error);
                        log.error(stderr);

                    } else {
                        log.message(stderr);
                        res();
                    }

            });
        })
    }

}


module.exports = RollupBuilder;
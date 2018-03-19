const path = require('path');
const fs = require('fs');
const util = require('./../util.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class RollupBuilder {

    constructor() {}

    bundle(rollupConfigPath) {

        return new Promise((res, rej) => {

            util.log('rollup started');

            let rollup = exec(path.normalize(config.projectRoot + '/node_modules/.bin/rollup') +
                ' -c ' + rollupConfigPath, {silent: true}, (error, stdout, stderr) => {

                    if (stderr.includes('Error')) {
                        if (rej) rej(error);
                        util.error(stderr);

                    } else {
                        util.log(stderr);
                        res();
                    }

            });
        })
    }

}


module.exports = RollupBuilder;
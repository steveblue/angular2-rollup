const path = require('path');
const exec = require('child_process').exec;
const config = require('./../config');
const log = require('./../log.js');


class RollupBuilder {

    constructor() {}

    bundle(rollupConfigPath) {

        return new Promise((res, rej) => {

            log.message('rollup...');

            exec(path.normalize(config.projectRoot + '/node_modules/.bin/rollup') +
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
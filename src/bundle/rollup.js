const path = require('path');
const exec = require('child_process').exec;
const config = require('./../config');
const log = require('./../log.js');


class RollupBuilder {

    constructor() {
        this.isBundling = false;
    }

    bundle(rollupConfigPath) {

        return new Promise((res, rej) => {

            log.process('rollup');
            this.isBundling = true;

            exec(path.normalize(config.projectRoot + '/node_modules/.bin/rollup') +
                ' -c ' + rollupConfigPath, {silent: true}, (error, stdout, stderr) => {
                    log.stop('rollup');
                    if (stderr.includes('Error')) {
                        if (rej) rej(error);
                        this.isBundling = false;
                        log.error(stderr);

                    } else {
                        this.isBundling = false;
                        log.message(stderr);
                        res();
                    }

            });
        })
    }

}


module.exports = RollupBuilder;
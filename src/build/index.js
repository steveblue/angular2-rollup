const moment = require('moment');
const log = require('./../log.js');
const cli = require('./../../cli.config.json');

class Build {

    constructor() {
        this.startTime = moment(new Date());
        if (!cli.program.webpack) {
            log.message('ngr started');
        }
    }

}

module.exports = Build;
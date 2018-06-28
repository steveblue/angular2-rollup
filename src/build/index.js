const moment = require('moment');
const log = require('./../log.js');
const cli = require('./../../cli.config.json');
const config = require('./../config');

class Build {

    constructor() {
        this.outputPath = config.angular.projects[config.angular.defaultProject].architect.build.options.outputPath;
        this.startTime = moment(new Date());
        if (!cli.program.webpack) {
            log.message('build start');
        }
    }

}

module.exports = Build;
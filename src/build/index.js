const moment = require('moment');
const colors = require('colors');
const log = require('./../log.js');
const cli = require('./../../cli.config.json');
const config = require('./../config');

class Build {

    constructor() {
        this.outputPath = config.projects[config.project].architect.build.options.outputPath;
        this.startTime = moment(new Date());
        if (!cli.program.webpack) {
            log.alert(colors.green('build start'));
        }
    }

}

module.exports = Build;
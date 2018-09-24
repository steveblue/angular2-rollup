const moment = require('moment');
const colors = require('colors');
const log = require('./../log.js');
const cli = require('./../../cli.config.json');
const config = require('./../config');
const path = require('path');

class Build {
  constructor() {

    if (!config.projects) {
      log.error('NGR ERROR: ngr >= 2.0.0 requires projects schema in ngr.config.js');
    }
    this.outputPath = config.projects[config.project].architect.build.options.outputPath;
    this.startTime = moment(new Date());
    if (!cli.program.webpack) {
      const args = cli.program.rawArgs.filter((str) => {
        return !str.includes('node');
      }).map((str) => {
        return path.basename(str);
      });
      log.alert(colors.green('ngr ' + args.join(' ')));

    }
  }
}

module.exports = Build;

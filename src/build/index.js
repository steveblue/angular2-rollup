const moment = require('moment');
const log = require('./../log.js');
const colors = require('colors');

class Build {

    constructor() {
        this.startTime = moment(new Date());
        log.message('ngr started');
    }

}

module.exports = Build;
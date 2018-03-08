const moment = require('moment');

class Build {

    constructor() {
        this.startTime = moment(new Date());
    }

}

module.exports = Build;
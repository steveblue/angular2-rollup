require('shelljs/global');

const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');


class Scaffold {

    constructor() {}

    basic() {
        util.copyDir(path.normalize(config.cliRoot + '/src/scaffold/root'), config.projectRoot);
        util.copyDir(path.normalize(config.cliRoot + '/src/scaffold/src'), path.join(config.projectRoot, 'src'));
    }
    
}

module.exports = Scaffold;
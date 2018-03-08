
const findup = require('findup');
const path = require('path');
const utils = require('./util');

const processRoot = path.join(path.dirname(process.cwd()), path.basename(process.cwd()));
const projectRoot = findup.sync(processRoot, 'ngr.config.js');
const cliRoot = findup.sync(__dirname, 'package.json');

class Config {
    constructor() {
       
        let config = require(projectRoot + '/ngr.config.js');

        config.processRoot = processRoot;
        config.projectRoot = projectRoot;
        config.cliRoot = cliRoot;

        return config;

    }
}

module.exports = new Config();
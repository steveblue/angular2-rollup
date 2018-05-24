
const findup = require('findup');
const path = require('path');
const processRoot = path.join(path.dirname(process.cwd()), path.basename(process.cwd()));
const cliRoot = findup.sync(__dirname, 'package.json');
const projectRoot = require(path.join(cliRoot, 'cli.config.json')).projectRoot;

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
require('shelljs/global');

const path = require('path');
const fs = require('fs');
const detectInstalled = require('detect-installed');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');


class Scaffold {

    constructor() {}

    basic() {
        util.copyDir(path.normalize(config.cliRoot + '/src/scaffold/root'), config.projectRoot);
        util.copyDir(path.normalize(config.cliRoot + '/src/scaffold/src'), path.join(config.projectRoot, 'src'));
        this.done();
    }

    done() {

        const npmExists = detectInstalled.sync('npm');

        if (cli.program.noinstall === true) {

            log.message(util.getFileName(config.projectRoot) + ' is ready');
            log.break();
            
        } else {
            if (cli.program.yarn) {
                let install = exec('yarn install');
                install.stdout.on('data', (data) => { log.message(data) });
                install.stderr.on('data', (data) => { log.message(data) });
            }
            else if (npmExists) {
                let install = exec('npm install');
                install.stdout.on('data', (data) => { process.stdout.write(data) });
                install.stderr.on('data', (data) => { process.stdout.write(data) });
            }
        }


    }
    
}

module.exports = Scaffold;
require('shelljs/global');

const path = require('path');
const fs = require('fs');
const detectInstalled = require('detect-installed');
const spawn = require('child_process').spawn;
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');
const npmExists = detectInstalled.sync('npm');
const srcDir = cli.program.src || path.normalize(config.cliRoot + '/src/scaffold/src');

class Scaffold {

    constructor() {}

    basic() {

        util.copyDir(path.normalize(config.cliRoot + '/src/scaffold/root'), config.projectRoot);
        util.copyDir(srcDir, path.join(config.projectRoot, 'src'));
        this.done();
    }

    done() {

        if (cli.program.noinstall === true) {

            log.message(util.getFileName(config.projectRoot) + ' is ready');
            log.break();

        } else {

            if (cli.program.yarn) {
                spawn('yarn', ['install'], { shell: true, stdio: 'inherit'});
            }
            else if (npmExists) {
                log.message('npm install');
                spawn('npm', ['install'], { shell: true, stdio: 'inherit'});
            }

        }


    }

}

module.exports = Scaffold;
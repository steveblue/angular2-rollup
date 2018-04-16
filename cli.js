const fs = require('fs');
const path = require('path');
const util = require('./src/util');
const config = require('./src/config');
const log = require('./src/log');
const Scaffold = require('./src/scaffold/index');
const cli = require('./cli.config.json');

class AngularRollup {
    constructor() {}
    init() {
        return new Promise((res) => {
            if (cli.program.build) {

                if (!fs.existsSync(path.normalize(config.cliRoot + '/src/build/' + cli.program.build + '.js'))) {
                    util.error(cli.program.build + ' build does not exist.');
                }
                else {
                    log.break();
                    const BuildScript = require('./src/build/' + cli.program.build + '.js');
                    let build = new BuildScript().init();
                }
            }

            if (cli.program.scaffold) {
                let scaffold = new Scaffold();
                scaffold.basic();
            }

            if (cli.program.serve && !cli.program.build) {
                util.serve();
            }
             res();
        });

    }
}

module.exports = new AngularRollup();
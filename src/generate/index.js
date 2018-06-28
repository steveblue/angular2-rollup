const cli = require('./../../cli.config.json');
const config = require('./../config');

class Generator {

    constructor() {
        this.outputPath = config.processRoot;
        this.name = process.argv[process.argv.indexOf(cli.program.generate) + 1];
    }
}

module.exports = Generator;
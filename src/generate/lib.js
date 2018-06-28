require('shelljs/global');
const fs = require('fs');
const path = require('path');
const log = require('./../log');
const util = require('./../util');
const cli = require('./../../cli.config.json');
const config = require('./../config');

const Generator = require('./index');

class LibraryGenerator extends Generator {

    constructor() {
        super();
    }

    copy() {
        util.copyDir(path.join(config.cliRoot, 'src', 'scaffold', 'lib'), path.join(this.outputPath, this.name));
    }

    list(directoryPath) {
        ls(directoryPath).forEach((file) => {
            if (fs.statSync(path.join(directoryPath, file)).isFile()) {
                 this.replaceNameInFile(path.join(directoryPath, file));
            }
            else if (fs.statSync(path.join(directoryPath, file)).isDirectory()) {
                this.list(path.join(directoryPath, file));
            }
        });
    }

    replaceNameInFile(filePath) {
         sed('-i', /{{projectName}}/g, this.name, path.join(filePath));
    }

    init() {
        log.message(this.outputPath + ' ' + cli.program.generate + ' ' + this.name + ' ' + config.projectRoot );
        mkdir('-p', path.join(this.outputPath, this.name));
        this.copy();
        this.list(path.join(this.outputPath, this.name));
    }

}

module.exports = LibraryGenerator;
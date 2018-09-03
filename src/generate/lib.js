require('shelljs/global');
const fs = require('fs');
const path = require('path');
const log = require('./../log');
const util = require('./../util');
const cli = require('./../../cli.config.json');
const config = require('./../config');
const Scaffold = require('./../scaffold/index');
const Generator = require('./index');

class LibraryGenerator extends Generator {

    constructor() {
        super();
        this.addProjectToConfig = new Scaffold().addProjectToConfig;
    }

    copy() {
        util.copyDir(path.join(config.cliRoot, 'src', 'scaffold', 'lib'), path.join(this.outputPath, this.name));
    }

    list(directoryPath) {

        ls(directoryPath).forEach((file) => {
            let depth = this.directoryDepth;
            if (fs.statSync(path.join(directoryPath, file)).isFile()) {
                if (!path.join(directoryPath, file).includes('tsconfig.lib.json')) {
                    depth = depth + 1;
                }
                this.replacePathInFile(path.join(directoryPath, file), depth);
                this.replaceNameInFile(path.join(directoryPath, file));
                this.replaceProjectPathInFile(path.join(directoryPath, file));
            }
            else if (fs.statSync(path.join(directoryPath, file)).isDirectory()) {
                this.list(path.join(directoryPath, file));
            }
        });
    }

    replacePathInFile(filePath, depth) {
        let relativePath = '';
        for (let i = 0; i < depth; i++) {
            relativePath += '../';
        }
        sed('-i', /{{relativePath}}/g, relativePath, path.normalize(filePath));
    }

    replaceNameInFile(filePath) {
         sed('-i', /{{projectName}}/g, this.name, path.normalize(filePath));
    }

    replaceProjectPathInFile(filePath) {
        sed('-i', /{{projectPath}}/g, this.srcPath, path.normalize(filePath));
    }

    getFileDirectoryDepth(filePath) {
        let directoryCount = 0;
        if (this.outputPath.match(/\//g)) {
            directoryCount = filePath.match(/\//g).length;
        }
        if (this.outputPath.match(/\\/g)) {
            directoryCount = filePath.replace(':\\\\', '\\').match(/\\/g).length;
        }
        return directoryCount;
    }

    init() {

        log.message(config.projectRoot + ' '+ this.outputPath);
        this.srcPath = path.join(this.outputPath.replace(config.projectRoot, '').slice(1),
                                 this.name);

        this.directoryDepth = this.getFileDirectoryDepth(this.outputPath) -
                              this.getFileDirectoryDepth(config.projectRoot) + 1;

        mkdir('-p', path.join(this.outputPath, this.name));
        this.copy();
        this.list(path.join(this.outputPath, this.name));
        this.addProjectToConfig(this.name, {
                                        root: this.srcPath,
                                        projectType: 'library',
                                        configFile: 'lib.config.json'
                                    });
        log.spinner.stop();

    }

}

module.exports = LibraryGenerator;
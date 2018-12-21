
const findup = require('findup');
const path = require('path');
const fs = require('fs');
const log = require('./log');
const processRoot = path.join(path.dirname(process.cwd()), path.basename(process.cwd()));
const cliRoot = findup.sync(__dirname, 'package.json');
let projectRoot = require(path.join(cliRoot, 'cli.config.json')).projectRoot;

class Config {
    constructor() {

        let config = new Object();

        if (fs.existsSync(projectRoot + '/ngr.config.js')) {
            config = require(projectRoot + '/ngr.config.js');
        } else {  // for processes not in the root

            try{
                projectRoot = findup.sync(projectRoot, 'ngr.config.js');
                config = require(projectRoot + '/ngr.config.js');
            } catch(e){
                    log.break();
                    log.error('ngr command requires to be run in an Angular project scaffolded with angular-rollup');
                    log.break();
                    log.break();
                    process.exit();
            }

        }

        if (fs.existsSync(projectRoot + '/angular.json')) {

            let angularConfig = require(projectRoot + '/angular.json');
            let ngrConfig = require(projectRoot + '/ngr.config.js');

            config.angular = angularConfig;
              // if next argument after build is not an option, assume argument is the project name
            if (process.argv.indexOf('build') !== -1 &&
                process.argv[process.argv.indexOf('build') + 2] &&
                process.argv[process.argv.indexOf('build') + 2].includes('--') === false) {

                config.project = process.argv[process.argv.indexOf('build') + 2];
                config.src = path.join(ngrConfig.projects[config.project].root, ngrConfig.projects[config.project].sourceRoot);
                config.build = ngrConfig.projects[config.project].architect.build.options.outputPath;
                config.style = {
                    files : ngrConfig.projects[config.project].architect.build.options.styles
                }


            } else {

                // use default project name
                config.project = ngrConfig.defaultProject;
                config.src = path.join(ngrConfig.projects[config.project].root, ngrConfig.projects[config.project].sourceRoot);
                config.build = ngrConfig.projects[config.project].architect.build.options.outputPath;
                config.style = {
                    files: ngrConfig.projects[config.project].architect.build.options.styles
                }

            }


        }

        config.processRoot = processRoot; 
        config.projectRoot = projectRoot;
        config.cliRoot = cliRoot;

        return config;

    }
}

module.exports = new Config();

const findup = require('findup');
const path = require('path');
const fs = require('fs');
const processRoot = path.join(path.dirname(process.cwd()), path.basename(process.cwd()));
const cliRoot = findup.sync(__dirname, 'package.json');
const projectRoot = findup.sync(processRoot, 'ngr.config.js');

class Config {
    constructor() {
        console.log(projectRoot);
        let config = require(projectRoot + '/ngr.config.js');

        if (fs.existsSync(projectRoot + '/angular.json')) {

            let angularConfig = require(projectRoot + '/angular.json');

            config.angular = angularConfig;
            config.project = angularConfig.defaultProject; // TODO: override here with cli argument
            // override config with @angular/cli config, this is so we dont have to change the api in every build for now
            // config.dep = angularConfig.projects[config.project].architect.ngr.dep;
            config.src = angularConfig.projects[config.project].sourceRoot;
            config.build = angularConfig.projects[config.project].architect.build.options.outputPath;
            // config.style = {};
            config.style.files = angularConfig.projects[config.project].architect.build.styles;
            // config.style.sass = angularConfig.projects[config.project].architect.ngr.style.sass;

        }

        config.processRoot = processRoot; 
        config.projectRoot = projectRoot;
        config.cliRoot = cliRoot;

        return config;

    }
}

module.exports = new Config();
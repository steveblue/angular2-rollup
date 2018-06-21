const path = require('path');
const config = require('./../config');
const log = require('./../log.js');

class UglifyBuilder {

    constructor() { }

    optimize() {

        return new Promise((res, rej) => {

            log.message('uglify started');

            let outputPath = config.angular.projects[config.angular.defaultProject].architect.build.options.outputPath;

            exec(path.normalize(config.projectRoot + '/node_modules/.bin/uglifyjs') +
                ' ' + path.join(outputPath, 'bundle.js') + ' -o ' + path.join(outputPath, 'bundle.js')+' -c -m', { silent: true }, (error, stdout, stderr) => {

                if (stderr.includes('Error')) {
                    if (rej) rej(error);
                    log.error(stderr);

                } else {
                    log.message(stderr);
                    res();
                }

            });
        })
    }

}


module.exports = UglifyBuilder;
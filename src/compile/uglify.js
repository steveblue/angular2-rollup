const path = require('path');
const fs = require('fs');
const UglifyJS    = require('uglify-js');
const config = require('./../config');
const log = require('./../log.js');

class UglifyBuilder {

    constructor() { }

    optimize() {

        return new Promise((res, rej) => {

            log.message('uglify is optimizing');

            let outputPath = config.angular.projects[config.angular.defaultProject].architect.build.options.outputPath;

            exec(path.normalize(config.projectRoot + '/node_modules/.bin/uglifyjs') +
                ' ' + path.join(outputPath, 'bundle.js') + ' -o ' + path.join(outputPath, 'bundle.js')+' ---compress --mangle --toplevel --verbose', { silent: true }, (error, stdout, stderr) => {

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

    minify(filePath) {
        fs.readFile(filePath, 'utf-8', (err, contents) => {
            let result = UglifyJS.minify(contents, { toplevel: true, mangle: true, compress: true });
            return fs.writeFileSync(filePath, result.code);
        });
    }

}


module.exports = UglifyBuilder;
require('shelljs/global');

const sass = require('node-sass');
const path = require('path');
const fs = require('fs');
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class PostCSS {

    constructor(cssConfig) {
        this.cssConfig = cssConfig;
    }

    batch(fileList) {

        return new Promise((res) => {

            try {

                const files = fileList.map((filePath) => {
                    return this.file(filePath);
                });

                Promise.all(files).then((css) => {
                    res(css);
                });

            }
            catch (err) {
                err.service = 'postcss';
                log.error(err);

            }

        });

    }

    file(filePath) {

        // if (filePath.includes('out-css')) { // fixes issue with filePath in --watch
        //     filePath = filePath.replace('out-css/', '').replace('out-css\\', '');
        // }


        return new Promise((res) => {

            const globalBaseNames = config.projects[config.project].architect.build.options.styles.map((stylePath) => {
                return path.dirname(stylePath);
            }).filter((value, index, self) => {
                return self.indexOf(value) === index;
            });

            const isGlobal = new RegExp(globalBaseNames.join('|')).test(filePath);

            let outFile = filePath;

            if (isGlobal) {

                globalBaseNames.forEach((baseName) => {
                    if (outFile.includes(baseName)) {
                        outFile = path.join(this.cssConfig.dist, outFile).replace('src/', '').replace('src\\', '');
                    }
                })

            }

            // outFile = outFile.replace('scss', 'css');

            if (!fs.existsSync(path.normalize(outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))))) {
                mkdir('-p', path.normalize(outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))));
            }

            exec(path.normalize(path.join(config.projectRoot, 'node_modules/.bin/postcss')) +
                ' ' + outFile +
                (this.cssConfig.sourceMap === false ? ' --no-map' : '') +
                ' --env ' + (cli.env) +
                ' --output ' + outFile,
                { silent: true }, (error, stdout, stderr) => {

                    if (stderr) {
                        //stderr.service = 'postcss';
                        log.error(stderr);
                    }

                    if (res) {
                        res(filePath, outFile);
                    }

                });

        });

    }

}


module.exports = PostCSS;

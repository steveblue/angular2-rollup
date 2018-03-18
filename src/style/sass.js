require('shelljs/global');

const sass      = require('node-sass');
const path      = require('path');
const fs        = require('fs');
const util     = require('./../util.js');

const config    = require('./../config');
const cli       = require('./../../cli.config.json');

class Sass {

    constructor(sassConfig) {
        this.sassConfig = sassConfig;
    }


    batch(fileList) {

        if (!fs.existsSync(path.join(this.sassConfig.dist, 'style'))) { // TODO: figure out best way to handle use case without any global style
            mkdir('-p', path.join(this.sassConfig.dist, 'style'));
        }

        return new Promise((res, rej) => {

            try {
                const files = fileList.filter((filePath, index) => {

                    if (filePath && filePath.replace(/^.*[\\\/]/, '')[0] !== '_') {
                        return this.file(filePath);
                    }

                });

                res(files);

            }
            catch (err) {

                rej(err);

            }


        });

    }

    file(filePath)  {

        const srcPath = util.getFilePath(filePath);
        const filename = util.getFileName(filePath);
        // determine if file is global or not, swap .scss to .css in filename
        const outFile = filePath.indexOf(config.src + '/style') > -1 ?
                      path.normalize(filePath.replace(config.src, this.sassConfig.dist).replace('.scss', '.css')) :
                      filePath.replace('.scss', '.css'); // TODO: make style dir configurable
        const outFilePath = util.getFilePath(outFile);

        // this file is global w/ underscore and should not be compiled, compile global files instead
        if (filePath.indexOf(path.normalize(config.src + '/style')) > -1 && filename[0] === '_') {
            return this.batch(ls(path.normalize(config.src + '/**/*.scss')));
        }

        return new Promise((res, rej) => {

            config.style.sass[cli.env].file = filePath;
            config.style.sass[cli.env].outFile = outFile;

            if ( cli.env === 'prod' ) { // TODO: add config for AOT

                if ( fs.existsSync(path.normalize('ngfactory/' + outFilePath)) == false ) {
                    mkdir('-p', path.normalize('ngfactory/' + outFilePath));
                }

                if (filePath.indexOf(config.src + '/style') === -1) {

                    if ( !fs.existsSync(path.normalize('ngfactory/' + outFilePath)) ) {
                        mkdir('-p', path.normalize('ngfactory/' +  outFilePath));
                    }

                }

            }

            if (this.sassConfig.sourceMap) {
                config.style.sass[cli.env].sourceMap = this.sassConfig.sourceMap;
            }

            sass.render(config.style.sass[cli.env], (error, result) => {
                if (error) {

                    util.warn(error.message, 'LINE: ' + error.line);
                    console.log('');

                } else {

                    fs.writeFile(outFile, result.css, (err) => {

                        if (err) {
                            if (rej) {
                                rej(err);
                            }
                        }
                        if (res) {
                            res(outFile);
                        }

                    });

                }
            });
        });

    }

}

module.exports = Sass;
require('shelljs/global');

const sass      = require('node-sass');
const path      = require('path');
const fs        = require('fs');
const utils     = require('./../util.js');

const config    = require('./../config');
const cli       = require('./../../cli.config.json');

class Sass {

    constructor(sassConfig) {
        this.sassConfig = sassConfig;
    }

    src() {

        return new Promise((res, rej) => {


            if (!fs.existsSync(path.join(this.sassConfig.dist, 'style'))) {
                mkdir('-p', path.join(this.sassConfig.dist, 'style'));
            }
          
            if (ls(path.normalize(config.src + '/**/*.scss')).length > 0) {

                try {
                    const files = ls(path.normalize(config.src + '/**/*.scss')).filter((filePath, index) => {

                        if (filePath.replace(/^.*[\\\/]/, '')[0] !== '_') {
                            return this.file(filePath);
                        }

                    });
                    res(files);
                }
                catch (err) {
                    rej(err);
                }
            }

        });

    }

    globalFiles() {

        return new Promise((res, rej) => {

            if (!fs.existsSync(path.join(this.sassConfig.dist, 'style'))) {
                mkdir('-p', path.join(this.sassConfig.dist, 'style'));
            }

            if (ls(path.normalize(config.src + '/style/**/*.scss')).length > 0) {

                try {
                    const files = ls(path.normalize(config.src + '/**/*.scss')).filter((filePath, index) => {

                        if (filePath.replace(/^.*[\\\/]/, '')[0] !== '_') {
                            return this.file(filePath);
                        }

                    });
                    res(files);
                }
                catch (err) {
                    rej(err);
                }
            }

        });

    }

    batch(fileList) {

        return new Promise((res, rej) => {

            try {
                const files = fileList.filter((filePath, index) => {

                    if (filePath.replace(/^.*[\\\/]/, '')[0] !== '_') {
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

        let srcPath = filePath.substring(0, filePath.replace(/\\/g, "/").lastIndexOf("/"));
        let filename = filePath.replace(/^.*[\\\/]/, '');
        let outFile = filePath.indexOf(config.src + '/style') > -1 ? path.normalize(filePath.replace(config.src, this.sassConfig.dist).replace('.scss', '.css')) : filePath.replace('.scss', '.css');

        return new Promise((res, rej) => {

            if (filePath.indexOf(path.normalize(config.src + '/style')) > -1 && filename[0] === '_') {
                return this.globalFiles();
            } // this file is global w/ underscore and should not be compiled, compile global files instead

            config.style.sass[cli.env].file = filePath;
            config.style.sass[cli.env].outFile = outFile;

            if (!fs.existsSync(path.normalize(outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))))) {
                mkdir('-p', path.normalize(outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))));
            }

            if (cli.env === 'prod' && filePath.indexOf(config.src + '/style') === -1) {

                if (!fs.existsSync(path.normalize('ngfactory/' + outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))))) {
                    mkdir('-p', path.normalize('ngfactory/' + outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))));
                }

            }
            if (this.sassConfig.sourceMap) {
                config.style.sass[cli.env].sourceMap = this.sassConfig.sourceMap;
            }
            
            sass.render(config.style.sass[cli.env], (error, result) => {
                if (error) {

                    utils.warn(error.message, 'LINE: ' + error.line);
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
require('shelljs/global');

const sass      = require('node-sass');
const path      = require('path');
const fs        = require('fs');
const util      = require('./../util.js');
const log       = require('./../log.js');
const config    = require('./../config');
const cli       = require('./../../cli.config.json');

class PostCSS {

    constructor(cssConfig) {
        this.cssConfig = cssConfig;
    }

    batch(fileList) {

        return new Promise((res) => {

            try {
                const files = fileList.filter((filePath, index) => {

                    if (filePath.replace(/^.*[\\\/]/, '')[0] !== '_') {
                        return this.file(filePath);
                    }

                });

                res(files.map((fileName)=>{ return fileName.replace('.scss', '.css')}));

            }
            catch (err) {

                log.error(err);

            }

        });

    }

    file(filePath) {

        return new Promise((res) => {

            let env;

            if (cli.env === 'lib') {
                env = 'prod'
            }
            if (cli.env === 'jit') {
                env = 'dev'
            } else {
                env = cli.env;
            }

            const postcssConfigFile = require(config.projectRoot + '/postcss.' + env + '.js');

            let postcssConfig = ' -u';
            let srcPath = util.getFilePath(filePath);
            let filename = util.getFileName(filePath);
            let outFile = filePath.indexOf(config.src + '/style') > -1 ? path.normalize(filePath.replace(config.src, this.cssConfig.dist).replace('.scss', '.css')) : filePath.replace('.scss', '.css');

            if (filePath.indexOf(path.normalize(config.src + '/style')) > -1 && filename[0] === '_') {
                utils.style.globalFiles(config, res);
                return;
            } // this file is global w/ underscore and should not be compiled, compile global files instead

            for (let cssProp in postcssConfigFile.plugins) {
                postcssConfig += ' ' + cssProp;
            }

            if (!fs.existsSync(path.normalize(outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))))) {
                mkdir('-p', path.normalize(outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))));
            }

            let postcss = exec(path.normalize(path.join(config.projectRoot, 'node_modules/.bin/postcss')) +
                ' ' + outFile +
                (this.cssConfig.sourceMap === false ? ' --no-map true' : '') +
                ' -c ' + path.normalize(path.join(config.projectRoot, 'postcss.' + env + '.js')) +
                ' -r ' + postcssConfig, { silent: true }, (error, stdout, stderr) => {

                    if (stderr && error.includes('Finished') === false) {
                        log.error(stderr);
                    }

                    if (res) {
                        res(filePath, outFile);
                    }

                });

        });

    }

    copyToNgFactory(files) {

        return new Promise((res)=>{
            try {
                let copiedFiles = files.filter((file) => {
                    if (!file.includes('style/')) {
                        return file;
                    }
                }).map((file) => {
                    cp(file, file.replace(config.src, 'ngfactory/' + config.src));
                    return file.replace(config.src, 'ngfactory/' + config.src);
                });
                res(copiedFiles);
            }
            catch(err) {
                log.error(err);
            }
        });

    }

}


module.exports = PostCSS;
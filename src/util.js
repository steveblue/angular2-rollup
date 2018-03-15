require('shelljs/global');

const colors = require('colors');
const logger = require('single-line-log').stdout;
const path     = require('path');
const fs       = require('fs');
const moment   = require('moment');
const config   = require('./config');
const cli      = require('./../cli.config.json');

class Util {

    constructor() {}

    getTime(startTime) {

      let endTime = moment(new Date());
      let duration = moment.duration(endTime.diff(startTime));
      console.log('ngr built in ' + duration.asSeconds() + 's');

    }

    getFilePath(filePath) {

        return path.normalize(filePath.substring(0, filePath.replace(/\\/g, '/').lastIndexOf('/')));

    }

    getFileName(filePath) {

        return filePath.replace(/^.*[\\\/]/, '');

    }

    copyFile(src, dist) {

        cp(src, dist);
        this.log(filePath, 'copied to', dist);

    }

    copyDir(src, dist) {

        cp('-R', src + '.', path.normalize(path.join(dist, '/')));
        this.log(src, 'copied to', dist);

    }

    hasHook(step) {
        return (config.buildHooks && config.buildHooks[cli.env] && config.buildHooks[cli.env][step]) ? true : false;
    }

    hasConfigProperty(prop, obj) {
        return obj ? obj.hasOwnProperty(prop) : config.hasOwnProperty(prop);
    }

    cleanBuild() {

        return new Promise((res, rej) => {
            rm('-rf', path.normalize(config.build));
            rm('-rf', path.normalize('./closure'));
            rm('-rf', path.normalize('./ngfactory'));
            mkdir(path.normalize('./ngfactory'));
            mkdir(path.normalize('./closure'));
            res();
        });

    }
  
    formatIndex(template) {

        return new Promise((res, rej) => {

            exec(path.join(config.cliRoot, path.normalize('node_modules/.bin/htmlprocessor')) +
                ' ' + path.normalize(template) +
                ' -o ' + path.normalize(path.join(config.build, '/') + 'index.html') +
                ' -e ' + cli.env, { silent: true }, (error, stdout, stderr) => {
                    this.log('htmlprocessor', 'formatted ' + template);
                    if (error) {
                        this.warn(error);
                        if (rej) rej(error);
                    }
                    if (res) res();
                });

        });

 
    }

    copyLib(paths, src, dist) {

        return new Promise((res, rej) => {

            try {

                for (var i = 0; i < paths.length; i++) {

                if (paths[i].split('/').pop().split('.').length > 1) { // is file

                    let file = path.join(dist, paths[i]);

                    if (!fs.existsSync(this.getFilePath(file))) {

                    mkdir('-p', this.getFilePath(file));

                    } // catch folders if they dont exist

                    if (!fs.existsSync(path.join(dist, paths[i]))) {
                        cp(path.join(src, paths[i]), path.join(dist, paths[i]));
                    }

                } else { // is folder
                
                    if (!fs.existsSync( path.join(dist, paths[i]) )) {
                        cp('-R', path.join(src, paths[i]), path.join(dist, paths[i]));
                        this.log(paths[i]);
                    }

                }

                    if (i === paths.length - 1) {
                        this.log(src.replace('./', ''), 'copied to', dist.replace('./', ''));
                        res();
                    }

                }

            }
            catch(err) {
                rej(err);
            }

        });
    }

    log(action, noun, next) {
        let a = action ? colors.dim(colors.white(action)) : '';
        let n = noun ? colors.dim(colors.white(noun)) : '';
        let x = next ? colors.dim(colors.white(next)) : '';
        logger(a + ' ' + n + ' ' + x);
    }

    alert(noun, verb, action, next) {
        let n = noun ? colors.white(noun) : '';
        let v = verb ? colors.white(verb) : '';
        let a = action ? colors.white(action) : '';
        let x = next ? colors.dim(colors.white(next)) : '';
        console.log(n + ' ' + v + ' ' + a + ' ' + x);
    }

    warn(action, noun) {
        let a = action ? colors.red(action) : '';
        let n = noun ? colors.white(noun) : '';
        console.log(a + ' ' + n);
    }

    error(str) {
        console.log(str);
    }

}



module.exports = new Util();
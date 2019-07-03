'use strict';
const exec        = require('child_process').exec;
const path        = require('path');
const fs          = require('fs');
const ora         = require('ora');
const colors      = require('colors');
const logger      = require('single-line-log').stdout;
const config      = require('./config');
const uuid        = require('uuid/v4');
const gzipSize    = require('gzip-size');
const moment      = require('moment');
const cli         = require('./../cli.config.json');

const NGR_LOG_CACHE = Symbol('ngrProcess_'+uuid());
global[NGR_LOG_CACHE] = {
  process: {}
};

const spinner = ora({
    text: '',
    spinner: 'dots10',
    color: 'white',
    hideCursor: true
}).start();


class Log {

    constructor() {
        this.spinner = spinner;
    }

    break() {
        process.stdout.write('\n');
    }

    clear () {
        if (!cli.program.verbose) {
            logger.clear();
        }
    }

    stop(str) {
        this.spinner.stop();
    }

    hasArg(arg) {
        return process.argv.indexOf(arg) > -1 || process.argv.indexOf('--'+arg) > -1;
    }

    destroy() {
        this.spinner.stop();
        if (!cli.program.verbose) {
            process.stdout.write('\x1B[2J\x1B[0f\u001b[0;0H');
        }
    }

    line() {
        process.stdout.write('\n');
        const col = process.stdout.columns;
        let line = ' ';
        for (let i = 0; i < col - 2; i++) {
            line += '\u2500';
        }
        line += '\n';
        process.stdout.write(colors.white(colors.dim(line)));
    }

    errorLine() {
        process.stdout.write('\n');
        const col = process.stdout.columns;
        let line = ' ';
        for (let i = 0; i < col - 4; i++) {
            line += '\u2500';
        }
        line += '💥';
        line += '\n';
        process.stdout.write(colors.red(line).dim);
    }

    bare(msg) {
        logger(msg);
        process.stderr.write('\x1B[?25l');
        if (cli.program.verbose) this.break();
    }

    message(msg) {
        //this.spinner.stop();
        msg = msg ? '' + colors.white(msg).dim : '';
        logger(msg);
        process.stderr.write('\x1B[?25l');
        if (cli.program.verbose) this.break();
    }

    process(msg) {

        if (!cli.program.verbose) this.destroy();

        msg = msg ? '' + colors.white(msg).dim : '';

        this.spinner.text = msg;
        this.spinner.start();

        if (cli.program.verbose) this.break();

    }

    success(msg, services) {
        services.forEach((service) => { this.cancelError(service); });
        if (!this.hasError()) {
          this.destroy();
        }
        msg = '\n'+ (msg ? '' + colors.white(msg) : '');
        logger(msg);
        process.stderr.write('\x1B[?25l');
        //if (!cli.program.verbose) this.line();
        if (cli.program.verbose) this.break();
    }

    fail(msg) {
        // if (!this.hasError()) {
        //   this.destroy();
        // }
        msg = msg ? '' + colors.red(msg) : '';
        logger(msg);
        process.stderr.write('\x1B[?25l');
        if (cli.program.verbose) this.break();
    }

    alert(msg) {
        // if (!this.hasError()) {
        //   this.destroy();
        // }
        msg = msg ? '' + colors.white(msg) : '';
        process.stdout.write(msg);
        process.stdout.write('\n');
    }

    warn(msg) {
        msg = msg ? '' + colors.yellow(msg) : '';
        process.stdout.write(msg);
        process.stdout.write('\n');
    }

    error(err) {

        this.registerError(err);

        if (typeof err === 'string') {
            process.stdout.write('\n');
            process.stdout.write(colors.red(err));
        } else {

            this.break();
            let msg = ' ';
            let link = '';

            if (!err.line) {
                err.line = '';
            }

            if (!err.column) {
                err.column = '';
            }

            if (typeof err.line === 'number') {
              err.line = err.line.toString();
            }

            if (typeof err.column === 'number') {
              err.column = err.column.toString();
            }


            let lineNumbers = (err.line.length > 0) ? colors.white(err.line + ':' + err.column).dim : '';

            if (err.file && err.file.length > 0) {
                msg += err.message.replace(/'(.*?)'/g, colors.red("'") + colors.red("$1") + colors.red("'"))
                    .replace(/(error)( )((?:TS[a-z0-9]*))(:)/g, colors.white("$1$2$3").dim);
                link += err.file.includes(config.projectRoot) ?
                    colors.dim(' vscode://file/' + err.file + ':' + lineNumbers) + '\n' :
                    colors.dim(' vscode://file/' + config.projectRoot + '/' + err.file + ':' + lineNumbers) + '\n';
                process.stdout.write(colors.red(' ' + err.service.toUpperCase() + ' ERROR') + ' ' +
                ((err.file.length > 0) ? colors.white(colors.dim(err.file) + ' ' + lineNumbers) : '') + '\n\n' +
                colors.white(msg) + '\n\n'+
                ((err.file.length > 0) ? link : '') + '\n');

            } else {
                msg = err.message;
                process.stdout.write(colors.red(' ' + err.service.toUpperCase() + ' ERROR') + ' ' +
                colors.white(msg) + '\n\n');

            }



            this.line();

        }

    }

    hasError() {
      for (let prop in global[NGR_LOG_CACHE].process) {
        if (global[NGR_LOG_CACHE].process[prop].length > 0) {
          return true;
        }
      }
      return false;
    }

    registerError(err) {
      if (!err || !err.service) {
        return;
      }
      if (!global[NGR_LOG_CACHE].process[err.service.toLowerCase()]) {
        global[NGR_LOG_CACHE].process[err.service.toLowerCase()] = [];
      }
      global[NGR_LOG_CACHE].process[err.service.toLowerCase()].push(err);
    }

    cancelError(service) {
      delete global[NGR_LOG_CACHE].process[service.toLowerCase()];
    }

    getFilePath(filePath) {
        return path.normalize(filePath.substring(0, filePath.replace(/\\/g, '/').lastIndexOf('/')));
    }

    getFileName(filePath) {
        return filePath.replace(/^.*[\\\/]/, '');
    }

    catchError(str, type) {

        if (str.length) {
            this.error(str);
        }

    }

    formatTemplateError(str) {

        str = str.replace('Template parse errors:\n', '');

        let msg = (/^(.*?)\(/).exec(str);
        let code = (/\(([^)]+)\)/).exec(str);
        let lookup = (/\(([^)]+)\)/).exec(str);

        let lineNumberLookup = str.split('"):');

        if (msg != null && code != null) {

            msg[1] = msg[1].replace(': ', '');
            code[1] = code[1].replace('[ERROR ->]', colors.red('[ERROR ->]'));

            if (lineNumberLookup.length === 1 && lineNumberLookup[0].match(/\(([1-9]\d{0,5})(,)([1-9]\d{0,5})\)/g) === null) {

                try {

                    lookup[1] = lookup[1].substr(1).slice(0, -1); //.replace('[ERROR ->]', '')

                    let errorLine = '';
                    let errorLines = lookup[1].split('\n').filter((line) => {
                        return line.includes('[ERROR ->]');
                    });

                    errorLine = errorLines[0].replace('[ERROR ->]', '');
                    if (code[1][0] === '"') code[1] = code[1].substr(1);
                    if (code[1][code[1].length -1] === '"') code[1] = code[1].slice(0, -1);
                    let cmd = "grep -rnw '" + config.src + "' -e '" + code[1].replace('[ERROR ->]', '') + "'";
                    //TODO: figure out if this is possible in Windows
                    exec(cmd, {silent: true}, (error, stdout, stderr) => {

                        try {
                            let lineNumber = stdout.replace('\n', '');
                            let columnNumber = errorLines[0].indexOf('[ERROR ->]');

                            lineNumber = parseInt(lineNumber.match(/(:)(\d)(:)/)[2]) - 1; //TODO: figure out if - 1 is always true
                            if (lineNumber < 1) lineNumber = 0;

                            this.error({
                                service: 'Template',
                                file: stdout.replace('\n', '').split(':')[0],
                                line: lineNumber.toString(),
                                column: columnNumber,
                                message: msg[1] + '\n\n' + code[1].substr(1).slice(0, -1)
                            });
                        }
                        catch (e) {
                            this.error({
                                service: 'Template',
                                file: stdout.replace('\n', '').split(':')[0],
                                line: '',
                                column: '',
                                message: msg[1] + '\n\n' + code[1].substr(1).slice(0, -1)
                            });
                        }

                    });

                }
                catch(e) {
                   if (cli.program.verbose) this.message(e);
                   this.catchError(str, 'Template');
                }

            } else {

                try {
                    let lineNoRegex = /\(([1-9]\d{0,5})(,)([1-9]\d{0,5})\)/g;


                    if (str.indexOf(': :') > 0) { // this is janky may need better regex here

                        let lineNumber = lineNumberLookup[lineNumberLookup.length - 1].match(lineNoRegex)[0].replace('(', '').replace(')', '');

                        this.error({
                            service: 'Template',
                            file: lineNumberLookup[0].trim().split(':')[0].replace(lineNoRegex, ''),
                            line: lineNumber.split(',')[0],
                            column: lineNumber.split(',')[1],
                            message: lineNumberLookup[0].trim().split(': :')[1],
                        });


                    } else {

                        let line = lineNumberLookup[lineNumberLookup.length - 1].replace(/\n/g, '').split('@');

                        this.error({
                            service: 'Template',
                            file: line[0].trim(),
                            line: line[1].split(':')[0],
                            column: line[1].split(':')[1],
                            message: msg[1] + '\n\n' + code[1].substr(1).slice(0, -1)
                        });

                    }


                } catch(e) {

                    if (cli.program.verbose) this.message(e);
                    this.catchError(str, 'Template');
                    // this.error(str);

                }


            }

        } else {
            this.catchError(str, 'Template');
        }

    }

    formatTSError(str) {

        try {
            let lineNumbers = str.slice(str.indexOf('(') + 1, str.indexOf(')')).split(',');
            let err = {
                service: 'TypeScript',
                file: str.slice(0, str.indexOf('(')),
                line: lineNumbers[0],
                column: lineNumbers[1],
                message: str.slice(str.indexOf(':') + 2, str.length)
            };
            this.error(err);
        }
        catch(e) {
            if (cli.program.verbose) this.message(e);
            this.catchError(str, 'TypeScript');
        }

    }

    formatClosureError(str) {

      let lineNumber = str.match(/:([0-9]+):/) ? str.match(/:([0-9]+):/)[1] : null;
      try {
        let err = {
          service: 'Closure',
          file: str.slice(0, str.indexOf(':')),
          line: lineNumber ? lineNumber : '',
          column: '',
          message: str.slice(str.indexOf('ERROR'), str.length).length ? str.slice(str.indexOf('ERROR'), str.length).replace(/\n/g, '\n ') : str
        };
        this.error(err);
      }
      catch(e) {
        if (cli.program.verbose) this.message(e);
        this.catchError(str, 'Closure');
      }

    }

    logFileStats(file) {
        if (fs.lstatSync(path.join(file)).isFile()) {
            this.alert(colors.dim('') + colors.white(file) + ' ' +
                colors.dim((fs.statSync(path.join(file)).size / 1000).toFixed(2) + ' kB') + ' ' +
                colors.green(colors.dim('(') + (gzipSize.sync(fs.readFileSync(path.join(file))) / 1000).toFixed(2) + ' kB' + ' ' + colors.dim('gzipped') + colors.dim(')') + ' ')
            );
        }
    }

    buildStats(startTime, dist) {

        if (dist) {
            config.build = dist;
        }

        let endTime = moment(new Date());
        let duration = moment.duration(endTime.diff(startTime));
        // this.destroy();
        this.alert(colors.green('✅  build complete'));

        this.alert(colors.dim('Date: ')+ new Date().toISOString());
        this.alert(colors.dim('Time: ')+colors.white(duration.asMilliseconds() + 'ms'));
        this.alert(colors.dim('Environment: ')+ colors.white(cli.env));
        this.alert(colors.dim('Location: ')+ colors.white(path.join(config.build)));

        ls(config.build).forEach((file) => {
            if (fs.lstatSync(path.join(config.build,file)).isFile()) {
                this.logFileStats(path.join(config.build, file));
            }
        });

        if (fs.existsSync(path.join(config.build, 'style'))) {
            ls(path.join(config.build, 'style')).forEach((file) => {
                this.logFileStats(path.join(config.build, 'style', file));
            });
        }

        if (fs.existsSync(path.join(config.build, 'fesm2015'))) {
            ls(path.join(config.build, 'fesm2015')).forEach((file) => {
                if (fs.lstatSync(path.join(config.build, 'fesm2015', file)).isFile()) {
                    this.logFileStats(path.join(config.build, 'fesm2015', file));
                }
            });
        }

        if (fs.existsSync(path.join(config.build, 'fesm5'))) {
            ls(path.join(config.build, 'fesm5')).forEach((file) => {
                if (fs.lstatSync(path.join(config.build, 'fesm5', file)).isFile()) {
                    this.logFileStats(path.join(config.build, 'fesm5', file));
                }
            });
        }

        if (fs.existsSync(path.join(config.build, 'esm2015'))) {
            ls(path.join(config.build, 'esm2015')).forEach((file) => {
                if (fs.lstatSync(path.join(config.build, 'esm2015', file)).isFile()) {
                    this.logFileStats(path.join(config.build, 'esm2015', file));
                }
            });
        }

        if (fs.existsSync(path.join(config.build, 'esm5'))) {
            ls(path.join(config.build, 'esm5')).forEach((file) => {
                if (fs.lstatSync(path.join(config.build, 'esm5', file)).isFile()) {
                    this.logFileStats(path.join(config.build, 'esm5', file));
                }
            });
        }

        if (fs.existsSync(path.join(config.build, 'bundles'))) {
            ls(path.join(config.build, 'bundles')).forEach((file) => {
                if (fs.lstatSync(path.join(config.build, 'bundles', file)).isFile()) {
                    this.logFileStats(path.join(config.build, 'bundles', file));
                }
            });
        }

    }


}



module.exports = new Log();

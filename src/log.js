'use strict';

const colors      = require('colors');
const logger      = require('single-line-log').stdout;
const config      = require('./config');
const cli         = require('./../cli.config.json');

class Log {

    constructor() {}

    break() {
        process.stdout.write('\n');
    }

    clear () {
        if (!cli.program.verbose) {
            logger.clear();
        }
    }

    destroy() {
        if (!cli.program.verbose) {
            process.stdout.write('\x1B[2J\x1B[0f');
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
        process.stdout.write(colors.red(line));
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
        if (cli.program.verbose) this.break();
    }

    message(msg) {
        msg = msg ? ' ' + colors.white(msg).dim : '';
        logger(msg);
        if (cli.program.verbose) this.break();
    }

    success(msg) {
        msg = msg ? ' ' + colors.green(msg) : '';
        logger(msg);
        if (cli.program.verbose) this.break();
    }

    fail(msg) {
        msg = msg ? ' ' + colors.red(msg) : '';
        logger(msg);
        if (cli.program.verbose) this.break();
    }

    alert(msg) {
        msg = msg ? ' ' + colors.white(msg) : '';
        process.stdout.write(msg);
        process.stdout.write('\n');
    }

    warn(msg) {
        msg = msg ? ' ' + colors.yellow(msg) : '';
        process.stdout.write(msg);
        process.stdout.write('\n');
    }

    error(err) {

        if (typeof err === 'string') {
            process.stdout.write('\n');
            process.stdout.write(colors.red(err));
        } else {

            this.break();
            let msg = ' ';
            let link = '';

            let lineNumbers = (err.line.length > 0) ? colors.white(err.line + ':' + err.column).dim : '';

            if (err.file.length > 0) {
                msg += err.message.replace(/'(.*?)'/g, colors.red("'") + colors.red("$1") + colors.red("'"))
                    .replace(/(error)( )((?:TS[a-z0-9]*))(:)/g, colors.white("$1$2$3").dim);
                link += err.file.includes(config.projectRoot) ?
                    colors.dim(' vscode://file/' + err.file + ':' + lineNumbers) + '\n' :
                    colors.dim(' vscode://file/' + config.projectRoot + '/' + err.file + ':' + lineNumbers) + '\n';
            } else {
                msg = err.message;
            }

            process.stdout.write(colors.red(' ' + err.service.toUpperCase() + ' ERROR') + ' ' +
                ((err.file.length > 0) ? colors.white(colors.dim(err.file) + ' ' + lineNumbers) : '') + '\n\n' +
                colors.white(msg) + '\n\n'+
                ((err.file.length > 0) ? link : '') + '\n');

            this.line();

        }

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
                    //TODO: figure out if this is possible
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
            }
            this.error(err);
        }
        catch(e) {
            if (cli.program.verbose) this.message(e);
            this.catchError(str, 'TypeScript');
        }

    }


}



module.exports = new Log();
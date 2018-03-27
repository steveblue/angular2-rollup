const colors = require('colors');
const logger = require('single-line-log').stdout;
const config = require('./config');

class Log {

    constructor() {}

    break() {
        process.stdout.write('\n');
    }

    line() {
        process.stdout.write('\n');
        process.stdout.write('\n');
        const col = process.stdout.columns;
        let line = ' ';
        for (let i=0; i<col - 4; i++) {
            line +=  '\u2500';
        }
        line +='💥';
        line += '\n\n';
        process.stdout.write(colors.red(line).dim);
    }

    message(action, noun, next) {
        let a = action ? colors.white(action).dim : '';
        let n = noun ? colors.white(noun).dim : '';
        let x = next ? colors.white(next).dim : '';
        logger(' ' + a + ' ' + n + ' ' + x);
    }

    alert(noun, verb, action, next) {
        let n = noun ? colors.white(noun) : '';
        let v = verb ? colors.white(verb) : '';
        let a = action ? colors.white(action) : '';
        let x = next ? colors.white(next).dim : '';
        console.log(' ' + n + ' ' + v + ' ' + a + ' ' + x);
    }

    warn(action, noun) {
        let a = action ? colors.yellow(action) : '';
        let n = noun ? colors.white(noun) : '';
        process.stdout.write('\n');
        process.stdout.write(a);
    }

    error(err) {

        if (typeof err === 'string') {
            process.stdout.write('\n');
            console.log(colors.red(err));
        } else {
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

            console.log(colors.red(' ' + err.service.toUpperCase() + ' ERROR') + ' ' +
                ((err.file.length > 0) ? colors.white(colors.dim(err.file) + ' ' + lineNumbers) : '') + '\n\n' +
                colors.white(msg) + '\n\n'+
                ((err.file.length > 0) ? link : ''));
        }

        //process.exit();
    }

    getFilePath(filePath) {

        return path.normalize(filePath.substring(0, filePath.replace(/\\/g, '/').lastIndexOf('/')));

    }

    getFileName(filePath) {

        return filePath.replace(/^.*[\\\/]/, '');

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
   
            if (lineNumberLookup.length === 1) {

                lookup[1] = lookup[1].substr(1).slice(0, -1); //.replace('[ERROR ->]', '')

                // let errorLine = lookup[1].split('\n').filter((line) => {
                //     return line.includes('[ERROR ->]');
                // });

                // errorLine = errorLine[0].replace('[ERROR ->]', '');

                let cmd = "grep -rlw '"+config.src+"' -e '" +  lookup[1] + "'";
   

                //TODO: figure out if this is possible
                exec(cmd, {silent: true}, (error, stdout, stderr) => {
                
                    this.error({
                        service: 'Template',
                        file: stdout.replace('\n', ''),
                        line: '',
                        column: '',
                        message: msg[1] + '\n\n' + code[1].substr(1).slice(0, -1)
                    });

                });

            } else {
                lineNumberLookup = lineNumberLookup[lineNumberLookup.length - 1].replace(/\n/g, '').split('@');

                this.error({
                    service: 'Template',
                    file: lineNumberLookup[0].trim(),
                    line: lineNumberLookup[1].split(':')[0],
                    column: lineNumberLookup[1].split(':')[1],
                    message: msg[1] + '\n\n' + code[1].substr(1).slice(0, -1)
                });
            }

        } else {
           this.error(str);
        }

    }

    formatTSError(str) {
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


}



module.exports = new Log();
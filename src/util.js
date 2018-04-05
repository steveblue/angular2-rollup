require('shelljs/global');

const colors      = require('colors');
const path        = require('path');
const fs          = require('fs');
const MagicString = require('magic-string');
const escape      = require('js-string-escape');
const minifyHtml  = require('html-minifier').minify;
const spawn       = require('child_process').spawn;
const moment      = require('moment');
const config      = require('./config');
const cli         = require('./../cli.config.json');
const log         = require('./log');

class Util {

    constructor() {
        this.moduleIdRegex = /moduleId\s*:(.*)/g;
        this.directiveRegex = /@Directive\(\s?{([\s\S]*)}\s?\)$/gm;
        this.componentRegex = /@Component\(\s?{([\s\S]*)}\s?\)$/gm;
        this.templateUrlRegex = /templateUrl\s*:(.*)/g;
        this.styleUrlsRegex = /styleUrls\s*:(\s*\[[\s\S]*?\])/g;
        this.stringRegex = /(['"])((?:[^\\]\\\1|.)*?)\1/g;
        this.multilineComment = /^[\t\s]*\/\*\*?[^!][\s\S]*?\*\/[\r\n]/gm;
        this.singleLineComment = /^[\t\s]*(\/\/)[^\n\r]*[\n\r]/gm;
        this.lastError = {
            message : ''
        };
    }

    hasArg(arg) {
        return process.argv.indexOf(arg) > -1 || process.argv.indexOf('--'+arg) > -1;
    }

    getTime(startTime) {

      let endTime = moment(new Date());
      let duration = moment.duration(endTime.diff(startTime));
      log.break();
      log.alert('ngr built in ' + colors.green(duration.asSeconds() + 's'));
      if (this.hasArg('serve')) {
        this.serve(cli.program.watch);
      }

    }

    getFilePath(filePath) {

        return path.normalize(filePath.substring(0, filePath.replace(/\\/g, '/').lastIndexOf('/')));

    }

    getFileName(filePath) {

        return filePath.replace(/^.*[\\\/]/, '');

    }

    copyBatch(fileList, dist) {

        return new Promise((res, rej) => {
            try {

                fileList.forEach((filePath, index) => {
                    if (!fs.existsSync(path.join(dist, this.getFilePath(filePath)))) mkdir('-p', path.join(dist, this.getFilePath(filePath)));
                    cp(filePath, path.join(dist, filePath));
                    log.message(filePath, ' copied to ', dist);
                });

                res();
            }
            catch(err) {
                rej(err);
            }
        })

    }

    copyFile(src, dist) {

        cp(src, dist);
        log.message(src+ ' copied to '+  dist);

    }

    copyDir(src, dist) {

        if (!fs.existsSync(dist)) mkdir('-p', dist);
        cp('-R', path.normalize(src + '/*'), path.normalize(path.join(dist, '/')));
        log.message(this.getFileName(src)+  ' copied to '+ this.getFileName(dist));

    }

    hasHook(step) {
        return (config.buildHooks && config.buildHooks[cli.env] && config.buildHooks[cli.env][step]) ? true : false;
    }

    hasConfigProperty(prop, obj) {
        return obj ? obj.hasOwnProperty(prop) : config.hasOwnProperty(prop);
    }

    cleanBuild() {

        return new Promise((res, rej) => {
            if (fs.existsSync(path.normalize(config.build))) rm('-rf', path.normalize(config.build));
            if (fs.existsSync(path.normalize('./closure'))) rm('-rf', path.normalize('./closure'));
            if (fs.existsSync(path.normalize('./ngfactory'))) rm('-rf', path.normalize('./ngfactory'));
            mkdir(path.normalize('./ngfactory'));
            mkdir(path.normalize('./closure'));
            res();
        });

    }

    formatIndex(template) {

        return new Promise((res, rej) => {

            let env;

            if (cli.env === 'jit') {
                env = 'dev';
            } else {
                env = cli.env;
            }

            exec(path.join(config.cliRoot, path.normalize('node_modules/.bin/htmlprocessor')) +
                ' ' + path.normalize(template) +
                ' -o ' + path.normalize(path.join(config.build, '/') + 'index.html') +
                ' -e ' + env, { silent: true }, (error, stdout, stderr) => {
                    log.message('htmlprocessor' + ' formatted ' + this.getFileName(template));
                    if (error) {
                        log.warn(error);
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

                    if (fs.lstatSync(path.join('node_modules', paths[i])).isFile()) { // is file

                    let file = path.join(dist, paths[i]);

                    if (!fs.existsSync(this.getFilePath(file))) {

                    mkdir('-p', this.getFilePath(file));

                    } // catch folders if they dont exist

                    if (!fs.existsSync(path.join(dist, paths[i]))) {
                        cp(path.join(src, paths[i]), path.join(dist, paths[i]));
                    }

                } else if (fs.lstatSync(path.join('node_modules', paths[i])).isDirectory()) { // is folder

                    if (!fs.existsSync( path.join(dist, paths[i]) )) {
                        cp('-R', path.join(src, paths[i]), path.join(dist, paths[i]));
                        log.message(src, paths[i])+ ' copied to ' + path.join(dist, paths[i]);
                    }

                }

                if (i === paths.length - 1) {
                    log.message(src.replace('./', '')+ ' copied to ' +  dist.replace('./', ''));
                    res();
                }

                }

            }
            catch(err) {
                rej(err);
            }

        });
    }

    inline(filePath) {

        const outFile = filePath ? filePath : path.normalize('./' + this.libConfig.dist + '/bundle.js');
        let inline = '';

        fs.readFile(outFile, 'utf8', (err, contents) => {
            if (!err) {
                contents = contents.replace(this.multilineComment, '');
                contents = contents.replace(this.singleLineComment, '');

                if (contents.search(this.componentRegex) > -1) {
                    inline = this.inlineHTMLandCSS({
                        preprocessors: {
                            template: template => minifyHtml(template, {
                                caseSensitive: true,
                                collapseWhitespace: true,
                                removeComments: true,
                                quoteCharacter: '"'
                            })
                        }
                    }, contents, filePath.substring(0, filePath.replace(/\\/g, "/").lastIndexOf('/')));

                    if (inline) {
                        contents = inline.code;
                    }

                }

                fs.writeFile(outFile, contents, (err) => {
                    if (!err && this.getFileName(outFile).includes('component')) {
                        log.message('inline template and styles in', outFile);
                    } else if (err){
                        log.warn(err);
                    }
                });
            } else {
                log.warn(err);
            }

        });
    }

    inlineHTMLandCSS(options, source, dir) {

        let stringRegex = this.stringRegex;

        /* Logic for inling styles adapted from rollup-plugin-angular CREDIT Felix Itzenplitz */
        function insertText(str, dir, preprocessor = res => res, processFilename = false) {
            return str.replace(stringRegex, function (match, quote, url) {
                const includePath = path.join(dir, url);
                if (processFilename) {
                    let text = preprocessor(includePath);
                    text = escape(text);
                    return '"' + text + '"';
                }
                let text = fs.readFileSync(includePath).toString();

                text = preprocessor(text, includePath);
                text = escape(text);
                return '"' + text + '"';
            });
        }

        options.preprocessors = options.preprocessors || {};
        // ignore @angular/** modules
        options.exclude = options.exclude || [];
        if (typeof options.exclude === 'string' || options.exclude instanceof String) options.exclude = [options.exclude];
        if (options.exclude.indexOf('node_modules/@angular/**') === -1) options.exclude.push('node_modules/@angular/**');

        const magicString = new MagicString(source);

        let hasReplacements = false;
        let match;
        let start, end, replacement;

        while ((match = this.componentRegex.exec(source)) !== null) {
            start = match.index;
            end = start + match[0].length;

            replacement = match[0]
                .replace(this.templateUrlRegex, function (match, url) {
                    hasReplacements = true;
                    return 'template:' + insertText(url, dir, options.preprocessors.template, options.processFilename);
                })
                .replace(this.styleUrlsRegex, function (match, urls) {
                    hasReplacements = true;
                    return 'styles:' + insertText(urls, dir, options.preprocessors.style, options.processFilename);
                })
                .replace(this.moduleIdRegex, function (match, moduleId) {
                    hasReplacements = true;
                    return '';
                });

            if (hasReplacements) magicString.overwrite(start, end, replacement);
        }

        if (!hasReplacements) return null;

        let result = { code: magicString.toString() };
        if (options.sourceMap !== false) result.map = magicString.generateMap({ hires: true });

        return result;

    }

    serve(watch, isUniversal) {

        if (isUniversal === true) {

            spawn('npm run universal', { shell: true, stdio: 'inherit' });

        } else {

            let serverCommand = 'npm run serve';

            if (watch === true) {
                serverCommand += ' watch=true';
            }
            else {
                serverCommand += ' watch=false';
            }
            spawn(serverCommand, { shell: true, stdio: 'inherit' });

        }

    }

}



module.exports = new Util();
require('shelljs/global');

const colors = require('colors');
const path = require('path');
const fs = require('fs');
const UglifyJS = require('uglify-js');
const MagicString = require('magic-string');
const escape = require('js-string-escape');
const minifyHtml = require('html-minifier').minify;
const spawn = require('child_process').spawn;
const config = require('./config.js');
const cli = require('./../cli.config.json');
const log = require('./log');

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
            message: ''
        };
    }

    hasArg(arg) {
        return process.argv.indexOf(arg) > -1 || process.argv.indexOf('--' + arg) > -1;
    }

    getFilePath(filePath) {

        return path.normalize(filePath.substring(0, filePath.replace(/\\/g, '/').lastIndexOf('/')));

    }

    getFileName(filePath) {

        return filePath.replace(/^.*[\\\/]/, '');

    }

    copyFile(src, dist, options) {

        if (options && options.force) {
            rm('-f', dist);
            cp(src, dist);
        } else {
            cp(src, dist);
        }
        if (options && options.silent !== true) log.message(src + ' copied to ' + dist);

    }

    copyDir(src, dist, options) {

        if (!fs.existsSync(dist)) mkdir('-p', dist);
        if (options && options.force) {
            rm('-rf', path.normalize(path.join(dist, '/')));
            mkdir('-p', path.normalize(path.join(dist, '/')));
            cp('-R', path.normalize(src + '/*'), path.normalize(path.join(dist, '/')));
        } else {
            cp('-R', path.normalize(src + '/*'), path.normalize(path.join(dist, '/')));
        }
        if (options && options.silent !== true) log.message(this.getFileName(src) + ' copied to ' + this.getFileName(dist));

    }

    copyTo(filePath, dist) {

        const outFile = path.join(dist, filePath.replace(/(node_modules)[\\\/]/g, ''));
        return new Promise((res) => {
            if (!fs.existsSync(outFile)) {
                if (!fs.existsSync(path.dirname(outFile))) {
                    mkdir('-p', path.dirname(outFile));
                }
                cp('-R', path.join(filePath), outFile);
                log.message(this.getFileName(filePath) + ' copied to ' + dist);
                res();
            }
        });

    }

    copyLib(fileList, src, dist) {

        return Promise.all(fileList.map((filePath) => {
            return this.copyTo(path.join(src, filePath), dist);
        }));

    }

    copyBatch(fileList, dist) {

        return Promise.all(fileList.map((filePath) => {
            return this.copyTo(filePath, dist);
        }));

    }

    hasHook(step) {
        if (cli.build === 'lib') {
            return (config.projects[config.project].architect.build.hooks && config.projects[config.project].architect.build.hooks[cli.env] && config.projects[config.project].architect.build.hooks[cli.env][step]) ? true : false;
        } else {
            return (config.projects[config.project].architect.build.hooks && config.projects[config.project].architect.build.hooks[cli.build] && config.projects[config.project].architect.build.hooks[cli.build][step]) ? true : false;
        }
    }

    hasConfigProperty(prop, obj) {
        return obj ? obj.hasOwnProperty(prop) : config.hasOwnProperty(prop);
    }

    cleanBuild() {

        return new Promise((res, rej) => {
            if (fs.existsSync(path.normalize(config.build))) rm('-rf', path.normalize(config.build));
            if (fs.existsSync(path.normalize('./closure'))) rm('-rf', path.normalize('./closure'));
            if (fs.existsSync(path.normalize('./out-tsc'))) rm('-rf', path.normalize('./out-tsc'));
            mkdir(path.normalize('./out-tsc'));
            mkdir(path.normalize('./closure'));
            res();
        });

    }

    formatIndex(template) {

        return new Promise((res, rej) => {

            let env;

            if (cli.build === 'jit') {
                env = 'dev';
            } else {
                env = cli.build;
            }

            exec(path.join(config.cliRoot, path.normalize('node_modules/.bin/htmlprocessor')) +
                ' ' + path.normalize(template) +
                ' -o ' + path.normalize(path.join(config.build, '/') + 'index.html') +
                ' -e ' + env, { silent: true }, (error, stdout, stderr) => {
                    //log.message('htmlprocessor' + ' formatted ' + this.getFileName(template));
                    if (error) {
                        log.warn(error);
                        if (rej) rej(error);
                    }
                    if (res) res();
                });

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
                        log.message('inline template and styles for ' + this.getFileName(outFile));
                    } else if (err) {
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

    concatVendorScripts(dist) {
        let result = UglifyJS.minify(this.vendorScripts, { toplevel: true });
        return fs.writeFileSync(path.normalize('./' + dist + '/vendor.js'), result.code);
    }

    formatVendorScripts(fileList, src, dist) {
        this.vendorScripts = {};
        fs.openSync(path.normalize('./' + dist + '/vendor.js'), 'w');
        return Promise.all(fileList.map((filePath) => {
            return this.concatFile(path.join(src, filePath), src, dist);
        }));
    }

    concatFile(file, src, dist, code) {
        return new Promise((res, rej) => {
            fs.readFile(file, 'utf8', (err, fileContent) => {
                this.vendorScripts[this.getFileName(file)] = fileContent;
                res();
            });
        });
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
"use strict";

require('shelljs/global');
const fs   = require('fs');
const path = require('path');
const clim = require('clim');
const cons = clim();
const colors = require('chalk');
const scripts = require('./package.json').scripts;
const config = require('./build.config.js');

const MagicString = require('magic-string');
const minifyHtml  = require('html-minifier').minify;
const escape = require('js-string-escape');
const moduleIdRegex = /moduleId\s*:(.*)/g;
const componentRegex = /@Component\(\s?{([\s\S]*)}\s?\)$/gm;
const templateUrlRegex = /templateUrl\s*:(.*)/g;
const styleUrlsRegex = /styleUrls\s*:(\s*\[[\s\S]*?\])/g;
const stringRegex = /(['"])((?:[^\\]\\\1|.)*?)\1/g;
const multilineComment = /^[\t\s]*\/\*\*?[^!][\s\S]*?\*\/[\r\n]/gm;
const singleLineComment = /^[\t\s]*(\/\/)[^\n\r]*[\n\r]/gm;


const linter = require('tslint').Linter;
const tslintConfig = require('tslint').Configuration;
const tslintOptions = {
    formatter: 'json',
    rulesDirectory: 'node_modules/codelyzer'
};

// Log Formatting
clim.getTime = function(){
  let now = new Date();
  return colors.gray(colors.dim('['+
         now.getHours() + ':' +
         now.getMinutes() + ':' +
         now.getSeconds() + ']'));
};

// Logic for inling styles adapted from rollup-plugin-angular CREDIT Felix Itzenplitz
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

const log = function (action, noun, verb, next) {
    let a = action ? colors.magenta(action) : '';
    let n = noun ? colors.green(noun) : '';
    let v = verb ? colors.cyan(verb) : '';
    let x = next ? colors.dim(colors.white(next)) : '';
    cons.log(a + ' ' + n + ' ' + v + ' ' + x );
};

const warn = function(action, noun) {
    let a = action ? colors.red(action) : '';
    let n = noun ? colors.white(noun) : '';
    cons.warn(a + ' ' + n);
};


const utils = {
    paths: config,
    scripts: scripts,
    console: cons,
    colors: colors,
    log : log,
    warn : warn,
    moduleIdRegex: moduleIdRegex,
    componentRegex: componentRegex,
    templateUrlRegex: templateUrlRegex,
    styleUrlsRegex: styleUrlsRegex,
    stringRegex: stringRegex,
    multilineComment: multilineComment,
    singleLineComment: singleLineComment,
    clean : {
        tmp: () => {
            rm('-rf', './tmp');
            mkdir('./tmp');
            cp('-R', './'+config.src+'/.', './tmp');
            log(config.src+'/*.ts', 'copied', 'to', 'tmp/*ts');
        },
        lib: () => {
            rm('-rf', './tmp');
            mkdir('./tmp');
            cp('-R', config.lib+'/.', 'tmp/');
            log(config.lib+'/*.ts', 'copied', 'to', 'tmp/*ts');
        },
        paths: (p) => {

            if( p.clean.files ) {

                p.clean.files.forEach((file) => {
                    rm(file);
                });

            }
            if( p.clean.folders ) {

                p.clean.folders.forEach((folder) => {
                    rm('-rf', folder);
                });

            }

        }

    },
    generate: {

        replace: function(fileName, name) {

            return new Promise((res)=>{
                fs.readFile(fileName, 'utf8', function (err, data) {

                    if (err) {
                        return console.log(err);
                    }

                    let result = data.replace(/new/g, name.toLowerCase());

                    if (config.classPrefix) {
                        result = result.replace(/New/g, config.classPrefix + name);
                    }
                    else {
                        result = result.replace(/New/g, name);
                    }

                    fs.writeFile(utils.generate.rename(fileName, name), result, 'utf8', function (err) {
                        if (err) return console.log(err);
                        rm(fileName);
                        res(utils.generate.rename(fileName, name));
                    });

                });
            });


        },
        rename: function(fileName, name) {
            return fileName.replace(/new/g, name.toLowerCase());
        },
        copy: function(options) {

            rm('-rf', config.rootDir+'/.tmp/');
            mkdir(config.rootDir+'/.tmp/');

            cp('-R', config.rootDir+'/.new/'+options.type+'/*', config.rootDir+'/.tmp');

            ls(config.rootDir+'/.tmp').forEach((fileName, index) => {
               utils.generate.replace(config.rootDir+'/.tmp/'+fileName, options.name).then((filePath)=>{
                   mv((options.force ? '-f' : '-n'), filePath, options.path+'/'+filePath.replace(/^.*[\\\/]/, ''));
               });
            });
        }
    },
    tslint : (path, env) => {

        if (!path) {
        return;
        }

        let program = Linter.createProgram('./tsconfig.'+env+'.json', path ? path.substring(0, path.lastIndexOf('/')) : './'+config.src+'/');
        let files = Linter.getFileNames(program);
        let results = files.map(file => {

            let fileContents = fs.readFileSync(file, 'utf8');
            let linter = new Linter(options);
            console.log(file);
            let configLoad = Configuration.findConfiguration('./tsconfig.'+env+'.json', file );
            let results = linter.lint(file, fileContents, configLoad.results);

            if (results && results.failureCount > 0) {
                let failures = JSON.parse(results.output);
                for (let i = 0; i < failures.length; i++) {
                    log('tslint:',
                        colors.red(failures[i].failure),
                        colors.white('[' + failures[i].startPosition.line +
                        ', ' + failures[i].startPosition.character + ']'),
                        failures[i].name);
                }

            }

        });
    },
    angular : function(options, source, dir) {

        options.preprocessors = options.preprocessors || {};
        // ignore @angular/** modules
        options.exclude = options.exclude || [];
        if (typeof options.exclude === 'string' || options.exclude instanceof String) options.exclude = [options.exclude];
        if (options.exclude.indexOf('node_modules/@angular/**') === -1) options.exclude.push('node_modules/@angular/**');

        const magicString = new MagicString(source);

        let hasReplacements = false;
        let match;
        let start, end, replacement;

        while ((match = componentRegex.exec(source)) !== null) {
            start = match.index;
            end = start + match[0].length;

            replacement = match[0]
            .replace(templateUrlRegex, function (match, url) {
                hasReplacements = true;
                return 'template:' + insertText(url, dir, options.preprocessors.template, options.processFilename);
            })
            .replace(styleUrlsRegex, function (match, urls) {
                hasReplacements = true;
                return 'styles:' + insertText(urls, dir, options.preprocessors.style, options.processFilename);
            })
            .replace(moduleIdRegex, function (match, moduleId) {
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

};

module.exports = utils;

"use strict";

/*

    utils

    Global set of utility methods used in various build tasks.

    - paths   : build.config.js Object
    - scripts : package.json scripts Object
    - console : Direct access to clim()
    - colors  : Direct access to chalk
    - log     : Used to pretty print log messages in the Terminal
    - warn    : Used to pretty print warnings in the Terminal
    - regex   : Used to test the following Strings in soruce code
                    - moduleIdRegex: moduleId: module.id
                    - directiveRegex: @Directive,
                    - componentRegex: @Component,
                    - templateUrlRegex: templateUrl,
                    - styleUrlsRegex: styleUrls,
                    - multilineComment: Multi line comment
                    - singleLineComment: Single line comment
    - clean    : Various methods used to reset parts of the build
                    - tmp: Removes the /tmp directory, makes it again, copies source files to /tmp
                    - lib: Cleans the /tmp directory  for the library build
                    - paths: Removes an Array of files or folders
    - generate : Various methods used for the --generate command the cli uses to boilerplate code
                    - replace: Replaces 'New' and 'new-' with user defined prefixes
                    - rename: Forces lowercase filenames when user specifies CamelCase args
                    - kababToCamel: Transforms kabab-case to camelCase
                    - copy: Copies generated files to desired path
    - tslint   : Runs the tslint cli
    - angular  : Inlines templateUrl and styleUrls as template and styles in @Component


 */


require('shelljs/global');

const fs   = require('fs');
const path = require('path');
const clim = require('clim');
const cons = clim();
const colors = require('chalk');
const findUp = require('find-up');

const MagicString = require('magic-string');
const minifyHtml  = require('html-minifier').minify;
const escape = require('js-string-escape');

const cliRoot = path.dirname(fs.realpathSync(__filename));
const processRoot = path.join(path.dirname(process.cwd()) , path.basename(process.cwd()));
const cliConfigPath = findUp.sync('cli.config.js');
let projectRoot;

if(!cliConfigPath) {
    projectRoot =  path.normalize('./');
} else {
    projectRoot = path.normalize(cliConfigPath.substring(0, cliConfigPath.replace(/\\/g,"/").lastIndexOf("/")));
}

const scripts = require(projectRoot+'/package.json').scripts;
let config = require(projectRoot+'/build.config.js');

const moduleIdRegex = /moduleId\s*:(.*)/g;
const directiveRegex = /@Directive\(\s?{([\s\S]*)}\s?\)$/gm;
const componentRegex = /@Component\(\s?{([\s\S]*)}\s?\)$/gm;
const templateUrlRegex = /templateUrl\s*:(.*)/g;
const styleUrlsRegex = /styleUrls\s*:(\s*\[[\s\S]*?\])/g;
const stringRegex = /(['"])((?:[^\\]\\\1|.)*?)\1/g;
const multilineComment = /^[\t\s]*\/\*\*?[^!][\s\S]*?\*\/[\r\n]/gm;
const singleLineComment = /^[\t\s]*(\/\/)[^\n\r]*[\n\r]/gm;



/* Format time each LOG displays in the Terminal */

clim.getTime = function(){
  let now = new Date();
  return colors.gray(colors.dim('['+
         now.getHours() + ':' +
         now.getMinutes() + ':' +
         now.getSeconds() + ']'));
};

clim.logWrite = function(level, prefixes, msg) {
    // Default implementation writing to stderr
    var line = clim.getTime() + " " + level;
    if (prefixes.length > 0) line += " " + prefixes.join(" ");

    line = colors.dim(line);
    line += " " + msg;
    process.stderr.write(line + "\n");

    // or post it web service, save to database etc...
  };

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

/* LOG Method used in the build tasks.
   Pretty prints LOG, magenta, green, blue, grey message */

const log = function (action, noun, next) {
    let a = action ? colors.dim(colors.white(action)) : '';
    let n = noun ? colors.dim(colors.green(noun)) : '';
    let x = next ? colors.dim(colors.white(next)) : '';
    cons.log(a + ' ' + n + ' ' + x );
};

const alert = function (noun, verb, action, next) {
    let n = noun ? colors.bold(noun) : '';
    let v = verb ? colors.green(verb) : '';
    let a = action ? colors.cyan(action) : '';
    let x = next ? colors.dim(colors.white(next)) : '';
    cons.log(n + ' ' + v + ' ' + a + ' ' + x );
};

/* WARN Method used in the build tasks.
   Pretty prints LOG, red, white message */

const warn = function(action, noun) {
    let a = action ? colors.red(action) : '';
    let n = noun ? colors.white(noun) : '';
    cons.warn(a + ' ' + n);
};



process.argv.forEach((arg)=>{
    if (arg.includes('scaffold')) {
        if (!fs.existsSync(processRoot + '/build.config.js')) {
            cp(cliRoot + '/build.config.js', processRoot + '/build.config.js');
            config = require(cliRoot + '/build.config.js');
        }

        if (!fs.existsSync(processRoot + '/cli.config.js')) {

            fs.writeFile(processRoot + '/cli.config.js', 'module.exports = { cliRoot: "'+ cliRoot +'"}', function (err) {
                if (err) {
                    return console.log(err);
                }
            });

        }
    }
});

config.cliRoot = cliRoot;
config.processRoot = processRoot;
config.projectRoot = projectRoot;

// warn(JSON.stringify(config, null, 4));

const utils = {
    colors: colors,
    config: config,
    console: cons,
    paths: config,
    scripts: scripts,
    log : log,
    warn : warn,
    alert: alert,
    moduleIdRegex: moduleIdRegex,
    directiveRegex: directiveRegex,
    componentRegex: componentRegex,
    templateUrlRegex: templateUrlRegex,
    styleUrlsRegex: styleUrlsRegex,
    stringRegex: stringRegex,
    multilineComment: multilineComment,
    singleLineComment: singleLineComment,
    clean : {
        tmp: () => {
            rm('-rf', path.normalize('./closure'));
            rm('-rf', path.normalize('./ngfactory'));
            mkdir( path.normalize('./ngfactory'));
            mkdir( path.normalize('./closure'));
            cp('-R', path.normalize('./'+config.src+'/'), path.normalize('./ngfactory'));
            log(config.src+'/*.ts', 'copied to', 'ngfactory/*.ts');
        },
        lib: () => {
            rm('-rf', path.normalize('./tmp'));
            mkdir(path.normalize('./tmp'));
            cp('-R', path.normalize('./'+config.lib+'/')+'.', path.normalize('./tmp'));
            log(config.lib+'/*.ts', 'copied to', 'tmp/*.ts');
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

        replace: function (fileName, name) {

            //console.log(JSON.stringify(config, null, 4));

            return new Promise((res) => {
                fs.readFile(fileName, 'utf8', function (err, data) {

                    if (err) {
                        return warn(err);
                    }

                    let result = data;

                    if (fileName.includes('component')) {

                        result = result.replace('selector: \'new\'', 'selector: \'' + (config.componentPrefix.toLowerCase() || '') + '-' + name.toLowerCase() + '\'');

                    }

                    if (fileName.includes('directive')) {

                       result = result.replace('selector: \'[new]\'', 'selector: \'[' + (config.directivePrefix.toLowerCase() || '') + utils.generate.kababToCamel(name.charAt(0).toUpperCase() + name.slice(1)) + ']\'');

                    }

                    result = result.replace(/new/g, name.toLowerCase());

                    if (config.classPrefix) {
                        result = result.replace(/New/g, config.classPrefix + utils.generate.kababToCamel(name).charAt(0).toUpperCase() + utils.generate.kababToCamel(name).slice(1));
                    }
                    else {
                        result = result.replace(/New/g, utils.generate.kababToCamel(name).charAt(0).toUpperCase() + utils.generate.kababToCamel(name).slice(1));
                    }

                    fs.writeFile(utils.generate.rename(fileName, name), result, 'utf8', function (err) {
                        if (err) return console.log(err);
                        rm(fileName);
                        res(utils.generate.rename(fileName, name));
                    });

                });
            });


        },
        rename: function (fileName, name) {
            return fileName.replace(/new/g, name.toLowerCase());
        },
        kababToCamel: function(s){
            return s.replace(/(\-\w)/g, function(m){return m[1].toUpperCase();});
        },
        copy: function (options) {

            rm('-rf', path.normalize(config.cliRoot+'/.tmp/'));
            mkdir(path.normalize(config.cliRoot+'/.tmp/'));

            cp('-R', path.normalize(config.cliRoot+'/.new/'+options.type+'/*'), path.normalize(config.cliRoot+'/.tmp'));

            ls(path.normalize(config.cliRoot+'/.tmp')).forEach((fileName, index) => {

               if ( options.type !== 'component' && fileName.includes('component') ) {
                  return;
               }
               if ( options.type !== 'module' && fileName.includes('module') ) {
                 return;
               }
               if ( options.spec == false && fileName.includes('spec') == true && fileName.includes('e2e-spec') == false) {
                   return;
               }
               if ( options.type !== 'e2e' && options.e2e === false && fileName.includes('e2e-spec') ) {
                   return;
               }
               if ( options.route == false && fileName.includes('routes') ) {
                   return;
               }
               log(fileName.replace('new', options.name), 'copied to', options.name);
               utils.generate.replace(path.normalize(config.cliRoot+'/.tmp/'+fileName), options.name).then((filePath)=>{

                   mv((options.force ? '-f' : '-n'), filePath, path.normalize(options.path+'/'+filePath.replace(/^.*[\\\/]/, '')));
                   //log('Generated', filePath, 'at', options.path+'/'+filePath.replace(/^.*[\\\/]/, ''));

               });
            });
        }
    },
    tslint : (filePath) => {
        exec(path.normalize(projectRoot + '/node_modules/.bin/tslint')+' -c '+ path.normalize(projectRoot +'/tslint.json')+' '+filePath);
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

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
const sass = require('node-sass');
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
        (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' +
        (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ':' +
        (now.getSeconds() < 10 ? '0' : '') + now.getSeconds() + ']'));
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
    let n = noun ? colors.dim(colors.blue(noun)) : '';
    let x = next ? colors.dim(colors.white(next)) : '';
    cons.log(a + ' ' + n + ' ' + x );
};

const alert = function (noun, verb, action, next) {
    let n = noun ? colors.bold(noun) : '';
    let v = verb ? colors.blue(verb) : '';
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
    style: {
        files: [],
        globalFiles: (cssConfig, res, rej) => {

            let globals = [];

            ls(path.normalize(config.src + '/style/**/*.scss')).forEach(function (file, index) {

                if (file.replace(/^.*[\\\/]/, '')[0] !== '_') {
                    globals.push(file);
                }

            });

            globals.forEach(function (file, index) {

                if (globals.indexOf(file) === globals.length - 1) {
                    utils.style.file(file, cssConfig, res, rej);
                } else {
                    utils.style.file(file, cssConfig);
                }

            });

        },
        file : (filePath, cssConfig, res, rej) => {

            const postcss = require(config.projectRoot + '/postcss.' + cssConfig.env + '.js');

            let postcssConfig = ' -u';
            let srcPath = filePath.substring(0, filePath.replace(/\\/g, "/").lastIndexOf("/"));
            let filename = filePath.replace(/^.*[\\\/]/, '');
            let outFile = filePath.indexOf(config.src + '/style') > -1 ? path.normalize(filePath.replace(config.src, config.build).replace('.scss', '.css')) : filePath.replace('.scss', '.css');

            if (filePath.indexOf(path.normalize(config.src + '/style')) > -1 && filename[0] === '_') {
                utils.style.globalFiles(cssConfig, res, rej);
                return;
            } // this file is global w/ underscore and should not be compiled, compile global files instead
            
            cssConfig.sassConfig.file = filePath;
            cssConfig.sassConfig.outFile = outFile;

            for (let cssProp in postcss.plugins) {
                postcssConfig += ' ' + cssProp;
            }

            if (!fs.existsSync(path.normalize(outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))))) {
                mkdir('-p', path.normalize(outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))));
            }

            if (cssConfig.env === 'prod' && filePath.indexOf(config.src + '/style') === -1) {

                if (!fs.existsSync(path.normalize('ngfactory/' + outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))))) {
                    mkdir('-p', path.normalize('ngfactory/' + outFile.substring(0, outFile.replace(/\\/g, "/").lastIndexOf("/"))));
                }

            }

            sass.render(cssConfig.sassConfig, function (error, result) {
                if (error) {
                    warn(error.message, 'LINE: ' + error.line);
                } else {
      
           
                    fs.writeFile(outFile, result.css, function (err) {
                        if (!err && cssConfig.allowPostCSS === true) {

                            let postcss = exec(path.normalize(path.join(config.projectRoot, 'node_modules/.bin/postcss')) +
                                ' ' + outFile + ' -c ' + path.normalize(path.join(config.projectRoot, 'postcss.' + cssConfig.env + '.js')) +
                                ' -r ' + postcssConfig, function (code, output, error) {
                                    if (res) {
                                        res(filePath, outFile);
                                    }
                                    

                                });
                        } else {
                            if (err) {
                                warn(err);
                            }
                            if (rej && utils.style.files.indexOf(filePath) === utils.style.files.length - 1) {
                                if (rej) {
                                    rej(filePath, outFile, err);
                                }
                                
                            }
                        }
                    });

                }
            });

        },
        src: (cssConfig, res, rej, init) => {

            utils.style.files = [];

            mkdir(path.join(cssConfig.dist, 'style'));

            if (ls(path.normalize(cssConfig.src + '/**/*.scss')).length > 0) {
                ls(path.normalize(cssConfig.src + '/**/*.scss')).forEach(function(file, index){

                    if (file.replace(/^.*[\\\/]/, '')[0] !== '_') {
                        utils.style.files.push(file);
                    }

                });
            }
            
            ls(path.normalize(config.src + '/**/*.scss')).forEach(function(file, index){

                if (file.replace(/^.*[\\\/]/, '')[0] !== '_') {
                    utils.style.file(file, cssConfig, res, rej);
                }

            });
     

            if(init) {
                init();
            }

        }
    },
    bundle: {
        removeDuplicates: (reference, bundle) => {
            const refLength = bundle.length;
            for (let i = 0; i < refLength; i++) {
              const item = bundle[refLength - i -1];
              if (reference.includes(item)) {
                bundle.splice(refLength - i - 1, 1)
              }
            }
        },
        injectCustomExport: (filePath, moduleFactoryName) => {
            let source = fs.readFileSync(filePath, 'utf-8');
            if (source.indexOf(`self['_S']`) == -1) {
              source = source.replace('//# sourceMappingURL',
              `(self['_S']=self['_S']||[])["//${filePath.replace('./ngfactory/src/app/', '')}"]= {"${moduleFactoryName}": ${moduleFactoryName}};
          //# sourceMappingURL`);
              fs.writeFileSync(filePath, source, 'utf-8');
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

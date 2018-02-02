"use strict";

/*

    utils

    Global set of utility methods used in various build tasks.

    - config  : ngr.config.js Object
    - scripts : package.json scripts Object
    - console : Direct access to clim()
    - colors  : Direct access to chalk
    - log     : Used to pretty print log messages in the Terminal
    - warn    : Used to pretty print warnings in the Terminal
    - regex   : Used to test the following Strings in source code
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

const clim = require('clim');
const cons = clim();
const fs = require('fs');
const path = require('path');
const findUp = require('find-up');
const sass = require('node-sass');
const MagicString = require('magic-string');
const minifyHtml = require('html-minifier').minify;
const escape = require('js-string-escape');
const spawn = require('child_process').spawn;
const cliRoot = path.dirname(fs.realpathSync(__filename));
const processRoot = path.join(path.dirname(process.cwd()), path.basename(process.cwd()));
const cliConfigPath = findUp.sync(['ngr.config.js', 'build.config.js']);
const logger = require('./build.log.js');
const moduleIdRegex = /moduleId\s*:(.*)/g;
const directiveRegex = /@Directive\(\s?{([\s\S]*)}\s?\)$/gm;
const componentRegex = /@Component\(\s?{([\s\S]*)}\s?\)$/gm;
const templateUrlRegex = /templateUrl\s*:(.*)/g;
const styleUrlsRegex = /styleUrls\s*:(\s*\[[\s\S]*?\])/g;
const stringRegex = /(['"])((?:[^\\]\\\1|.)*?)\1/g;
const multilineComment = /^[\t\s]*\/\*\*?[^!][\s\S]*?\*\/[\r\n]/gm;
const singleLineComment = /^[\t\s]*(\/\/)[^\n\r]*[\n\r]/gm;
const log = logger.log;
const warn = logger.warn;
const alert = logger.alert;
const colors = logger.colors;

let projectRoot = path.normalize(cliConfigPath.substring(0, cliConfigPath.replace(/\\/g, '/').lastIndexOf('/')));

const scripts = require(projectRoot + '/package.json').scripts;
const angularVersion = require(projectRoot + '/package.json').dependencies['@angular/core'];


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

process.argv.forEach((arg) => {
    if (arg.includes('scaffold')) {
        if (!fs.existsSync(projectRoot + '/ngr.config.js')) {
            cp(cliRoot + '/ngr.config.js', projectRoot + '/ngr.config.js');
            config = require(cliRoot + '/ngr.config.js');
        }
    }
});

if (fs.existsSync(projectRoot + '/ngr.config.js')) {
    config = require(projectRoot + '/ngr.config.js');
} else if (fs.existsSync(projectRoot + '/build.config.js')) {
    config = require(projectRoot + '/build.config.js');
} else {
    warn('ngr.config.js is not found. Please include ngr.config.js at the root of your project to continue.');
    return;
}

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
    angularVersion: angularVersion,
    serve: (watch, isUniversal) => {

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



    },
    electron: (watch) => {

        let serverCommand = 'npm run electron';

        if (watch === true) {

            serverCommand += ' watch=true';
        }
        else {
            serverCommand += ' watch=false';
        }

        spawn(serverCommand, { shell: true, stdio: 'inherit' });
    },
    clean : {
        tmp: (isVerbose) => {
            rm('-rf', path.normalize('./closure'));
            rm('-rf', path.normalize('./ngfactory'));
            mkdir( path.normalize('./ngfactory'));
            mkdir( path.normalize('./closure'));
            cp('-R', path.normalize(config.src+'/'), path.normalize('./ngfactory'));
            if (isVerbose) log(config.src+'/*.ts', 'copied to', 'ngfactory/*.ts');
        },
        lib: (libConfig) => {
            rm('-rf', path.normalize('./tmp'));
            mkdir(path.normalize('./tmp'));
            cp('-R', path.normalize('./'+libConfig.src+'/')+'.', path.normalize('./tmp'));
            log(libConfig.src+'/*.ts', 'copied to', 'tmp/*.ts');
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
            let outFile = filePath.indexOf(config.src + '/style') > -1 ? path.normalize(filePath.replace(config.src, cssConfig.dist).replace('.scss', '.css')) : filePath.replace('.scss', '.css');

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
                        if (err) {
                            warn(err);
                        }
                        if (!err && cssConfig.allowPostCSS === true) {

                            let postcss = exec(path.normalize(path.join(config.projectRoot, 'node_modules/.bin/postcss')) +
                                ' ' + outFile +
                                (cssConfig.sourceMap === false ? ' --no-map true' : '') +
                                ' -c ' + path.normalize(path.join(config.projectRoot, 'postcss.' + cssConfig.env + '.js')) +
                                ' -r ' + postcssConfig, { silent: true }, function (code, output, error) {
                                    
                                    if (error) {
                                        utils.warn(error);
                                    }
                  
                                    if (res) {
                                        if(cssConfig.isVerbose) log(filePath.replace(/^.*[\\\/]/, ''), 'compiled to', outFile.replace(/^.*[\\\/]/, ''));
                                        res(filePath, outFile);
                                    }

                                });

                        } else {
                            if (err) {
                                warn(err);
                            }
                            else if (rej && utils.style.files.indexOf(filePath) === utils.style.files.length - 1) {
                                if (rej) {
                                    rej(filePath, outFile, err);
                                }

                            } else {
                                if (res) {
                                    if (cssConfig.isVerbose) log(filePath.replace(/^.*[\\\/]/, ''), 'compiled to', outFile.replace(/^.*[\\\/]/, ''));
                                    res(filePath, outFile);
                                }
                            }
                        }
                    });

                }
            });

        },
        src: (cssConfig, res, rej, init) => {

            utils.style.files = [];

            if (!fs.existsSync(path.join(cssConfig.dist, 'style'))) {
                mkdir('-p', path.join(cssConfig.dist, 'style'));
            }

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
            return new Promise((res, rej)=>{
                const refLength = bundle.fileContent.length;
                for (let i = 0; i < refLength; i++) {
                    const item = bundle.fileContent[refLength - i - 1];
                    if (reference.includes(item)) {
                        bundle.fileContent.splice(refLength - i - 1, 1)
                    }
                    if (i === refLength - 1) {
                        res(bundle);
                    }
                }
            })
        },

        injectCustomExport: (filePath, moduleFactoryName) => {
            let source = fs.readFileSync(filePath, 'utf-8');
            if (source.indexOf(`self['_S']`) == -1) {
              source = source.replace('//# sourceMappingURL',
              `(self['_S']=self['_S']||[])["//${filePath.replace('./ngfactory/'+config.src+'/app/', '')}"]= {"${moduleFactoryName}": ${moduleFactoryName}};
          //# sourceMappingURL`);
              fs.writeFileSync(filePath, source, 'utf-8');
            }
        }

    },
    generate: {

        replace: function (fileName, options, format) {

            //console.log(JSON.stringify(config, null, 4));

            return new Promise((res) => {
                fs.readFile(fileName, 'utf8', function (err, data) {

                    if (err) {
                        return warn(err);
                    }

                    let result = data;
                    let className = (config.classPrefix) ?
                                    config.classPrefix + utils.generate.kababToCamel(options.name).charAt(0).toUpperCase() + utils.generate.kababToCamel(options.name).slice(1) :
                                    utils.generate.kababToCamel(options.name).charAt(0).toUpperCase() + utils.generate.kababToCamel(options.name).slice(1);

                    let componentClassName = className + 'Component';
                    let directiveClassName = className + 'Directive';
                    let moduleClassName = className + 'Module';

                    if (fileName.includes('component')) {
                        result = result.replace('selector: \'new\'', 'selector: \'' + (config.componentPrefix.toLowerCase() || '') + '-' + options.name.toLowerCase() + '\'');
                    }

                    if (fileName.includes('directive')) {
                       result = result.replace('selector: \'[new]\'', 'selector: \'[' + (config.directivePrefix.toLowerCase() || '') + utils.generate.kababToCamel(options.name.charAt(0).toUpperCase() + options.name.slice(1)) + ']\'');
                    }

                    if (fileName.includes('spec')) {
                        result = result.replace(/new./, options.name.toLowerCase() + '.');
                    } else {
                        result = result.replace(/new./g, options.name.toLowerCase() + '.');
                    }

                    if (config.classPrefix) {
                        result = result.replace(/New/g, config.classPrefix + utils.generate.kababToCamel(options.name).charAt(0).toUpperCase() + utils.generate.kababToCamel(options.name).slice(1));
                    }
                    else {
                        result = result.replace(/New/g, utils.generate.kababToCamel(options.name).charAt(0).toUpperCase() + utils.generate.kababToCamel(options.name).slice(1));
                    }

                    // post processing

                    if (fileName.includes('routes') && format === true) {

                        if (options.lazy) {
                            result = result.replace("component: ''", "loadChildren: './"+options.name+".module#" + moduleClassName + "'");
                        } else {
                            result = result.replace("/*IMPORTS*/", "import { " + componentClassName + " } from './" + options.name + ".component';");
                            result = result.replace("component: ''", "component: " + componentClassName);
                        }

                    }

                    if (fileName.includes('module') && format === true) {

                        if (options.include.includes('component')) {
                            result = result.replace('/*IMPORT_COMPONENT*/', "import { " + componentClassName + " } from './" + options.name + ".component';");
                            result = result.replace('/*DECLARE_COMPONENT*/', componentClassName );
                            result = result.replace('/*EXPORT_COMPONENT*/', componentClassName);
                        }
                        if (options.include.includes('directive')) {
                            if (options.include.includes('component')) {
                                result = result.replace('/*IMPORT_DIRECTIVE*/', "import { " + directiveClassName + " } from './" + options.name + ".directive';");
                                result = result.replace('/*DECLARE_DIRECTIVE*/', ', '+directiveClassName);
                                result = result.replace('/*EXPORT_DIRECTIVE*/', ', ' + directiveClassName);
                            } else {
                                result = result.replace('/*IMPORT_DIRECTIVE*/', "import { " + directiveClassName + " } from './" + options.name + ".directive';");
                                result = result.replace('/*DECLARE_DIRECTIVE*/', directiveClassName);
                                result = result.replace('/*EXPORT_DIRECTIVE*/', directiveClassName);
                            }
                        }
                        if (options.include.includes('route')) {
                            result = result.replace('/*IMPORT_ROUTE*/', "import { routing } from './" + options.name + ".routes';");
                            result = result.replace('/*DECLARE_ROUTE*/', 'routing');
                        }

                    }

                    result = result.replace('/*IMPORTS*/', '');
                    result = result.replace('/*IMPORT_COMPONENT*/', '');
                    result = result.replace('/*IMPORT_DIRECTIVE*/', '');
                    result = result.replace('/*IMPORT_ROUTE*/', '');
                    result = result.replace('/*DECLARE_COMPONENT*/', '');
                    result = result.replace('/*DECLARE_DIRECTIVE*/', '');
                    result = result.replace('/*DECLARE_ROUTE*/', '');
                    result = result.replace('/*EXPORT_COMPONENT*/', '');
                    result = result.replace('/*EXPORT_DIRECTIVE*/', '');

                    fs.writeFile(utils.generate.rename(fileName, options.name), result, 'utf8', function (err) {
                        if (err) return console.log(err);
                        if (!format) rm(fileName);
                        res(utils.generate.rename(fileName, options.name));
                    });

                });
            });


        },
        module: function(options) {

            let includes = options.include;

            if (includes.includes('component')) {
                //warn('component');
                cp(path.normalize(config.cliRoot + '/.new/' + 'component/new.component.ts'), path.normalize(config.cliRoot + '/.tmp/'));
                cp(path.normalize(config.cliRoot + '/.new/' + 'component/new.component.html'), path.normalize(config.cliRoot + '/.tmp/'+options.name+'.component.html'));
                cp(path.normalize(config.cliRoot + '/.new/' + 'component/new.component.scss'), path.normalize(config.cliRoot + '/.tmp/' + options.name + '.component.scss'));
                utils.generate.replace(path.normalize(config.cliRoot + '/.tmp/new.component.ts'), options, true);
                if (includes.includes('unit')) {
                    cp(path.normalize(config.cliRoot + '/.new/' + 'component' + '/new.component.spec.ts'), path.normalize(config.cliRoot + '/.tmp/'));
                    utils.generate.replace(path.normalize(config.cliRoot + '/.tmp/new.component.spec.ts'), options, true);
                }
            }
            if (includes.includes('route')) {
                //warn('route');
                cp(path.normalize(config.cliRoot + '/.new/' + 'module' + '/new.routes.ts'), path.normalize(config.cliRoot + '/.tmp/'));
                utils.generate.replace(path.normalize(config.cliRoot + '/.tmp/new.routes.ts'), options, true);
            }
            if (includes.includes('directive')) {
                //warn('directive');
                cp('-R', path.normalize(config.cliRoot + '/.new/' + 'directive' + '/new.directive.ts'), path.normalize(config.cliRoot + '/.tmp'));
                utils.generate.replace(path.normalize(config.cliRoot + '/.tmp/new.directive.ts'), options, true);
                if (includes.includes('unit')) {
                    cp(path.normalize(config.cliRoot + '/.new/' + 'directive' + '/new.directive.spec.ts'), path.normalize(config.cliRoot + '/.tmp/'));
                    utils.generate.replace(path.normalize(config.cliRoot + '/.tmp/new.directive.spec.ts'), options, true);
                }
            }
            // if (includes.includes('unit')) {
            //     //warn('spec');
            //     cp(path.normalize(config.cliRoot + '/.new/' + 'module' + '/new.module.spec.ts'), path.normalize(config.cliRoot + '/.tmp/'));
            //     utils.generate.replace(path.normalize(config.cliRoot + '/.tmp/new.module.spec.ts'), options, true);
            // }
            if (includes.includes('e2e')) {
                //warn('e2e-spec');
                cp('-R', path.normalize(config.cliRoot + '/.new/' + 'e2e' + '/*'), path.normalize(config.cliRoot + '/.tmp'));
                utils.generate.replace(path.normalize(config.cliRoot + '/.tmp/new.e2e-spec.ts'), options, true);
            }

            //warn('module');
            cp(path.normalize(config.cliRoot + '/.new/' + 'module' + '/new.module.ts'), path.normalize(config.cliRoot + '/.tmp/'));

            utils.generate.replace(path.normalize(config.cliRoot + '/.tmp/new.module.ts'), options, true).then((filePath) => {

                setTimeout(()=>{
                    ls(path.normalize(config.cliRoot + '/.tmp')).forEach((fileName, index) => {

                        if (!fileName.includes('new')) {
                            cp((options.force ? '-f' : '-n'), path.normalize(config.cliRoot + '/.tmp') + '/' + fileName, path.normalize(options.path + '/' + fileName));
                            log(fileName.replace('new', options.name), 'copied to', options.name);
                        }

                    });
                    rm('-rf', path.normalize(config.cliRoot + '/.tmp'));
                },100);

            });

        },
        unitTest: function(options) {
            //log(JSON.stringify(options, null, 4));
            if (options.spec === 'directive') {
                cp(path.normalize(config.cliRoot + '/.new/' + 'directive' + '/new.directive.spec.ts'), path.normalize(config.cliRoot + '/.tmp/'));
                utils.generate.replace(path.normalize(config.cliRoot + '/.tmp/new.directive.spec.ts'), options).then((filePath) => {
                    mv((options.force ? '-f' : '-n'), filePath, path.normalize(options.path + '/' + filePath.replace(/^.*[\\\/]/, '')));
                    log(filePath.replace(/^.*[\\\/]/, '').replace('new', options.name), 'copied to', options.name);
                });
            } else {
                cp(path.normalize(config.cliRoot + '/.new/' + 'component' + '/new.component.spec.ts'), path.normalize(config.cliRoot + '/.tmp/'));
                utils.generate.replace(path.normalize(config.cliRoot + '/.tmp/new.component.spec.ts'), options).then((filePath) => {
                    mv((options.force ? '-f' : '-n'), filePath, path.normalize(options.path + '/' + filePath.replace(/^.*[\\\/]/, '')));
                    log(filePath.replace(/^.*[\\\/]/, '').replace('new', options.name), 'copied to', options.name);
                });
            }
        },
        lib: function (options) {

            cp('-R', path.normalize(config.cliRoot + '/.new/lib/*'), path.normalize(config.cliRoot + '/.tmp'));
            ls(path.normalize(config.cliRoot + '/.tmp')).forEach((fileName, index) => {

                fs.readFile(path.normalize(config.cliRoot + '/.tmp/'+fileName), 'utf8', function (err, data) {

                    if (err) {
                        return warn(err);
                    }

                    if (fileName.includes('tsconfig')) {
                        data = utils.generate.replacePath(data, path.relative(config.projectRoot, options.path).split(path.sep).length);
                    }

                    if (fileName.includes('lib.config')) {
                        log(options.path);
                        data = data.replace('"src": "src/lib"', '"src": "' + path.relative(config.projectRoot, options.path) + '"')
                    }

                    fs.writeFile(path.normalize(config.cliRoot + '/.tmp/' + fileName), utils.generate.renameLib(data, options.name), 'utf8', function(){

                        if (fs.existsSync(path.normalize(options.path + '/' + fileName))) {
                            warn(fileName + ' already exists. Please move or delete and try again.');
                            rm(path.normalize(config.cliRoot + '/.tmp/' + fileName));
                        } else {
                            mv(path.normalize(config.cliRoot + '/.tmp/' + fileName), options.path);
                            log(fileName, 'copied to', options.path);
                        }

                    });

                });

            });

            if (!fs.existsSync(path.normalize(options.path + '/src'))) {
                mkdir(path.normalize(options.path + '/src'));
            }

        },
        replacePath: function (fileContent, length) {
            let relativePath = '';
            for (let i=0; i<length; i++) {
                relativePath += '../';
            }
            return fileContent.replace(/..\/..\//g, relativePath);
        },
        renameLib: function (fileContent, name) {
            return fileContent.replace(/default-lib/g, name.toLowerCase());
        },
        rename: function(fileName, name) {
            return fileName.replace(/new/g, name.toLowerCase());
        },
        kababToCamel: function(s){
            return s.replace(/(\-\w)/g, function(m){return m[1].toUpperCase();});
        },
        copy: function(options) {

            rm('-rf', path.normalize(config.cliRoot+'/.tmp/'));
            mkdir(path.normalize(config.cliRoot+'/.tmp/'));

            if (options.path && !fs.existsSync(options.path)) {
                mkdir('-p', options.path);
            };

            if (options.type === 'module' && options.include && options.include.split(',').length > 0) {
                utils.generate.module(options);
                return;
            }

            if(options.type === 'unit') {
                utils.generate.unitTest(options);
                return;
            }

            if (options.type === 'lib') {
                utils.generate.lib(options);
                return;
            }

            if (!fs.existsSync(path.normalize(config.cliRoot + '/.new/' + options.type))) {
                warn('Unavailable type. The available types are module, component, directive, enum, e2e, guard, interface, pipe, service, lib.');
                return;
            }

            cp('-R', path.normalize(config.cliRoot + '/.new/' + options.type + '/*'), path.normalize(config.cliRoot + '/.tmp'));

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
               utils.generate.replace(path.normalize(config.cliRoot+'/.tmp/'+fileName), options).then((filePath)=>{

                   mv((options.force ? '-f' : '-n'), filePath, path.normalize(options.path+'/'+filePath.replace(/^.*[\\\/]/, '')));

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

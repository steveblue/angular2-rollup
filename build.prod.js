"use strict";

require('shelljs/global');

const env       = 'prod';
const path      = require('path');
const fs        = require('fs');
const utils     = require('./build.utils.js');
const chokidar  = require('chokidar');
const sass      = require('node-sass');
const postcss   = require('./postcss.' + env  + '.js');

/* References to shared tools are found in build.utils.js */

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const config    = utils.config;
const log       = utils.log;
const warn      = utils.warn;
const alert     = utils.alert;
const clean     = utils.clean;


let canWatch    = false;
let isCompiling = false;
let hasInit     = false;
let styleFiles  = [];
let hasCompletedFirstStylePass = false;
let postcssConfig = ' -u';
let bundleWithClosure = false;
let isLazy = false;
let isVerbose = false;
let canServe = false;

/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg)=>{
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if(arg.includes('closure')) {
    bundleWithClosure = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if(arg.includes('lazy')) {
    isLazy = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if (arg.includes('verbose')) {
    isVerbose = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if (arg.includes('serve')) {
    canServe = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});


if (!config.style || !config.style.sass || !config.style.sass.prod) {
  config.style = {
    sass: {
      prod: {
        includePaths: ['src/style/'],
        outputStyle: 'expanded',
        sourceComments: false
      }
    }
  }
}

/*

  Copy Tasks

- public: Copies the contents of the src/public folder
- file: Copies a file to /build
- lib: Copies files and folders from /node_modules to /build/lib

*/


const copy = {
    public: (filePath) => {

      cp('-R', path.normalize(config.src + '/public/')+'.', path.normalize(path.join(config.build)));

      exec(path.join(config.cliRoot , path.normalize('node_modules/.bin/htmlprocessor')) +
          ' '+ path.normalize(path.join(config.build , '/')+ 'index.html') +
          ' -o '+ path.normalize(path.join(config.build , '/')+ 'index.html') +
        ' -e ' + env, { silent: true }, function (code, output, error) {
          alert('htmlprocessor', 'formatted index.html');
      });

      if (isVerbose) log(filePath || path.join(config.src , 'public/'), 'copied to', path.join(config.build , '/'));

      if (config && config.clean) {
        clean.paths(config);
      }

    },
    file: (filePath) => {

      cp('-R', filePath, path.join(config.build , '/'));
      if (isVerbose) log(filePath, 'copied to',  path.join(config.build , '/'));

    },
    lib: () => {

      for (var i = 0; i < config.dep.prodLib.length; i++) {

        if (config.dep.prodLib[i].split('/').pop().split('.').length > 1) { // file
          let filePath = path.join(config.dep.dist , config.dep.prodLib[i]);
          if (!fs.existsSync(path.normalize(filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/'))))) {
            mkdir('-p', path.normalize(filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/'))));
          } // catch folders
          cp('-R', path.join(path.normalize(config.dep.src), path.normalize(config.dep.prodLib[i])), path.join(path.normalize(config.dep.dist), path.normalize(config.dep.prodLib[i])));
        } else { // folder
          cp('-R', path.join(path.normalize(config.dep.src), path.normalize(config.dep.prodLib[i])), path.join(path.normalize(config.dep.dist), path.normalize(config.dep.prodLib[i])));
        }

        if (isVerbose) log(config.dep.prodLib[i], 'copied to', path.join(path.normalize(config.dep.dist), path.normalize(config.dep.prodLib[i])));
        if (i === config.dep.lib.length - 1) {
          alert(config.dep.src.replace('./', ''), 'copied to', config.dep.dist.replace('./', ''));
        }
      }
    }
  };

/*

  Compile Tasks

- clean: Removes source code comments from bundles
- src: Compiles AOT for production using ngc, Rollup, or Closure Compiler depending on arguments
- bundleRollup: ngr build prod, bundles the app in an IIFE with Rollup, then optimizes the bundle with Closure Compiler
- bundleClosure ngr build prod --closure, bundles the app with Closure Compiler in ADVANCED_OPTIMIZATIONS mode
- bundleLazy: ngr build prod --closure --lazy, bundles the app and lazyloaded routes with Closure Compiler in ADVANCED_OPTIMIZATIONS mode

*/


const compile = {

    clean: (filePath) => {

        const outFile = filePath ? filePath : path.join(config.projectRoot, config.build , 'bundle.js');

        fs.readFile(outFile, 'utf8', function (err, contents) {
          if (!err) {
            contents = contents.replace(utils.multilineComment, '');
            contents = contents.replace(utils.singleLineComment, '');
            fs.writeFile(outFile, contents, function (err) {
              if (!err) {
                //  log('Cleaned up', 'comments', 'from', outFile);
              } else {
                warn(err);
              }
            });
          } else {
            warn(err);
          }

        });

    },

    bundleRollup: () => {

      alert('rollup', 'started');

      let bundle = exec(path.normalize(config.projectRoot+'/node_modules/.bin/rollup')+' -c rollup.config.js', function(code, output, error) {
        alert('rollup', 'bundled');
        alert('closure compiler', 'started');

        let closure = exec(require(config.projectRoot+'/package.json').scripts['transpile:'+env], {silent: true}, function(code, output, error){
            if (error) {
              warn(error);
              return;
            }
            alert('closure compiler', colors.green('optimized the bundle'));
            if (canServe === true) {
              alert(colors.green('Ready to serve'));
              utils.serve(canWatch);
            } else {
              alert(colors.green('Build is ready'));
            }
            //compile.clean();
            isCompiling = false;

            if (utils.config.buildHooks && utils.config.buildHooks[env] && utils.config.buildHooks[env].post && hasInit === false) {
              utils.config.buildHooks[env].post();
            }

            hasInit = true;
        });
      });

    },

    formatManifest: (conf, main, bundles) => {

      let out = '';
      let finalExec = '';
      out += main.join('\n');
      out += '--module=bundle:' + (main.length - 1 + 3) + '\n\n'; //Remove empty line, add the number of externs

      bundles.forEach((bundle)=>{
        utils.bundle.removeDuplicates(main, bundle.fileContent);
        out += bundle.fileContent.join('\n');
        out += '\n--module='+bundle.fileName.replace('ngfactory', 'bundle')+':' + bundle.fileContent.length + ':bundle\n\n';
      });

      conf = conf.replace('#LIST_OF_FILES#', out);

      fs.writeFile(path.normalize(config.projectRoot+'/tmp/closure.lazy.conf'), conf, 'utf-8', () => {

        if (isVerbose) log('manifest built');

        finalExec += 'java -jar node_modules/google-closure-compiler/compiler.jar --flagfile ./tmp/closure.lazy.conf \\\n'
        finalExec += '--entry_point=./main.prod \\\n';

        bundles.forEach((bundle)=>{
          utils.bundle.injectCustomExport(bundle.filePath.replace('.ts', '.js'), bundle.ngFactoryClassName);
          finalExec += '--entry_point=./'+bundle.filePath.replace('.js', '').replace('.ts', '')+' \\\n';
        });

        finalExec += '--output_manifest=closure/manifest.MF \\\n';
        finalExec += '--module_output_path_prefix=build/ \\\n';

        if (isVerbose) log('preparing bundles');

        bundles.forEach((bundle)=>{
          finalExec += '"--module_wrapper='+bundle.fileName.replace('ngfactory', 'bundle') +
                    ':(self._S=self._S||[]).push((function(){%s})); //# sourceMappingURL=%basename%.map" \\\n';
        });

        exec(finalExec, { silent: true }, (code, output, error) => {

          if (error) {
            warn(error);
            return;
          }

          exec('java -jar node_modules/google-closure-compiler/compiler.jar --compilation_level=SIMPLE_OPTIMIZATIONS --js ./src/public/system.polyfill.js --js_output_file ./build/system.polyfill.js', { silent: true }, (code, output, error) => {

            if (error) {
              warn(error);
              return;
            }

            if(isVerbose) log('closure compiler', 'optimized system.polyfill.js');
            alert('closure compiler', colors.green('optimized project bundles'));

            if (canServe === true) {
              alert(colors.green('Ready to serve'));
              utils.serve(canWatch);
            } else {
              alert(colors.green('Build is ready'));
            }
          });

          bundles.forEach((bundle) => {

            var externs = bundle.model.externs;

            if(!externs || externs.length === 0) {
              return;
            }

            fs.readFile(config.build + '/' + bundle.model.filename, 'utf8', function (err, contents) {

              externs.forEach((dep, i) => {
                fs.readFile(config.projectRoot + '/' + dep, 'utf8', function (err, con) {
                  if (!err) {
                    contents = con.concat(contents);
                    if (i === bundle.model.externs.length - 1) {
                      fs.writeFile(config.build + '/' + bundle.model.filename, contents, function (err) {
                        if (!err) {
                          if (isVerbose) log('processed externs for', bundle.model.filename);
                          if (bundles.indexOf(bundle) === bundles.length - 1) {
                            // do something after bundling
                            //alert('closure compiler', colors.green('optimized project bundles'));
                          }
                        } else {
                          warn(err);
                        }
                      });
                    }
                  } else {
                    warn(err);
                  }
                });
              })



            });
          });


          // if (canServe === true) {
          //   alert(colors.green('Ready to serve'));
          //   utils.serve(canWatch);
          // } else {
          //   alert(colors.green('Build is ready'));
          // }
        });

      });


    },

    bundleLazy: () => {

      let ngc = exec(path.normalize(config.projectRoot+'/node_modules/.bin/ngc')+
        ' -p ' + path.normalize('./tsconfig.prod.lazy.json'), { silent: true },  function(code, output, error) {

          if (error) {
            warn(error);
            return;
          }

          let lazyBundles = [];
          let main;
          let conf = fs.readFileSync(path.normalize(config.projectRoot+'/closure.lazy.conf'), 'utf-8');

          if (isVerbose) log('@angular/compiler', 'compiled ngfactory');

          if (fs.existsSync(config.projectRoot + '/lazy.config.json')) {
            cp(config.projectRoot+'/lazy.config.json', config.build+'/');
            if (isVerbose) log('copied lazy.config.json to ' + config.build);
          }

          alert('closure compiler', 'started');

          rm('-rf', path.normalize('./tmp'));
          mkdir(path.normalize('./tmp'));

          exec('java -jar node_modules/google-closure-compiler/compiler.jar --flagfile closure.conf'+
            ' --entry_point=./main.prod --output_manifest=./tmp/main.prod.MF --js_output_file=./tmp/main.prod.waste.js', { silent: true },  (code, output, error) => {

            if (error) {
              warn(error);
              return;
            }

            main = fs.readFileSync('./tmp/main.prod.MF', 'utf-8').split('\n');

            if (isVerbose) log('analyzing ngfactory for manifest');

            function transformBundle(bundle){

              let filePath = bundle.src;
              let fileName = filePath.replace(/^.*[\\\/]/, '');
              let modulePath = filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/'));

              if (isVerbose) log('optimizing', bundle.filename);

              fs.readFile(filePath, 'utf8', function (err, contents) {
                if (!err) {
                  let ngFactoryClassName = '';
                  let ngFactoryNameRegex = new RegExp('(export)( )(const)( )((?:[a-z][a-z0-9_]*))(:)',["i"]);
                  let m = ngFactoryNameRegex.exec(contents);
                  if (m != null) {
                    ngFactoryClassName = m[5];
                  }
                  exec('java -jar node_modules/google-closure-compiler/compiler.jar --flagfile closure.conf'+
                       ' --entry_point='+filePath.replace('.js', '').replace('.ts', '')+
                       ' --output_manifest=./tmp/'+fileName.replace('.js', '').replace('.ts', '').concat('.MF')+
                       ' --js_output_file=./tmp/'+fileName.replace('.js', '').replace('.ts', '').concat('.waste.js'), () => {

                    let bun = {
                      ngFactoryFile: fileName,
                      ngFactoryClassName: bundle.className || ngFactoryClassName,
                      fileName: fileName.replace('.js', '').replace('.ts', ''),
                      filePath: filePath,
                      fileContent: fs.readFileSync('./tmp/' + fileName.replace('.js', '').replace('.ts', '').concat('.MF'), 'utf-8').split('\n'),
                      model: bundle
                    };

                    lazyBundles.push(bun);

                    //if (isVerbose) log('fileName: ' + fileName.replace('.js', '').replace('.ts', '') + '\n'+JSON.stringify(bundle, null, 4));

                    if (lazyBundles.length === Object.keys(config.lazyOptions.bundles).length) {
                      if (isVerbose) log('building manifest');
                      compile.formatManifest(conf, main, lazyBundles);
                    }

                  });
                } else {
                  warn(err);
                }

              });

            }

            for (var bundle in config.lazyOptions.bundles) {
              transformBundle(config.lazyOptions.bundles[bundle])
            }

          });

      });
    },

    bundleClosure: () => {

      alert('closure compiler', 'started');

      let closure = exec(require(config.projectRoot + '/package.json').scripts['bundle:closure'], { silent: true }, function(code, output, error){

          if (error) {
            warn(error);
            return;
          }

          alert('closure compiler', 'optimized bundle.js');

          if (canServe === true) {
            alert(colors.green('Ready to serve'));
            utils.serve(canWatch);
          } else {
            alert(colors.green('Build is ready'));
          }
          //compile.clean();
          isCompiling = false;

          if (utils.config.buildHooks && utils.config.buildHooks[env] && utils.config.buildHooks[env].post && hasInit === false) {
            utils.config.buildHooks[env].post();
          }

          hasInit = true;
      });

    },

    src : () => {

        isCompiling = true;

        clean.tmp();

        // remove moduleId prior to ngc build. TODO: look for another method.
        ls(path.normalize('ngfactory/**/*.ts')).forEach(function(file) {
          sed('-i', /^.*moduleId: module.id,.*$/, '', file);
        });


        alert ('@angular/compiler', 'started');

        let ngc = exec(path.normalize(config.projectRoot+'/node_modules/.bin/ngc')+
          ' -p ' + path.normalize('./tsconfig.prod.json'), { silent: true }, function(code, output, error) {
          if (error) {
            warn(error);
            return;
          }
          alert('@angular/compiler', colors.green('compiled ngfactory'));

            if ( bundleWithClosure === true && isLazy === false) {
              compile.bundleClosure();
            } else if ( bundleWithClosure === true && isLazy === true) {
              compile.bundleLazy();
            } else {
              compile.bundleRollup();
            }

        });


    }
}


/*

  Style Tasks

  - file: Styles a single file.
         - If the file is in the /src/styles folder it will compile /src/styles/style.scss
         - If the file is elsewhere, like part of a Component, it will compile into the
          appropriate folder in the /ngfactory directory, then ngc will run and compile for AOT
  - src: Compiles the global styles

  SASS render method is called and fs writes the files to appropriate folder
  PostCSS processes the file in place, using the --replace argument


*/

let style = utils.style;

/*

  Init Tasks

  A sequence of commands needed to clean and start the prod build

*/


let init = function() {

  rm('-rf', path.normalize(path.join('./' , config.build)));

  mkdir(path.normalize('./' + config.build));
  mkdir(path.normalize('./' + config.build + '/lib'));

  if (utils.config.buildHooks && utils.config.buildHooks[env] && utils.config.buildHooks[env].pre) {
    utils.config.buildHooks[env].pre();
  }

  copy.lib();
  copy.public();

  alert('libsass and postcss', 'started');
  style.src({
      sassConfig: config.style.sass.prod,
      env: env,
      allowPostCSS: true,
      src: config.src,
      dist: config.build,
      styleSrcOnInit: false,
      isVerbose: isVerbose
  },
  function(filePath, outFile) {

    if (!outFile.includes('style/')) {
      cp(outFile, outFile.replace(config.src, 'ngfactory/src'));
    }

    if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {
      alert('libsass and postcss', colors.green('compiled'));
      setTimeout(compile.src, 1000);
    }
    if (hasCompletedFirstStylePass === true) {
      compile.src();
    }

  });

}

/*

  Watcher

  Chokidar is used to watch files, run the above methods.

*/


let watcher = chokidar.watch(path.normalize('./' + config.src + '/**/*.*'), {
  ignored: /[\/\\]\./,
  persistent: canWatch
}).on('change', filePath => {


    if (filePath.indexOf(path.join(config.src , 'public')) > -1) {

      if (filePath.indexOf(path.join(config.src , 'index.html'))) {
        copy.public();
      } else {
        copy.file(filePath);
      }

    }

    else if ( filePath.indexOf('.html') > -1 && filePath.indexOf('src') > -1) {

      if(!isCompiling) {
        alert('change', filePath, 'triggered compile');
        cp(filePath, filePath.replace(path.normalize(config.src), path.normalize('./tmp')));
        compile.src();
      }

    }

    else if ( filePath.indexOf('.ts') > -1 && hasInit === true) {

      alert('change', filePath.replace(/^.*[\\\/]/, ''), 'triggered compile');

      utils.tslint(filePath);

      if (!isCompiling) {
          compile.src();
      }


    }
    else if ( filePath.indexOf('.scss') > -1 ) {

      alert('change', filePath.replace(/^.*[\\\/]/, ''), 'triggered libsass and postcss');

        hasCompletedFirstStylePass = true;

        style.file(filePath, {
          sassConfig: config.style.sass.prod,
          env: env,
          allowPostCSS: true,
          src: config.src,
          dist: config.build,
          styleSrcOnInit: false,
          isVerbose: isVerbose
        },
          function (filePath, outFile) {

            if (!outFile.includes('style/')) {
              cp(outFile, outFile.replace(config.src, 'ngfactory/src'));
            }

            if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {
              alert('libsass and postcss', colors.green('compiled'));
              setTimeout(compile.src, 1000);
            }
            if (hasCompletedFirstStylePass === true) {
              compile.src();
            }

          });

    }

   })
   .on('unlink', filePath => log(filePath, 'has been removed'));

watcher
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    alert('ngr started', colors.red(env));

    if(isLazy === true) {

      fs.readFile(config.projectRoot+'/lazy.config.json', 'utf8', function (err, contents) {

        if (!err) {
          config.lazyOptions = JSON.parse(contents);
          config.lazyModulePaths = JSON.parse(contents).files;
          init();
        } else {
          warn('Connay extrapolate bundles. lazy.config.json does not exist in project folder. Please use ngr update --cliVersion 1.0.0-beta.10 to add lazy.config.json.');
        }

      });

    } else {
      init();
    }

  });

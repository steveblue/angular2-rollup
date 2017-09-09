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
const config     = utils.config;
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

/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg)=>{
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});

/* Process PostCSS CLI plugins for the --use argument */

for (let cssProp in postcss.plugins) {
  postcssConfig += ' '+cssProp;
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

      exec(path.join(config.cliRoot , path.normalize('node_modules/.bin/htmlprocessor'))  + ' '+ path.normalize(path.join(config.build , '/')+ 'index.html') + ' -o '+ path.normalize(path.join(config.build , '/')+ 'index.html') +' -e '+env, function (code, output, error) {
        log('index.html', 'formatted');
      });

      log(filePath || path.join(config.src , 'public/'), 'copied to', path.join(config.build , '/'));

      if (config && config.clean) {
        clean.paths(config);
      }

    },
    file: (filePath) => {

      cp('-R', filePath, path.join(config.build , '/'));
      log(filePath, 'copied to',  path.join(config.build , '/'));

    },
    lib: () => {

      for (var i = 0; i < config.dep.prodLib.length; i++) {

        if (config.dep.prodLib[i].split('/').pop().split('.').length > 1) { // file
          let filePath = path.join(config.dep.dist , config.dep.prodLib[i]);
          if (!fs.existsSync(path.normalize(filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/'))))) {
            mkdir('-p', path.normalize(filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/'))));
          } // catch folders
          cp('-R',  path.join(path.normalize(config.dep.src) , path.normalize(config.dep.prodLib[i])),  path.join(path.normalize(config.dep.dist), path.normalize(config.dep.prodLib[i])));
        } else { // folder
          cp('-R', path.join(path.normalize(config.dep.src) , path.normalize(config.dep.prodLib[i])), path.join(path.normalize(config.dep.dist) , path.normalize(config.dep.prodLib[i])));
        }

        log(config.dep.prodLib[i], 'copied to', path.join(path.normalize(config.dep.dist) , path.normalize(config.dep.prodLib[i])));

      }
    }
  };

/*

  Compile Tasks

- clean: Removes source code comments
- ts: Compiles AOT for production using ngc, Rollup, and ClosureCompiler

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

    src : () => {

        isCompiling = true;

        // remove moduleId prior to ngc build. TODO: look for another method.
        ls(path.normalize('tmp/**/*.ts')).forEach(function(file) {
          sed('-i', /^.*moduleId: module.id,.*$/, '', file);
        });

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

              alert ('ngc', 'started compiling', 'ngfactory');

              let ngc = exec(path.normalize(config.projectRoot+'/node_modules/.bin/ngc')+' -p '+path.normalize('./tsconfig.prod.json'), function(code, output, error) {
                  alert('ngc', 'compiled', '/ngfactory');
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(path.normalize(config.projectRoot+'/node_modules/.bin/rollup')+' -c rollup.config.js', function(code, output, error) {
                     alert('Rollup', 'bundled bundle.es2015.js in', './build');
                     alert('Closure Compiler', 'started optimizing', 'bundle.js');

                     let closure = exec(require(config.projectRoot+'/package.json').scripts['transpile:'+env], function(code, output, error){
                          alert('Closure Compiler', 'transpiled', './'+config.build+'/bundle.es2015.js to', './'+config.build+'/bundle.js');
                          if (canWatch === true) {
                            alert(colors.green('Ready to serve'));
                            alert(colors.green('Watcher listening for changes'));
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
              });
       });

    }
}


/*

  Style Tasks

  - file: Styles a single file.
         - If the file is in the /src/styles folder it will compile /src/styles/style.scss
         - If the file is elsewhere, like part of a Component, it will compile into the
          appropriate folder in the /tmp directory, then ngc will run and compile for AOT
  - src: Compiles the global styles

  SASS render method is called and fs writes the files to appropriate folder
  PostCSS processes the file in place, using the --replace argument


*/

let style = {

  file: (filePath, watch) => {

        let srcPath = filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf("/"));
        let globalCSSFilename = config.globalCSSFilename !== undefined ? config.globalCSSFilename : 'style.css';
        let filename = filePath.replace(/^.*[\\\/]/, '');
        let outFile = filePath.indexOf(config.src+'/style') > -1 ? config.build+'/style/'+globalCSSFilename : filePath.replace('.scss','.css');//.replace(config.src, 'tmp');
        sass.render({
          file: filePath.indexOf(path.normalize(config.src+'/style')) > -1 ? path.normalize(config.src+'/style/style.scss') : filePath,
          outFile: outFile,
          includePaths: [ config.src+'/style/' ],
          outputStyle: 'expanded',
          sourceComments: false
        }, function(error, result) {
          if (error) {
            warn(error.message, 'LINE: '+error.line);
          } else {

            fs.writeFile(outFile, result.css, function(err){
              if(!err){

                let postcss = exec(path.normalize(path.join(config.projectRoot , 'node_modules/.bin/postcss')) + ' ' + outFile + ' -c ' + path.normalize(path.join(config.projectRoot , 'postcss.' + env + '.js'))+' -r ' + postcssConfig, function (code, output, error) {

                    if (!outFile.includes('style/style.css')) {
                      cp(outFile, outFile.replace(config.src, 'tmp'));
                    }
                    if ( (styleFiles.indexOf(filePath) === styleFiles.length - 1) && hasCompletedFirstStylePass === false) {
                      alert('libsass and postcss', 'compiled');
                      setTimeout(compile.src,1000);
                    }
                    if (hasCompletedFirstStylePass === true) {
                      compile.src();
                    }

                });
              }
            });

          }
        });

    },
    src: () => {

      mkdir(path.join(config.build , 'style'));

      ls(path.normalize(config.src + '/**/*.scss')).forEach(function (file, index) {
        if (file.replace(/^.*[\\\/]/, '')[0] !== '_') {
          styleFiles.push(file);
        }
      });

      ls(path.normalize(config.src + '/**/*.scss')).forEach(function (file, index) {
        if (file.replace(/^.*[\\\/]/, '')[0] !== '_') {
          style.file(file);
        }
      });

    }
  };


/*

  Init Tasks

  A sequence of commands needed to clean and start the prod build

*/


let init = function() {

  rm('-rf', path.normalize('./tmp/'));
  rm('-rf',  path.normalize('./ngfactory'));
  rm('-rf', path.normalize(path.join('./' , config.build)));

  clean.tmp();

  mkdir(path.normalize('./ngfactory'));
  mkdir(path.normalize('./' + config.build));
  mkdir(path.normalize('./' + config.build + '/lib'));

  if (utils.config.buildHooks && utils.config.buildHooks[env] && utils.config.buildHooks[env].pre) {
    utils.config.buildHooks[env].pre();
  }

  copy.lib();
  copy.public();
  style.src();

};

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
        alert('CHANGE DETECTED', filePath, 'triggered', 'compile');
        cp(filePath, filePath.replace(path.normalize(config.src), path.normalize('./tmp')));
        compile.src();
      }

    }

    else if ( filePath.indexOf('.ts') > -1 && hasInit === true) {

      alert('CHANGE DETECTED', filePath, 'triggered', 'compile');

      utils.tslint(filePath);

      if (!isCompiling) {
          compile.src();
      }


    }
    else if ( filePath.indexOf('.scss') > -1 ) {

      alert('CHANGE DETECTED', filePath, 'triggered', 'compile');

        hasCompletedFirstStylePass = true;
        style.file(filePath, true);

    }

   })
  .on('unlink', filePath => log('File', filePath, 'has been', 'removed'));

watcher
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    alert('INITIAL SCAN COMPLETE', 'building for', env);

    init();

  });

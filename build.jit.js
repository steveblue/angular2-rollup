"use strict";

require('shelljs/global');

const env       = 'jit';

const fs        = require('fs');
const path      = require('path');
const chokidar  = require('chokidar');
const utils     = require('./build.utils.js');


/* References to shared tools are found in build.utils.js */

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const config    = utils.config;
const log       = utils.log;
const warn      = utils.warn;
const alert     = utils.alert;
const clean     = utils.clean;

let canWatch = true;
let isCompiling = false;
let hasInit = false;
let styleFiles = [];
let hasCompletedFirstStylePass = false;
let canServe = false;
let isVerbose = false;

/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg)=>{
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if (arg.includes('serve')) {
    canServe = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if (arg.includes('verbose')) {
    isVerbose = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});



if (!config.style || !config.style.sass || !config.style.sass.dev) {
  config.style = {
    sass: {
      dev: {
        includePaths: ['src/style/'],
        outputStyle: 'expanded',
        sourceComments: true
      }
    }
  }
}

/*

  Copy Tasks

- public: Copies the contents of the src/public folder
- file: Copies a file to /build
- html: Copies all .html files to /build
- lib: Copies files and folders from /node_modules to /build/lib

*/

const copy = {
  public: (filePath) => {

    cp('-R', path.normalize(config.src + '/public/')+'.', path.normalize(path.join(config.build)));

    exec(path.join(config.cliRoot , path.normalize('node_modules/.bin/htmlprocessor'))+
         ' '+ path.normalize(path.join(config.build , '/')+ 'index.html')+
         ' -o '+ path.normalize(path.join(config.build , '/')+ 'index.html')+
      ' -e dev', { silent: true }, function (code, output, error) {
        alert('htmlprocessor', 'formatted index.html');
    });

    if (isVerbose) log(filePath || path.join(config.src , 'public/'), 'copied to', path.join(config.build , '/'));

    if (config && config.clean) {
      clean.paths(config);
    }

  },
  file: (filePath) => {

    cp('-R', filePath, path.join(config.build , '/'));
    if (isVerbose)  log(filePath, 'copied to',  path.join(config.build , '/'));

  },
  html: () => {

      ls(path.normalize(config.src+'/app/**/*.html')).forEach(function(filePath) {
        cp(filePath, path.join('build',filePath));
        if (isVerbose)  log(filePath.replace(/^.*[\\\/]/, ''), 'copied to', 'build/'+filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/')));
      });
  },
  lib: () => {

    for (var i = 0; i < config.dep.lib.length; i++) {

      if (config.dep.lib[i].split('/').pop().split('.').length > 1) { // file
        let filePath = path.join(config.dep.dist , config.dep.lib[i]);
        if (!fs.existsSync(path.normalize(filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/'))))) {
          mkdir('-p', path.normalize(filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/'))));
        } // catch folders
        cp('-R',  path.join(path.normalize(config.dep.src) , path.normalize(config.dep.lib[i])),  path.join(path.normalize(config.dep.dist), path.normalize(config.dep.lib[i])));
      } else { // folder
        cp('-R', path.join(path.normalize(config.dep.src) , path.normalize(config.dep.lib[i])), path.join(path.normalize(config.dep.dist) , path.normalize(config.dep.lib[i])));
      }

      if (isVerbose) log(config.dep.lib[i], 'copied to', path.join(path.normalize(config.dep.dist) , path.normalize(config.dep.lib[i])));
      if (i === config.dep.lib.length - 1) {
        alert(config.dep.src.replace('./', ''), 'copied to', config.dep.dist.replace('./', ''));
      }
    }
  }
};

/*

  Compile Tasks

- ts: Compiles Typescript files from /src into /build

*/

const compile = {

    file: (execCmd, filePath) => {

      let tsc = exec(execCmd, function (code, output, error) {

        if (filePath) {
          alert(colors.green('typescript compiled', filePath));
          cp(filePath, path.normalize('build/' + filePath));
          isCompiling = false;
        } else {
          alert(colors.green('typescript compiled'));
        }

        if (hasInit === false) {

          copy.html();
          alert('libsass and postcss', 'started');
          style.src({
            sassConfig: config.style.sass.dev,
            env: 'dev',
            allowPostCSS: true,
            src: config.src,
            dist: config.build,
            styleSrcOnInit: false,
            isVerbose: isVerbose
          },
            function (filePath, outFile) {

              if (!outFile.includes('style/')) {

                cp(outFile, outFile.replace(config.src, 'build/src'));

              }

              if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {

                alert(colors.green('libsass and postcss compiled'));
                if (canServe === true) {
                  alert(colors.green('Ready to serve'));
                  utils.serve(canWatch);
                } else {
                  alert(colors.green('Build is ready'));
                }

              } else if (hasCompletedFirstStylePass === true) {
                compile.ts();
              }

            },
            function (filePath, outFile, err) {
              if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {
                if (!err) {
                  alert('libsass', 'compiled');
                  setTimeout(compile.src, 1000);
                }
              }
            },
            function () {

              hasInit = true;

              if (config.buildHooks && config.buildHooks[env] && config.buildHooks[env].post) {
                config.buildHooks[env].post();
              }

            });

        }

        isCompiling = false;


      });
    },

    ts : (filePath) => {

      isCompiling = true;

      let tsExec = '';

      if (filePath) {

          alert('typescript', 'started');

          fs.readFile(config.processRoot+'/tsconfig.jit.json', 'utf8', function (err, contents) {
            if (!err) {
              contents = JSON.parse(contents);
              contents.files = [];
              contents.files.push(filePath);
              contents = JSON.stringify(contents, null, 4);
              fs.writeFile(config.processRoot + '/tsconfig.jit.file.json', contents, function (err) {
                if (err) {
                  warn(err);
                } else {
                  tsExec = path.normalize(config.processRoot + '/node_modules/.bin/tsc') +
                    ' -p ' + path.normalize('./tsconfig.jit.file.json');
                  compile.file(tsExec, filePath);
                }
              });
            } else {
              warn(err);
            }

          });

      } else {
          // alert('typescript', 'compiled');
          tsExec = path.normalize(config.processRoot + '/node_modules/.bin/tsc') +
                                  ' -p ' + path.normalize('./tsconfig.jit.json');
          compile.file(tsExec, filePath);
      }



    }
};

/*

  Style Tasks

  - file: Styles a single file.
         - If the file is in the /src/styles folder it will compile /src/styles/style.scss
         - If the file is elsewhere, like part of a Component, it will compile into the
          appropriate folder in the /build directory
  - src: Compiles the global styles

  SASS render method is called and fs writes the files to appropriate folder
  PostCSS processes the file in place, using the --replace argument


*/

let style = utils.style;

/*

  Init Tasks

  A sequence of commands needed to clean and start the dev build

*/

let init = function() {

  rm('-rf', path.normalize('./tmp/'));
  rm('-rf',  path.normalize('./ngfactory'));
  rm('-rf', path.normalize(path.join('./' , config.build)));

  mkdir(path.normalize('./' + config.build));
  mkdir(path.normalize('./' + config.build + '/lib'));


  if (fs.existsSync(config.processRoot + '/lazy.config.json')) {
    cp(config.processRoot + '/lazy.config.json', config.build + '/');
    if (isVerbose) log('copied lazy.config.json to ' + config.build);
  }


  if (config.buildHooks && config.buildHooks[env] && config.buildHooks[env].pre) {
    config.buildHooks[env].pre();
  }

  copy.lib();
  copy.public();
  compile.ts();

};

/*

  Watcher

  Chokidar is used to watch files, run the above methods

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

    alert('change', filePath.replace(/^.*[\\\/]/, ''));

       copy.html(filePath);

    }

  else if ( filePath.indexOf('.ts') > -1 && hasInit === true) {


    if (!isCompiling) {

      alert('change', filePath.replace(/^.*[\\\/]/, ''), 'triggered transpile');
      utils.tslint(filePath);
      compile.ts();

    }


  }
  else if ( filePath.indexOf('.scss') > -1 ) {

    alert('change', filePath.replace(/^.*[\\\/]/, ''), 'triggered sass and postcss');

    hasCompletedFirstStylePass = true;

    utils.style.file(filePath, {
      sassConfig: config.style.sass.dev,
      env: 'dev',
      allowPostCSS: true,
      src: config.src,
      dist: config.build,
      styleSrcOnInit: false,
      isVerbose: isVerbose
    },
    function (filePath, outFile) {

        if (!outFile.includes('style/')) {

          cp(outFile, outFile.replace(config.src, 'build/src'));
          compile.ts(); //outFile.replace('.css', '.ts')

        }

        if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {

          alert(colors.green('libsass and postcss compiled'));

          if (canWatch === true) {
            alert(colors.green('Ready to serve'));
            alert(colors.green('Watcher listening for changes'));
          } else {
            alert(colors.green('Build is ready'));
          }
          hasCompletedFirstStylePass = true;

        } else if (hasCompletedFirstStylePass === false) {
          compile.ts();
        }

      },
      function (filePath, outFile, err) {
        if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {
          if (!err) {
            alert('libsass', 'compiled');
            setTimeout(compile.src, 1000);
          }
        }
      });


  }

   })
   .on('unlink', filePath => log(filePath, 'has been removed'));

watcher
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    alert(colors.green('ngr started ' + env));
    init();

});

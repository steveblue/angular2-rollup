"use strict";

require('shelljs/global');

const env       = 'jit';

const fs        = require('fs');
const path      = require('path');
const chokidar  = require('chokidar');
const sass      = require('node-sass');
const utils     = require('./build.utils.js');
const postcss   = require('./postcss.' + env + '.js');

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
- html: Copies all .html files to /build
- lib: Copies files and folders from /node_modules to /build/lib

*/

const copy = {
  public: (filePath) => {

    cp('-R', path.normalize(config.src + '/public/')+'.', path.normalize(path.join(config.build)));

    exec(path.join(config.cliRoot , path.normalize('node_modules/.bin/htmlprocessor'))+
         ' '+ path.normalize(path.join(config.build , '/')+ 'index.html')+
         ' -o '+ path.normalize(path.join(config.build , '/')+ 'index.html')+
         ' -e dev', function (code, output, error) {
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
  html: () => {

      ls(path.normalize(config.src+'/app/**/*.html')).forEach(function(filePath) {
        cp(filePath, path.join('build',filePath));
        log(filePath.replace(/^.*[\\\/]/, ''), 'copied to', 'build/'+filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/')));
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

      log(config.dep.lib[i], 'copied to', path.join(path.normalize(config.dep.dist) , path.normalize(config.dep.lib[i])));

    }
  }
};

/*

  Compile Tasks

- ts: Compiles Typescript files from /src into /build

*/

const compile = {

    ts : (filePath) => {

      isCompiling = true;

      if (filePath) {
          alert('typescript', 'started transpiling', filePath);
      } else {
          alert('typescript', 'started transpiling', config.src+'/*ts');
      }

      let tsc = exec(path.normalize(config.projectRoot+'/node_modules/.bin/tsc')+
                     ' -p '+path.normalize('./tsconfig.jit.json'), function(code, output, error) {

          if (filePath) {
            alert('typescript', 'transpiled', filePath);
            cp(filePath, path.normalize('build/'+filePath));
          } else {
            alert('typescript', 'transpiled', config.src+'/*ts');
          }

          if(hasInit === false) {

            copy.html();
            style.src();

          }

          isCompiling = false;


      });

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

let style = {

    file: (filePath, watch) => {

        let srcPath = filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf("/"));
        let globalCSSFilename = config.globalCSSFilename !== undefined ? config.globalCSSFilename : 'style.css';
        let filename = filePath.replace(/^.*[\\\/]/, '');
        let outFile = filePath.indexOf(config.src+'/style') > -1 ? config.build+'/style/'+globalCSSFilename : filePath.replace('.scss','.css');
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

                if (watch === true) alert('node-sass', 'compiled', 'component style at', outFile);

                let postcss = exec(path.normalize(path.join(config.projectRoot , 'node_modules/.bin/postcss'))+
                                   ' ' + outFile + 
                                   ' -c ' + path.normalize(path.join(config.projectRoot , 'postcss.' + env + '.js'))+
                                   ' -r ' + postcssConfig, function (code, output, error) {

                  if (!outFile.includes('style/style.css')) {
                    cp(outFile, outFile.replace(config.src, 'build/src'));
                  }

                  if ((styleFiles.indexOf(filePath) === styleFiles.length - 1) && hasCompletedFirstStylePass === false) {
                      alert('libsass and postcss', 'compiled');
                      if (canWatch === true) {
                            alert(colors.green('Ready to serve'));
                            alert(colors.green('Watcher listening for changes'));
                      } else {
                        alert(colors.green('Build is ready'));
                      }
                    }
                    if (hasCompletedFirstStylePass === true) {
                      compile.ts();
                    }

                });
              }
            });

          }
        });

    },
    src:() =>{

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

        hasInit = true;

        if (config.buildHooks && config.buildHooks[env] && config.buildHooks[env].post) {
          config.buildHooks[env].post();
        }

    }
};

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

    alert('CHANGE DETECTED', filePath);

       copy.html(filePath);

    }

  else if ( filePath.indexOf('.ts') > -1 && hasInit === true) {

    alert('CHANGE DETECTED', filePath, 'triggered', 'transpile');

    utils.tslint(filePath);

    if (!isCompiling) {

      compile.ts(filePath);

    }


  }
  else if ( filePath.indexOf('.scss') > -1 ) {

    alert('CHANGE DETECTED', filePath, 'triggered', 'sass and postcss');

    hasCompletedFirstStylePass = true;
    style.file(filePath, true);


  }

   })
   .on('unlink', filePath => log(filePath, 'has been removed'));

watcher
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    alert('INITIAL SCAN COMPLETE', 'building for', env);
    init();

});

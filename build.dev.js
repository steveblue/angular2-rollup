"use strict";

require('shelljs/global');

const env = 'dev';
const path = require('path');
const fs = require('fs');
const utils = require('./build.utils.js');
const chokidar = require('chokidar');
const sass = require('node-sass');
const postcss = require('./postcss.' + env + '.js');
const spawn = require('child_process').spawn;

/* References to shared tools are found in build.utils.js */

const console = utils.console;
const colors = utils.colors;
const scripts = utils.scripts;
const paths = utils.paths;
const log = utils.log;
const warn = utils.warn;
const alert = utils.alert;
const clean = utils.clean;

let allowPostCSS = false;
let canWatch = false;
let isCompiling = false;
let hasInit = false;
let styleFiles = [];
let hasCompletedFirstStylePass = false;
let postcssConfig = ' -u';

/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg) => {
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});

/* Process PostCSS CLI plugins for the --use argument */

for (let cssProp in postcss.plugins) {
  postcssConfig += ' ' + cssProp;
}

/*

  Copy Tasks

- public: Copies the contents of the src/public folder
- file: Copies a file to /build
- lib: Copies files and folders from /node_modules to /build/lib

*/


const copy = {
  public: (filePath) => {

    log ( path.normalize(paths.src + '/public/')+'.', path.normalize(path.join(paths.build , '/')) );
    cp('-R', path.normalize(paths.src + '/public/')+'.', path.normalize(path.join(paths.build , '/')));

    exec(path.join(paths.cliRoot , path.normalize('node_modules/.bin/htmlprocessor'))  + ' '+ path.normalize(path.join(paths.build , '/')+ 'index.html') + ' -o '+ path.normalize(path.join(paths.build , '/')+ 'index.html') +' -e dev', function (code, output, error) {
      log('index.html', 'formatted');
    });

    log(filePath || path.join(paths.src , 'public/'), 'copied to', path.join(paths.build , '/'));

    if (paths && paths.clean) {
      clean.paths(paths);
    }

  },
  file: (filePath) => {
    cp('-R', filePath, path.join(paths.build , '/'));
    log(filePath, 'copied to',  path.join(paths.build , '/'));
  },
  lib: () => {


    for (var i = 0; i < paths.dep.lib.length; i++) {

      if (paths.dep.lib[i].split('/').pop().split('.').length > 1) { // file
        let filePath = path.join(paths.dep.dist , paths.dep.lib[i]);
        if (!fs.existsSync(path.normalize(filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/'))))) {
          mkdir('-p', path.normalize(filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/'))));
        } // catch folders
        cp('-R',  path.join(path.normalize(paths.dep.src) , path.normalize(paths.dep.lib[i])),  path.join(path.normalize(paths.dep.dist), path.normalize(paths.dep.lib[i])));
      } else { // folder
        cp('-R', path.join(path.normalize(paths.dep.src) , path.normalize(paths.dep.lib[i])), path.join(path.normalize(paths.dep.dist) , path.normalize(paths.dep.lib[i])));
      }

      log(paths.dep.lib[i], 'copied to', path.join(path.normalize(paths.dep.dist) , path.normalize(paths.dep.lib[i])));

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

    const outFile = filePath ? filePath : path.join(paths.projectRoot, paths.build , 'bundle.js');

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

  main: () => {

    const outFile = path.join(paths.projectRoot, paths.build , 'main.ts');

    fs.readFile(path.join(paths.projectRoot, 'main.prod.js'), 'utf8', function (err, contents) {
      if (!err) {
        contents = contents.replace("./ngfactory/tmp/app/app.module", "src/app/app.module.ngfactory");
        contents = contents.replace("import { enableProdMode } from '@angular/core';", "");
        contents = contents.replace("enableProdMode();", "");
        fs.writeFile(outFile, contents, function (err) {
          if (!err) {
            let transpile = exec(path.join(paths.projectRoot, 'node_modules/.bin/tsc') + ' ' + outFile + ' --target es5 --module commonjs --emitDecoratorMetadata true --experimentalDecorators true --noImplicitAny false --allowUnreachableCode false --moduleResolution node --typeRoots node --lib dom,es2017', 
              function (code, output, error) {
                alert('tsc', 'transpiled', outFile);
              });
          } else {
            warn(err);
          }
        });
      } else {
        warn(err);
      }

    });

  }

}


/*

  Style Tasks

  - file: Styles a single file.
         - If the file is in the /src/styles folder it will compile /src/styles/style.scss
         - If the file is elsewhere, like part of a Component, it will compile into the
          appropriate folder in the /src directory, then ngc will run and compile for AOT
  - src: Compiles the global styles

  SASS render method is called and fs writes the files to appropriate folder
  PostCSS processes the file in place, using the --replace argument


*/

let style = {

  file: (filePath, watch) => {

    let srcPath = filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf("/"));
    let globalCSSFilename = paths.globalCSSFilename !== undefined ? paths.globalCSSFilename : 'style.css';
    let filename = filePath.replace(/^.*[\\\/]/, '');
    let outFile = filePath.indexOf(paths.src+'/style') > -1 ? paths.build+'/style/'+globalCSSFilename : filePath.replace('.scss','.css').replace(paths.src, 'tmp');
    sass.render({
      file: filePath.indexOf(path.normalize(paths.src+'/style')) > -1 ? path.normalize(paths.src+'/style/style.scss') : filePath,
      outFile: outFile,
      includePaths: [ paths.src+'/style/' ],
      outputStyle: 'expanded',
      sourceComments: false
    }, function(error, result) {
   
      if (error) {
        warn(error.message, 'LINE: ' + error.line);
      } else {

        fs.writeFile(outFile, result.css, function (err) {
          if (!err && allowPostCSS === true) {

            let postcss = exec(path.normalize(path.join(paths.projectRoot , 'node_modules/.bin/postcss')) + ' ' + outFile + ' -c ' + path.normalize(path.join(paths.projectRoot , 'postcss.' + env + '.js'))+' -r ' + postcssConfig, function (code, output, error) {

              if ((styleFiles.indexOf(filePath) === styleFiles.length - 1) && hasCompletedFirstStylePass === false) {
                alert('libsass and postcss', 'compiled');
               // setTimeout(compile.src, 2000);
              }
              //if (hasCompletedFirstStylePass === true) {
                //compile.src();
              //}

            });
          } else {
            if ((styleFiles.indexOf(filePath) === styleFiles.length - 1) && hasCompletedFirstStylePass === false) {
              alert('libsass', 'compiled');
             // setTimeout(compile.src, 2000);
            }
          }
        });

      }
    });

  },
  src: () => {

    mkdir(path.join(paths.build , 'style'));

    ls(path.normalize(paths.src + '/**/*.scss')).forEach(function (file, index) {
      if (file.replace(/^.*[\\\/]/, '')[0] !== '_') {
        styleFiles.push(file);
      }
    });

    ls(path.normalize(paths.src + '/**/*.scss')).forEach(function (file, index) {
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


let init = function () {

  rm('-rf', path.normalize('./tmp/'));
  rm('-rf',  path.normalize('./ngfactory'));
  rm('-rf', path.normalize(path.join('./' , paths.build)));

  clean.tmp();

  mkdir(path.normalize('./' + paths.build));
  mkdir(path.normalize('./' + paths.build + '/lib'));

  if (utils.paths.buildHooks && utils.paths.buildHooks[env] && utils.paths.buildHooks[env].pre) {
    utils.paths.buildHooks[env].pre();
  }

  copy.lib();
  copy.public();
  compile.main();
  style.src();

};

/*

  Watcher

  Chokidar is used to watch files, run the above methods.

*/


let watcher = chokidar.watch(path.normalize('./' + paths.src + '/**/*.*'), {
  ignored: /[\/\\]\./,
  persistent: canWatch
}).on('change', filePath => {


  if (filePath.indexOf(path.join(paths.src , 'public')) > -1) {

    if (filePath.indexOf(path.join(paths.src , 'index.html'))) {
      copy.public();
    } else {
      copy.file(filePath);
    }

  }

  else if (filePath.indexOf('.scss') > -1) {

    alert('CHANGE DETECTED', filePath, 'triggered', 'libsass');

    hasCompletedFirstStylePass = true;
    style.file(filePath, true);

  }

})
  .on('unlink', filePath => log('File', filePath, 'has been', 'removed'));

watcher
  .on('error', error => warn('ERROR:', error))
  .on('ready', () => {

    alert('INITIAL SCAN COMPLETE', 'building for', env);

    init();

  });

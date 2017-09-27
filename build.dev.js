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
const config = utils.config;
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
let canServe = false;
let isVerbose = false;

/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg) => {
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
- lib: Copies files and folders from /node_modules to /build/lib

*/


const copy = {
  public: (filePath) => {

    cp('-R', path.normalize(config.src + '/public/')+'.', path.normalize(path.join(config.build , '/')));

    exec(path.join(config.cliRoot , path.normalize('node_modules/.bin/htmlprocessor'))+
         ' '+ path.normalize(path.join(config.build , '/')+ 'index.html')+
         ' -o '+ path.normalize(path.join(config.build , '/')+ 'index.html')+
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
    if (isVerbose)  log(filePath, 'copied to',  path.join(config.build , '/'));

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

- clean: Removes source code comments
- ts: Compiles AOT for development using ngc

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

  main: () => {

    const outFile = path.join(config.projectRoot, config.build , 'main.ts');

    fs.readFile(path.join(config.projectRoot, 'main.prod.js'), 'utf8', function (err, contents) {
      if (!err) {
        contents = contents.replace("./ngfactory/src/app/app.module.ngfactory", "src/app/app.module.ngfactory");
        contents = contents.replace("import { enableProdMode } from '@angular/core';", "");
        contents = contents.replace("enableProdMode();", "");
        fs.writeFile(outFile, contents, function (err) {
          if (!err) {
            let transpile = exec(path.join(config.projectRoot, 'node_modules/.bin/tsc')+
                                 ' ' + outFile + ' --target es5 --module commonjs'+
                                 ' --emitDecoratorMetadata true --experimentalDecorators true'+
                                 ' --noImplicitAny false --allowUnreachableCode false --moduleResolution node'+
                                 ' --typeRoots node --lib dom,es2017',
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

  },
  src: () => {

        isCompiling = true;

        let clean = exec(scripts['clean:ngfactory'], function (code, output, error) {

          if (canWatch === true) {
            spawn(path.normalize(config.projectRoot+'/node_modules/.bin/ngc')+' -p '+
                  path.normalize('./tsconfig.dev.json')+
                  ' --watch', { shell: true, stdio: 'inherit' });
          } else {
            spawn(path.normalize(config.projectRoot+'/node_modules/.bin/ngc')+
                  ' -p '+path.normalize('./tsconfig.dev.json'), { shell: true, stdio: 'inherit' });
          }

          alert(colors.green('Build is ready'));
          if (canServe === true) {
            utils.serve(canWatch);
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


let style = utils.style;



/*

  Init Tasks

  A sequence of commands needed to clean and start the prod build

*/


let init = function () {


  rm('-rf', path.normalize(path.join('./', config.build)));

  clean.tmp();

  mkdir(path.normalize('./' + config.build));
  mkdir(path.normalize('./' + config.build + '/lib'));

  if (config.buildHooks && config.buildHooks[env] && config.buildHooks[env].pre) {
    config.buildHooks[env].pre();
  }

  copy.lib();
  copy.public();

  style.src({
    sassConfig: config.style.sass.dev,
    env: env,
    allowPostCSS: true,
    src: config.src,
    dist: config.build,
    styleSrcOnInit: false
  },
  function(filePath){
    if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {
      alert('libsass and postcss', 'compiled');
      setTimeout(compile.src, 1000);
    }
  },
  function(filePath, outFile, err){
    if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {
      if (!err) {
        alert('libsass', 'compiled');
        setTimeout(compile.src, 1000);
      }
    }
  });

  compile.main();

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

  else if (filePath.indexOf('.scss') > -1) {

    alert('change', filePath.replace(/^.*[\\\/]/, ''), 'triggered libsass and postcss');

    hasCompletedFirstStylePass = true;

    style.file(filePath, {
      sassConfig: config.style.sass.dev,
      env: env,
      allowPostCSS: true,
      src: config.src,
      dist: config.build,
      styleSrcOnInit: false,
      isVerbose: isVerbose
    },
    function (filePath) {
      if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {
        alert('libsass and postcss', 'compiled');
        setTimeout(compile.src, 1000);
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
  .on('error', error => warn('ERROR:', error))
  .on('ready', () => {

    alert('ngr started', colors.red(env));
    init();

  });

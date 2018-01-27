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
let startElectron = false;
let template = 'index.html';
let tsConfig = './tsconfig.' + env + '.json';

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
  if (arg.includes('electron')) {
    startElectron = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if (arg.includes('postcss')) {
    allowPostCSS = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if (arg.includes('template')) {
    template = arg.split('=')[1].trim();
  }
  if (arg.includes('tsConfig')) {
    tsConfig = arg.split('=')[1].trim();
  }
});


if (!config.style || !config.style.sass || !config.style.sass.dev) {
  config.style = {
    sass: {
      dev: {
        includePaths: [config.src+'/style/'],
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

    cp('-R', path.normalize(config.src + '/public/') + '.', path.normalize(path.join(config.build, '/')));

    exec(path.join(config.cliRoot, path.normalize('node_modules/.bin/htmlprocessor')) +
      ' ' + path.normalize(path.join(config.build, '/') + template) +
      ' -o ' + path.normalize(path.join(config.build, '/') + 'index.html') +
      ' -e ' + env, { silent: true }, function (code, output, error) {
        alert('htmlprocessor', 'formatted index.html');
      });

    if (isVerbose) log(filePath || path.join(config.src, 'public/'), 'copied to', path.join(config.build, '/'));

    if (config && config.clean) {
      clean.paths(config);
    }

  },
  file: (filePath, dest) => {

    cp('-R', filePath, dest || path.join(config.build, '/'));
    if (isVerbose) log(filePath, 'copied to', dest || path.join(config.build, '/'));

  },
  lib: () => {

    for (var i = 0; i < config.dep.lib.length; i++) {

      if (config.dep.lib[i].split('/').pop().split('.').length > 1) { // file
        let filePath = path.join(config.dep.dist, config.dep.lib[i]);
        if (!fs.existsSync(path.normalize(filePath.substring(0, filePath.replace(/\\/g, "/").lastIndexOf('/'))))) {
          mkdir('-p', path.normalize(filePath.substring(0, filePath.replace(/\\/g, "/").lastIndexOf('/'))));
        } // catch folders
        cp('-R', path.join(path.normalize(config.dep.src), path.normalize(config.dep.lib[i])), path.join(path.normalize(config.dep.dist), path.normalize(config.dep.lib[i])));
      } else { // folder
        cp('-R', path.join(path.normalize(config.dep.src), path.normalize(config.dep.lib[i])), path.join(path.normalize(config.dep.dist), path.normalize(config.dep.lib[i])));
      }

      if (isVerbose) log(config.dep.lib[i], 'copied to', path.join(path.normalize(config.dep.dist), path.normalize(config.dep.lib[i])));
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

    const outFile = filePath ? filePath : path.join(config.projectRoot, config.build, 'bundle.js');

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

    const outFile = path.join(config.projectRoot, config.build, 'main.ts');

    fs.readFile(path.join(config.projectRoot, 'main.prod.js'), 'utf8', function (err, contents) {
      if (!err) {
        contents = contents.replace("./ngfactory/"+config.src+"/app/app.module.ngfactory", config.src+"/app/app.module.ngfactory");
        contents = contents.replace('import { enableProdMode } from "@angular/core";', '');
        contents = contents.replace("enableProdMode();", "");
        fs.writeFile(outFile, contents, function (err) {
          if (!err) {
            let transpile = exec(path.join(config.projectRoot, 'node_modules/.bin/tsc') +
              ' ' + outFile + ' --target es5 --module commonjs' +
              ' --emitDecoratorMetadata true --experimentalDecorators true' +
              ' --noImplicitAny false --sourceMap true --moduleResolution node' +
              ' --typeRoots node --lib dom,es2017', { silent: true },
              function (code, output, error) {
                if (isVerbose) alert('typescript compiled', outFile);
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

    let readyMessage = function(isAOTWatch) {
      if (!isAOTWatch) {
        alert(colors.green('Build is ready'));
        console.log('\n');
      }
      if (canServe === true) {
        alert(colors.green('Ready to serve'));
        utils.serve(canWatch);
      } else if (startElectron === true) {
        alert(colors.green('Ready to serve'));
        utils.electron(canWatch);
      }
    }

    let clean = exec(scripts['clean:ngfactory'], function (code, output, error) {

      if (canWatch === true) {
        utils.alert('@angular/compiler started');
        readyMessage(true);
        spawn(path.normalize(config.projectRoot + '/node_modules/.bin/ngc') + ' -p ' +
          path.normalize(tsConfig) +
          ' --watch', { shell: true, stdio: 'inherit' });
      } else {
        utils.alert('@angular/compiler started');
        exec(path.normalize(config.projectRoot + '/node_modules/.bin/ngc') +
          ' -p ' + path.normalize(tsConfig), { shell: true, stdio: 'inherit' }, function(){
            utils.alert('@angular/compiler compiled');
            readyMessage();
          });
      }



      hasInit = true;

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


let init = () => {

  const initProcesses = () => {

    copy.lib();
    copy.public();

    if (fs.existsSync(config.projectRoot + '/lazy.config.json')) {
      cp(config.projectRoot + '/lazy.config.json', config.build + '/');
      if (isVerbose) log('copied lazy.config.json to ' + config.build);
    }

    allowPostCSS ? alert('libsass and postcss', 'started') : alert('libsass', 'started');
    style.src({
      sassConfig: config.style.sass.dev,
      env: env,
      allowPostCSS: allowPostCSS,
      src: config.src,
      dist: config.build,
      styleSrcOnInit: false,
      sourceMap: true,
      isVerbose: isVerbose
    },
      function (filePath) {
        if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {
          allowPostCSS ? alert('libsass and postcss', 'compiled') : alert('libsass', 'compiled');
          hasCompletedFirstStylePass = true;
          setTimeout(compile.src, 1000);
        }
      },
      function (filePath, outFile, err) {
        if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {
          if (!err) {
            //alert('libsass', 'compiled');
            allowPostCSS ? alert('libsass and postcss', 'compiled') : alert('libsass', 'compiled');
            hasCompletedFirstStylePass = true;
            setTimeout(compile.src, 1000);
          }
        }
      });
    compile.main();

  }

  rm('-rf', path.normalize(path.join('./', config.build)));

  clean.tmp();

  mkdir(path.normalize('./' + config.build));
  mkdir(path.normalize('./' + config.build + '/lib'));

  if (config.buildHooks && config.buildHooks[env] && config.buildHooks[env].pre) {

    config.buildHooks[env].pre(process.argv).then(() => {

      initProcesses();

      if (canWatch) {
        watch();
      }

    });

  } else {

    initProcesses();

    if (canWatch) {
      watch();
    }

  }


};

/*

  Watcher

  Chokidar is used to watch files, run the above methods.

*/

let watch = () => {

  let watcher = chokidar.watch(path.normalize('./' + config.src + '/**/*.*'), {
    ignored: /[\/\\]\./,
    persistent: canWatch
  }).on('change', filePath => {


    if (hasInit === false) {
      return;
    }

    if (filePath.includes(path.join(config.src, 'public'))) {

      if (filePath.includes(path.join(config.src, 'public', 'index.html'))) {
        copy.public();
      } else {
        copy.file(filePath, filePath.replace(path.normalize(config.src+'/public/'), path.normalize(config.build + '/')));
      }

    }

    else if (filePath.indexOf('.scss') > -1) {

      //alert('change', filePath.replace(/^.*[\\\/]/, ''), 'triggered libsass and postcss');

      hasCompletedFirstStylePass = true;

      style.file(filePath, {
        sassConfig: config.style.sass.dev,
        env: env,
        allowPostCSS: allowPostCSS,
        src: config.src,
        dist: config.build,
        styleSrcOnInit: false,
        isVerbose: isVerbose
      },
      function (filePath, outFile) {

          if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1 && hasCompletedFirstStylePass === false) {
            allowPostCSS ? alert('libsass and postcss', 'compiled') : alert('libsass', 'compiled');
          }

      });


    }

  })
    .on('unlink', filePath => log(filePath, 'has been removed'));

  watcher
    .on('error', error => warn('ERROR:', error));

}


init();

"use strict";

require('shelljs/global');

const env = 'prod';
const path = require('path');
const fs = require('fs');
const utils = require('./build.utils.js');
const chokidar = require('chokidar');
const sass = require('node-sass');
const postcss = require('./postcss.' + env + '.js');
const minifyHtml = require('html-minifier').minify;

const console = utils.console;
const colors = utils.colors;
const scripts = utils.scripts;
const config = utils.config;
const log = utils.log;
const alert = utils.alert;
const warn = utils.warn;
const clean = utils.clean;
const angular = utils.angular;


if (config.preLibraryBuild) {
  const preBuild = config.preLibraryBuild;
}

if (config.postLibraryBuild) {
  const postBuild = config.postLibraryBuild;
}

let allowPostCSS = true;
let canWatch = false;
let isCompiling = false;
let hasInit = false;
let styleFiles = [];
let hasCompletedFirstStylePass = false;
let postcssConfig = ' -u';
let isVerbose = false;
let libConfig = null;
let libConfigPath = null;

/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg) => {
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if (arg.includes('verbose')) {
    isVerbose = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if (arg.includes('postcss')) {
    allowPostCSS = arg.split('=')[1].trim() === 'true' ? true : false;
  }
  if (arg.includes('config')) {
    libConfigPath = arg.split('=')[1].trim().length > 0 ? arg.split('=')[1].trim() : null;
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

- file: Copies a file to /dist

*/

const copy = {
  file: (filePath) => {
    cp('-R', path.normalize(filePath), path.normalize(libConfig.dist + '/'));
    if (isVerbose) log(filePath, 'copied to', path.normalize(libConfig.dist + '/'));
  }
};


/*

  Compile Tasks

- clean: Removes source code comments
- src: Compiles library components and formats for AOT,
       using `ngc` and Rollup, according to Angular Package Format 4.0 spec
- umdLib: Formats the bundle according to the UMD module pattern in /dist/bundles/
- es5Lib: Transpiles the bundle down to ES5 in /dist

*/


const compile = {

  clean: (filePath) => {

    const outFile = filePath ? filePath : path.normalize('./' + libConfig.dist + '/bundle.js');
    let inline = '';

    fs.readFile(outFile, 'utf8', function (err, contents) {
      if (!err) {
        contents = contents.replace(utils.multilineComment, '');
        contents = contents.replace(utils.singleLineComment, '');

        if (contents.search(utils.componentRegex) > -1) {
          inline = angular({
            preprocessors: {
              template: template => minifyHtml(template, {
                caseSensitive: true,
                collapseWhitespace: true,
                removeComments: true,
                quoteCharacter: '"'
              })
            }
          }, contents, filePath.substring(0, filePath.replace(/\\/g, "/").lastIndexOf('/')));

          if (isVerbose) ('inline template and styles for', filePath);

          if (inline) {
            contents = inline.code;
          }

        }

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

  src: () => {

    isCompiling = true;


    // remove moduleId prior to ngc build. TODO: look for another method.
    ls(path.normalize('./tmp/**/*.ts')).forEach(function (file) {

      compile.clean(file);
      sed('-i', /^.*moduleId: module.id,.*$/, '', file);

    });

    let clean = exec(scripts['clean:ngfactory'], function (code, output, error) {

      utils.log('es2015 started');
      //alert('@angular/compiler', 'started');

      let tsc = exec(path.normalize(config.processRoot + '/node_modules/.bin/ngc') +
        ' -p ' + (libConfigPath !== null ? path.join(libConfig.src, libConfig.es2015.tsConfig) : libConfig.es2015.tsConfig), {silent: true}, function (code, output, error) {

          alert('@angular/compiler compiled ngfactory');

          cp('-R', path.normalize(libConfig.src + '/') + '.', path.normalize('tmp/'));
          //alert('rollup', 'started');

          let bundle = exec(path.normalize(config.processRoot + '/node_modules/.bin/rollup') + 
            ' -c ' + (libConfigPath !== null ? path.join(libConfig.src , libConfig.es2015.rollupConfig) : libConfig.es2015.rollupConfig), function (code, output, error) {

              alert('rollup', 'bundled', path.normalize(libConfig.es2015.outFile));
              compile.umdLib(libConfig);

          });


        });
    });

  },

  umdLib: () => {

    utils.log('umd started');

    let tsc = exec(path.normalize(config.processRoot + '/node_modules/.bin/ngc') +
      ' -p ' + (libConfigPath !== null ? path.join(libConfig.src, libConfig.umd.tsConfig) : libConfig.umd.tsConfig), { silent: true }, function (code, output, error) {
        alert('@angular/compiler compiled ngfactory');
        //alert('rollup', 'started');

        let bundle = exec(path.normalize(config.processRoot + '/node_modules/.bin/rollup') +
          ' -c ' + (libConfigPath !== null ? path.join(libConfig.src, libConfig.umd.rollupConfig) : libConfig.umd.rollupConfig), function (code, output, error) {

            alert('rollup', 'bundled', path.normalize(libConfig.umd.outFile));

            //alert('babel', 'started transpiling', libConfig.filename + '.umd.js');

            let transpile = exec(path.normalize(config.processRoot + '/node_modules/.bin/babel') +
              ' --source-maps' +
              ' --presets=es2015-rollup ' +
              ' --plugins=transform-es2015-modules-commonjs ' +
              ' --module umd ' +
              path.normalize(libConfig.umd.outFile) +
              ' --out-file ' + path.normalize(libConfig.umd.outFile), function (code, output, error) {
                
                alert('babel', 'transpiled', path.normalize(libConfig.umd.outFile));
                compile.es5Lib(libConfig);

              });

          });
      });
  },


  es5Lib: () => {

    utils.log('es5 started');

    let tsc = exec(path.normalize(config.processRoot + '/node_modules/.bin/ngc') +
      ' -p ' + (libConfigPath !== null ? path.join(libConfig.src, libConfig.es5.tsConfig) : libConfig.es5.tsConfig), { silent: true }, function (code, output, error) {

        alert('@angular/compiler compiled ngfactory');
        // alert('rollup', 'started bundling');

        let bundle = exec(path.normalize(config.processRoot + '/node_modules/.bin/rollup') +
          ' -c ' + (libConfigPath !== null ? path.join(libConfig.src, libConfig.es5.rollupConfig) : libConfig.es5.rollupConfig), function (code, output, error) {

            alert('rollup', 'bundled', path.normalize(libConfig.es5.outFile));
          
            find(path.normalize('./ngfactory/'))
              .filter(function (file) { return file.match(/\.d.ts$/); })
              .forEach((filePath) => {

                let dir = path.normalize(filePath.substring(0, filePath.lastIndexOf("/")).replace('ngfactory', 'dist'));
                let fileName = filePath.replace(/^.*[\\\/]/, '');

                if (!fs.existsSync(dir)) {
                  mkdir('-p', dir);
                }

                cp(filePath, path.join(dir, fileName));

              });

            if (isVerbose) log('d.ts, metadata.json', 'copied to', './' + libConfig.dist);

            cp(path.normalize(path.join('./ngfactory', libConfig.filename + '.metadata.json')), path.normalize(libConfig.dist));

            //rm(path.normalize(libConfig.dist + '/index.ts'));

            find(path.normalize('./' + libConfig.dist)).filter(function (file) {

              if (config.buildHooks && config.buildHooks.lib && config.buildHooks.lib.clean) {
                config.buildHooks.lib.clean(process.argv, file);
              } else {
                if (file.match(/component.ts$/) || file.match(/directive.ts$/) || file.match(/injectable.ts$/) || file.match(/module.ts$/) || file.match(/.html$/) || file.match(/.scss$/)) {
                  rm(file);
                }
              }

            });

            //alert('babel', 'started transpiling', libConfig.filename + '.es5.js');

            let transpile = exec(path.normalize(config.processRoot + '/node_modules/.bin/babel') +
              ' --source-maps' +
              ' --presets=es2015-rollup ' + (libConfig.es5.outFile) +
              ' --out-file ' + (libConfig.es5.outFile), function (code, output, error) {

                alert('babel', 'transpiled', path.normalize(libConfig.es5.outFile));
                alert(colors.green('Build is ready'));
              });

            let copyCommand = 'cp ' + libConfig.src + '/package.json' + ' ' + libConfig.dist + '/package.json';

            exec(copyCommand, function () {

              if (isVerbose) log('package.json', 'copied to', './' + libConfig.dist);

              if (config.buildHooks && config.buildHooks.lib && config.buildHooks.lib.post) {
                config.buildHooks.lib.post(process.argv);
              }

            });

          });
      });
  }
};

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


let style = utils.style;

/*

  Init Tasks

  A sequence of commands needed to clean and start the lib build

*/


let init = () => {

  const initProcesses = () => {

    clean.lib();
    //allowPostCSS ? alert('libsass and postcss', 'started') : alert('libsass', 'started');
    style.src({
      sassConfig: config.style.sass.prod,
      env: 'prod',
      allowPostCSS: allowPostCSS,
      src: libConfig.src,
      dist: libConfig.dist,
      styleSrcOnInit: false,
      isVerbose: isVerbose
    },
      function (filePath) {

        if (hasCompletedFirstStylePass === false) {
          allowPostCSS ? alert('libsass and postcss', 'compiled') : alert('libsass', 'compiled');
          hasCompletedFirstStylePass = true;
          compile.src();
        }
      },
      function (filePath, outFile, err) {

      });
  }

  rm('-rf', path.normalize(config.processRoot + '/.tmp/'));
  rm('-rf', path.normalize('./ngfactory'));
  rm('-rf', path.normalize('./' + libConfig.dist));

  mkdir(path.normalize('./ngfactory'));
  mkdir(path.normalize('./' + libConfig.dist));
  mkdir(path.normalize('./' + libConfig.dist + '/bundles'));

  if (config.buildHooks && config.buildHooks['lib'] && config.buildHooks['lib'].pre) {

    config.buildHooks['lib'].pre(process.argv).then(() => {

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

// backwards compatibility with previous default lib build

if (libConfigPath === null) { 
  libConfig = {
    'src': config.lib,
    'dist': config.dist,
    'filename': config.libFilename,
    'es2015': {
      tsConfig: './tsconfig.lib.json',
      rollupConfig: 'rollup.config.lib.js',
      outFile: './dist/' + config.libFilename + '.js'
    },
    'es5': {
      tsConfig: './tsconfig.lib.es5.json',
      rollupConfig: 'rollup.config.lib-es5.js',
      outFile: './dist/' + config.libFilename + '.es5.js'
    },
    'umd': {
      tsConfig: './tsconfig.lib.es5.json',
      rollupConfig: 'rollup.config.lib-umd.js',
      outFile: './dist/bundles/' + config.libFilename + '.umd.js'
    }
  };
  init();

} else {
  fs.readFile(libConfigPath, 'utf8', function (err, contents) {
    if (!err) {
      libConfig = JSON.parse(contents);
      init();
    } else {
      warn(err);
    }
  });
}

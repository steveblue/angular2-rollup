"use strict";

require('shelljs/global');

const fs = require('fs');
const chokidar = require('chokidar');
const clim = require('clim');
const console = clim();
const colors = require('colors/safe');
const scripts = require('./package.json').scripts;
const lib = require('./static.config.js');

const env = process.env.NODE_ENV;

/* Log */

clim.getTime = function(){
  let now = new Date();
  return colors.gray('['+
         now.getHours() + ':' +
         now.getMinutes() + ':' +
         now.getSeconds() + ']');
};

let log = (action, noun, verb, next) => {
    let a = action ? colors.blue(action) : '';
    let n = noun ? colors.magenta(noun) : '';
    let v = verb ? colors.green(verb) : '';
    let x = next ? colors.cyan(next) : '';
    console.log(a + ' ' + n + ' ' + v + ' ' + x );
};

let warn = function(action, noun) {
    let a = action ? colors.green(action) : '';
    let n = noun ? colors.magenta(noun) : '';
    console.warn(a + ' ' + n);
};

/* Linter */

const Linter = require('tslint');
const configuration = require('./tslint.json');
const options = {
    formatter: 'json',
    configuration: configuration,
    rulesDirectory: 'node_modules/codelyzer'
};

const tslint = (path) => {

    let program = Linter.createProgram('./tsconfig.json', path ? path.substring(0, path.lastIndexOf('/')) : './src/');
    let files = Linter.getFileNames(program);
    let results = files.map(file => {

        let fileContents = program.getSourceFile(file).getFullText();
        let linter = new Linter(file, fileContents, options, program);
        let results = linter.lint();

        if (results.failureCount > 0) {
            let failures = JSON.parse(results.output);
            failures.forEach((data) => {
                log('tslint:',
                    data.failure,
                    '[' + data.startPosition.line +
                    ', ' + data.startPosition.character + ']',
                    data.name);
            });
        }

    });
};

/* Copy */

let copy = {
    public: (path) => {

        cp('-R', 'src/public/.', 'dist/');
        log('Copied', path || 'src/public/', 'to', 'dist/');

    },
    lib: () => {

        mkdir('-p', __dirname + '/' + lib.dist);

        for( var i=0;  i < lib.dep.length; i++ ) {

            cp('-R', lib.src + '/' + lib.dep[i], lib.dist + '/' + lib.dep[i]);
            log('Copied dependency ', lib.dep[i], ' to ',  lib.dist + '/' + lib.dep[i]);

        }
    }
};

/* Compile */

let isCompiling = false;

let compile = {
    vendor : () => {

        isCompiling = true;

        let vendor = exec(scripts['bundle:vendor'], function(code, output) {

            log('Rollup', 'bundled', 'vendor.es2015.js in', 'dist/');

            let tsc = exec(scripts['transpile:vendor'], function(code, output) {
                log('Typescript', 'transpiled', 'vendor.es2015.js to', 'dist/vendor.js');

                if (env === 'production') {
                    exec(scripts['uglify:vendor'], function(code, output) {
                        log('Uglify', 'minified', 'vendor.js to', 'dist/vendor.js');
                    });
                }

            });

        });

    },
    src : () => {

        isCompiling = true;

        let bundle = exec(scripts['bundle:src'], function(code, output) {

            log('Rollup', 'bundled', 'bundle.es2015.js in', 'dist/');

            let tsc = exec(scripts['transpile:src'], function(code, output) {
                log('Typescript', 'transpiled', 'bundle.es2015.js to', 'dist/bundle.js');

                if (env === 'production') {
                    exec(scripts['uglify:src'], function(code, output) {
                        log('Uglify', 'minified', 'bundle.js to', 'dist/bundle.js');
                        isCompiling = false;
                    });
                } else {
                    isCompiling = false;
                }

            });
        });

    }
}

/* Styling */


let style = {
    global: () => {

        let script = [(env === 'production') ? 'compile:sass-global-prod' : 'compile:sass-global',
                      (env === 'production') ? 'compile:css-global-prod' : 'compile:css-global'];

        let css = exec(scripts[script[0]], function(code, output) {

            log('SASS', 'compiled', 'style.css in', 'dist/style/');

            let postcss = exec(scripts[script[1]], function(code, output) {
                log('PostCSS', 'transformed', 'style.css');
            });

        });
    },
    src: (path) => {

        let script = [(env === 'production') ? 'compile:sass-src-prod' : 'compile:sass-src',
                (env === 'production') ? 'compile:css-src-prod' : 'compile:css-src'];

        let css = exec(scripts[script[0]], function(code, output) {

            if(path) {
                log('SASS', 'compiled', path + ' in', 'src/app/');
            }

            let postcss = exec(scripts[script[1]], function(code, output) {

                if(!isCompiling) {
                    compile.src();
                }

            });

        });
    }
};


/* Server */


let server = {
    dev: () => {
        exec(scripts['dev:server']);
    },
    prod: () => {

    }
}

/* Watcher */

let watcher = chokidar.watch('./src/**/*.*', {
  ignored: /[\/\\]\./,
  persistent: true
}).on('add', path => log('File', path, 'has been', 'added'))
  .on('change', path => {

      log('File', path, 'has been', 'changed');

      if ( path.indexOf('src/public') > -1 ) {

          copy.public(path);

      }


      else if ( path.indexOf('.html') > -1 && path.indexOf('src') > -1) {

       log('File', path, 'triggered', 'transpile');

       if (!isCompiling) {

          compile.src();

       }



      }

      else if ( path.indexOf('.ts') > -1 ) {

       log('File', path, 'triggered', 'transpile');

       tslint(path);

       if (!isCompiling) {

          compile.src();

       }


      }
      else if ( path.indexOf('.scss') > -1 ) {

        log('File', path, 'triggered', 'compile');

        if (path === 'src/style/style.scss') {

            style.global();

        }

        if (path.indexOf('src/app') > -1) {

            style.src(path);

        }
      }

   })
  .on('unlink', path => log('File', path, 'has been', 'removed'));

// More possible events.
watcher
  .on('addDir', path => log('Directory', path, 'is being', 'watcher'))
  .on('unlinkDir', path => warn('Directory', path, 'has been removed from', 'watcher'))
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    log('Initial scan complete.',  'Building for',  process.env.NODE_ENV || 'development');

    compile.vendor();
    copy.lib();
    copy.public();
    style.global();
    style.src();
    //tslint();


  });

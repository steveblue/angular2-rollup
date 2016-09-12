"use strict";

require('shelljs/global');

const fs = require('fs');
const chokidar = require('chokidar');
const clim = require('clim');
const console = clim();
const colors = require('chalk');
const scripts = require('./package.json').scripts;
const lib = require('./static.config.js');
const sass = require('node-sass');


const env = process.env.NODE_ENV || 'dev';

/* Log Formatting */

clim.getTime = function(){
  let now = new Date();
  return colors.gray(colors.dim('['+
         now.getHours() + ':' +
         now.getMinutes() + ':' +
         now.getSeconds() + ']'));
};

const log = (action, noun, verb, next) => {
    let a = action ? colors.blue(action) : '';
    let n = noun ? colors.magenta(noun) : '';
    let v = verb ? colors.green(verb) : '';
    let x = next ? colors.cyan(next) : '';
    console.log(a + ' ' + n + ' ' + v + ' ' + x );
};

const warn = function(action, noun) {
    let a = action ? colors.green(action) : '';
    let n = noun ? colors.magenta(noun) : '';
    console.warn(a + ' ' + n);
};

/* Linter Options */

const Linter = require('tslint');
const configuration = require('./tslint.json');
const options = {
    formatter: 'json',
    configuration: configuration,
    rulesDirectory: 'node_modules/codelyzer'
};

/* Copy */

const copy = {
    public: (path) => {

        cp('-R', 'src/public/.', 'dist/');

        if (env === 'prod') {

          exec(scripts['replace:html-prod'], function(code, output, error){
               log('Formatted', 'index.html', 'for',  colors.inverse(env));
          });
        }

        if (env === 'dev') {

          exec(scripts['replace:html-dev'], function(code, output, error){
               log('Formatted', 'index.html', 'for',  colors.inverse(env));
          });

        }

        log('Copied', path || 'src/public/', 'to', 'dist/');

    },
    file: (path) => {
        cp('-R', path, 'dist/');
        log('Copied', path, 'to', 'dist/');
    },
    html: (path) => {
        ls('src/app/**/*.html').forEach(function(file) {
          cp(file, 'dist/'+file);
          log('Copied ', file.replace(/^.*[\\\/]/, ''), 'to',  'dist/'+file.substring(0, file.lastIndexOf("/")));
        });
    },
    lib: () => {

        mkdir('-p', __dirname + '/' + lib.dist);

        for( var i=0;  i < lib.dep.length; i++ ) {

            cp('-R', lib.src + '/' + lib.dep[i], lib.dist + '/' + lib.dep[i]);
            log('Copied dependency', lib.dep[i], 'to',  lib.dist + '/' + lib.dep[i]);

        }
    }
};

/* Compile */

let isCompiling = false;
let hasInit = false;

const compile = {

    clean: (path) => {
      const multilineComment = /^[\t\s]*\/\*\*?[^!][\s\S]*?\*\/[\r\n]/gm;
      const singleLineComment = /^[\t\s]*(\/\/)[^\n\r]*[\n\r]/gm;
      const outFile = path ? path : './dist/bundle.js';

      fs.readFile(outFile, 'utf8', function(err, contents) {
        if(!err) {
            contents = contents.replace(multilineComment, '');
            contents = contents.replace(singleLineComment, '');
            fs.writeFile(outFile, contents, function(err){
              if(!err) {
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
        cp('-R', 'src/.', 'tmp/');
        log('Copied', 'src/*.ts', 'to', 'tmp/*ts');

        // remove moduleId prior to ngc build. TODO: look for another method.
        ls('tmp/**/*.ts').forEach(function(file) {
          sed('-i', /^.*moduleId: module.id,.*$/, '', file);
        });

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

              log('ngc', 'started', 'compiling', 'ngfactory');

              let tsc = exec(scripts['build:ngc'], function(code, output, error) {
                  log('ngc', 'transpiled', '/ngfactory');
                  log('Rollup', 'started', 'bundling', 'ngfactory');

                 let bundle = exec(scripts['bundle:src'], function(code, output, error) {
                     log('Rollup', 'bundled', 'bundle.es2015.js in', './dist');
                     log('Closure Compiler', 'is optimizing', 'bundle.js', 'for '+ colors.inverse(env));

                     let closure = exec(scripts['transpile:closure'], function(code, output, error){
                          log('Closure Compiler', 'transpiled', './dist/bundle.es2015.js to', './dist/bundle.js');
                          compile.clean();
                          isCompiling = false;
                          hasInit = true;
                     });
                 });
              });
       });

    },

    ts : () => {

        isCompiling = true;

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

            log('Typescript', 'started', 'transpiling', './src/*.ts');

            let tsc = exec(scripts['transpile:src'], function(code, output, error) {
                log('Typescript', 'transpiled', './src/*.ts to', './dist/*.js');
                if(hasInit === false) {
                    copy.html();
                    style.src();
                }

                isCompiling = false;
                hasInit = true;
            });
       });

    }
}


const tslint = (path) => {

    let program = Linter.createProgram('./tsconfig.'+env+'.json', path ? path.substring(0, path.lastIndexOf('/')) : './src/');
    let files = Linter.getFileNames(program);
    let results = files.map(file => {

        let fileContents = program.getSourceFile(file).getFullText();
        let linter = new Linter(file, fileContents, options, program);
        let results = linter.lint();

        if (results.failureCount > 0) {
            let failures = JSON.parse(results.output);
            for (let i = 0; i < failures.length; i++) {
                 log('tslint:',
                    failures[i].failure,
                    '[' + failures[i].startPosition.line +
                    ', ' + failures[i].startPosition.character + ']',
                    failures[i].name);
            }

        }

    });
};


/* Styling */
let styleCount = 0;
let initStyleCount = 0;

let style = {
    src: (path, watch) => {

      if(path) {

        let srcPath = path.substring(0, path.lastIndexOf("/"));
        let filename = path.replace(/^.*[\\\/]/, '');
        let outFile = path.indexOf('style.scss') > -1 ? 'dist/style/style.css' : (env === 'dev') ? 'dist/'+srcPath+'/'+filename.replace('.scss','.css') : path.replace('.scss','.css').replace('src', 'tmp');
        sass.render({
          file: path,
          outFile: outFile,
          includePaths: [ 'src/style/' ],
          outputStyle: 'expanded',
          sourceComments: (env === 'dev') ? true : false
        }, function(error, result) {
          if (error) {
            console.log(error.status);
            console.log(error.column);
            console.log(error.message);
            console.log(error.line);
          } else {

            fs.writeFile(outFile, result.css, function(err){
              if(!err){

                if (watch === true) log('SASS', 'compiled', 'component style at', outFile);

                let postcss = exec('postcss -c postcss.'+env+'.json -r '+outFile, function(code, output, error) {
                    if ( watch === true ) log('PostCSS', 'transformed', 'component style at', outFile);
                    if ( watch === true && env === 'prod' && path.indexOf('style.scss') < 0) {
                        compile.src();
                    }
                    if( !watch ) {
                      initStyleCount++;
                      if( initStyleCount === styleCount - 1) {
                        log('SASS and PostCSS', 'compiled', 'for', colors.inverse(env));
                        if ( env === 'prod' ) {
                            compile.src();
                        }
                      }
                    }
                });
              }
            });

          }
        });

      } else {

        mkdir('dist/style');

        ls('src/**/*.scss').forEach(function(file, index) {
          if( file.replace(/^.*[\\\/]/, '')[0] !== '_' ) {
             styleCount++;
          }
        });

        ls('src/**/*.scss').forEach(function(file, index) {
          if( file.replace(/^.*[\\\/]/, '')[0] !== '_' ) {
            style.src(file);
          }
        });

      }

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
}).on('change', path => {

      log('File', path, 'has been', 'changed');

      if ( path.indexOf('src/public') > -1 ) {

          copy.file(path);

      }


      else if ( path.indexOf('.html') > -1 && path.indexOf('src') > -1) {


       if (env === 'prod') {

          if(!isCompiling) {
            compile.src();
          }

        }

        if (env === 'dev') {
          copy.html(path);
        }



      }

      else if ( path.indexOf('.ts') > -1 && hasInit === true) {

       log('File', path, 'triggered', 'transpile');



        if (!isCompiling) {

          tslint(path);

          if (env === 'dev') {
            compile.ts();
          }
          if (env === 'prod') {
            compile.src();
          }


        }


      }
      else if ( path.indexOf('.scss') > -1 ) {

        log('File', path, 'triggered', 'compile');

        style.src(path, true);

      }

   })
  .on('unlink', path => log('File', path, 'has been', 'removed'));

watcher
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    log('Initial scan complete.', 'Building', 'for', colors.inverse(env));

    if (env === 'prod') {
      copy.lib();
      copy.public();
      style.src();
    }
    if (env === 'dev') {
      mkdir('./dist');
      mkdir('./dist/src');
      copy.lib();
      copy.public();
      compile.ts();
    }

  });

"use strict";

require('shelljs/global');

const fs = require('fs');
const chokidar = require('chokidar');
const clim = require('clim');
const console = clim();
const colors = require('chalk');
const scripts = require('./package.json').scripts;
const paths = require('./paths.config.js');
const sass = require('node-sass');

const env = 'prod';
let canWatch = true;

process.argv.forEach((arg)=>{
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});
/* Log Formatting */

clim.getTime = function(){
  let now = new Date();
  return colors.gray(colors.dim('['+
         now.getHours() + ':' +
         now.getMinutes() + ':' +
         now.getSeconds() + ']'));
};

const log = (action, noun, verb, next) => {
    let a = action ? colors.magenta(action) : '';
    let n = noun ? colors.green(noun) : '';
    let v = verb ? colors.cyan(verb) : '';
    let x = next ? colors.dim(colors.white(next)) : '';
    console.log(a + ' ' + n + ' ' + v + ' ' + x );
};

const warn = function(action, noun) {
    let a = action ? colors.red(action) : '';
    let n = noun ? colors.white(noun) : '';
    console.warn(a + ' ' + n);
};

/* Linter Options */

const Linter = require('tslint').Linter;
const Configuration = require('tslint').Configuration;
const options = {
    formatter: 'json',
    rulesDirectory: 'node_modules/codelyzer'
};

/* Copy */

const copy = {
    public: (path) => {

        cp('-R', paths.src+'/public/.', paths.dist+'/');

        exec(scripts['replace:html-prod'], function(code, output, error){
               log('index.html','formatted', 'for',  colors.bold(colors.cyan(env)));
        });

        log(path || paths.src+'/public/', 'copied', 'to', paths.dist+'/');

        if(paths && paths.clean) {
          clean.paths();
        }


    },
    file: (path) => {
        cp('-R', path, paths.dist+'/');
        log(path, 'copied', 'to', paths.dist+'/');
    },
    html: (path) => {
        ls(paths.src+'/app/**/*.html').forEach(function(file) {
          cp(file, paths.dist+'/'+file);
          log(file.replace(/^.*[\\\/]/, ''), 'copied', 'to',  paths.dist+'/'+file.substring(0, file.lastIndexOf("/")));
        });
    },
    lib: () => {

        mkdir('-p', __dirname + '/' + paths.dep.build);

        for( var i=0;  i < paths.dep.lib.length; i++ ) {

            cp('-R', paths.dep.src + '/' + paths.dep.lib[i], paths.dep.dist + '/' + paths.dep.lib[i]);
            log(paths.dep.lib[i], 'copied', 'to',  paths.dep.dist + '/' + paths.dep.lib[i]);

        }
    }
};


const clean = {

  paths: () => {

    if( paths.clean.files ) {

    paths.clean.files.forEach((file) => {
      rm(file);
    });

    }
    if( paths.clean.folders ) {

      paths.clean.folders.forEach((folder) => {
        rm('-rf', folder);
      });

    }

  }

}

/* Compile */

let isCompiling = false;
let hasInit = false;

const compile = {

    clean: (path) => {
      const multilineComment = /^[\t\s]*\/\*\*?[^!][\s\S]*?\*\/[\r\n]/gm;
      const singleLineComment = /^[\t\s]*(\/\/)[^\n\r]*[\n\r]/gm;
      const outFile = path ? path : './'+paths.dist+'/bundle.js';

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
        cp('-R', paths.lib+'/.', 'tmp/');
        log(paths.src+'/*.ts', 'copied', 'to', 'tmp/*ts');

        // remove moduleId prior to ngc build. TODO: look for another method.
        ls('tmp/**/*.ts').forEach(function(file) {
          sed('-i', /^.*moduleId: module.id,.*$/, '', file);
        });

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

              log('ngc', 'started', 'compiling', 'ngfactory');

              let tsc = exec(scripts['compile:lib'], function(code, output, error) {
                  log('ngc', 'compiled', '/ngfactory');
                  log('Rollup', 'started', 'bundling', 'ngfactory');

                 let bundle = exec(scripts['rollup:lib'], function(code, output, error) {
                     log('Rollup', 'bundled', 'default-lib.js in', './dist');
                     //compile.es5Lib();
                     exec(scripts['copy:lib'], function() {

                      log('Copied', 'd.ts, metadata.json', ' to ', './dist');

                    });

                 });


              });
       });

    },


    // es5Lib : () => {

    //      let tsc = exec(scripts['compile:es5'], function(code, output, error) {
    //               log('ngc', 'compiled', '/ngfactory');
    //               log('Rollup', 'started', 'bundling', 'ngfactory');

    //              let bundle = exec(scripts['rollup:es5'], function(code, output, error) {
    //                  log('Rollup', 'bundled', 'default-lib.es5.js in', './dist');

    //                 exec(scripts['copy:lib'], function() {

    //                   log('Copied', 'd.ts, metadata.json', ' to ', './dist');

    //                 });

    //              });
    //           });
    // },






    ts : (path) => {

        isCompiling = true;

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

            if (path) {
               log('typescript', 'started', 'transpiling', path);
            } else {
               log('typescript', 'started', 'transpiling', paths.src+'/*ts');
            }

            let tsc = exec(scripts['transpile:src'], function(code, output, error) {
                if (path) {
                  log('typescript', 'transpiled', path+' to', paths.dist+'/'+path.replace('.ts','.js'));
                  cp(path, paths.dist+'/'+path);
                } else {
                  log('typescript', 'transpiled', paths.src+'/*ts to', paths.dist+'/'+paths.src+'/*ts');
                }

                if(hasInit === false) {
                    copy.html();
                    style.src();
                }

                isCompiling = false;

            });
       });

    }
}


const tslint = (path) => {

    if (!path) {
      return;
    }

    let program = Linter.createProgram('./tsconfig.'+env+'.json', path ? path.substring(0, path.lastIndexOf('/')) : './'+paths.src+'/');
    let files = Linter.getFileNames(program);
    let results = files.map(file => {

        let fileContents = fs.readFileSync(file, 'utf8');
        let linter = new Linter(options);
        console.log(file);
        let configLoad = Configuration.findConfiguration('./tsconfig.'+env+'.json', file );
        let results = linter.lint(file, fileContents, configLoad.results);

        if (results && results.failureCount > 0) {
            let failures = JSON.parse(results.output);
            for (let i = 0; i < failures.length; i++) {
                 log('tslint:',
                    colors.red(failures[i].failure),
                    colors.white('[' + failures[i].startPosition.line +
                    ', ' + failures[i].startPosition.character + ']'),
                    failures[i].name);
            }

        }

    });
};


/* Styling */
let styleFiles = [];

let style = {

    file: (path, watch) => {


        let srcPath = path.substring(0, path.lastIndexOf("/"));
        let filename = path.replace(/^.*[\\\/]/, '');
        let outFile = path.indexOf(paths.src+'/style') > -1 ? paths.dist+'/style/style.css' : path.replace('.scss','.css').replace(paths.src, 'tmp');
        sass.render({
          file: path,
          outFile: outFile,
          includePaths: [ paths.src+'/style/' ],
          outputStyle: 'expanded',
          sourceComments: false
        }, function(error, result) {
          if (error) {
            console.log(error.status);
            console.log(error.column);
            console.log(error.message);
            console.log(error.line);
          } else {

            fs.writeFile(outFile, result.css, function(err){
              if(!err){

                let postcss = exec('postcss -c postcss.'+env+'.json -r '+outFile, function(code, output, error) {

                    // if ( watch === true ) {
                    //   log('PostCSS', 'transformed', 'component style at', outFile);
                    //   setTimeout(compile.src, 1000);
                    // } else {
                    //    log('PostCSS', 'transformed', 'component style at', outFile);
                    // }

                    if( !watch ) {

                      if( styleFiles.indexOf(path) === styleFiles.length - 1  ) {
                        log('libsass and postcss', 'compiled', 'for', colors.bold(colors.cyan(env)));
                        setTimeout(compile.src, 2000);
                      }
                    }
                });
              }
            });

          }
        });

    },
    src:() =>{

        mkdir(paths.dist+'/style');

        ls(paths.src+'/**/*.scss').forEach(function(file, index) {
          if( file.replace(/^.*[\\\/]/, '')[0] !== '_' ) {
             styleFiles.push(file);
          }
        });

        ls(paths.src+'/**/*.scss').forEach(function(file, index) {
          if( file.replace(/^.*[\\\/]/, '')[0] !== '_' ) {
            style.file(file);
          }
        });

    }
};


/* Server */


let server = {
    dev: () => {
        exec('node server.js');
    },
    prod: () => {
        exec(scripts['prod:server']);
    }
}

/* Init */

let init = function() {
    rm('-rf', './tmp');
    rm('-rf', './dist');
    rm('-rf', './ngfactory');
    mkdir('./dist');
    mkdir('./ngfactory');
    // cp('-R', './'+paths.src, './tmp');
    // copy.lib();
    // copy.public();
    // style.src();
    compile.src();

};

/* Watcher */


let watcher = chokidar.watch('./'+paths.src+'/**/*.*', {
  ignored: /[\/\\]\./,
  persistent: canWatch
}).on('change', path => {

      log('File', path, 'has been', 'changed');

      if ( path.indexOf(paths.src+'/public') > -1 ) {

          if ( path.indexOf(paths.src+'/index.html') ) {
            copy.public();
          } else {
            copy.file(path);
          }


      }

      else if ( path.indexOf('.html') > -1 && path.indexOf('src') > -1) {

        if(!isCompiling) {
          compile.src();
        }

      }

      else if ( path.indexOf('.ts') > -1 && hasInit === true) {

       log('File', path, 'triggered', 'transpile');



        if (!isCompiling) {

            compile.src();

        }


      }
      else if ( path.indexOf('.scss') > -1 ) {

        log('File', path, 'triggered', 'compile');

         style.file(path, true);

      }

   })
  .on('unlink', path => log('File', path, 'has been', 'removed'));

watcher
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    log('Initial scan complete.', 'Building', 'for', colors.bold(colors.cyan(env)));

    init();

  });

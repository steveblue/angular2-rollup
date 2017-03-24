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

const env = process.env.NODE_ENV || 'dev';
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

        cp('-R', 'src/public/.', 'dist/');

        if (env === 'prod') {

          exec(scripts['replace:html-prod'], function(code, output, error){
               log('index.html','formatted', 'for',  colors.bold(colors.cyan(env)));
          });
        }

        if (env === 'dev') {

          exec(scripts['replace:html-dev'], function(code, output, error){
               log('index.html', 'formatted',  'for',  colors.bold(colors.cyan(env)));
          });

        }

        log(path || 'src/public/', 'copied', 'to', 'dist/');

        if(paths && paths.clean) {
          clean.paths();
        }


    },
    file: (path) => {
        cp('-R', path, 'dist/');
        log(path, 'copied', 'to', 'dist/');
    },
    html: (path) => {
        ls('src/app/**/*.html').forEach(function(file) {
          cp(file, 'dist/'+file);
          log(file.replace(/^.*[\\\/]/, ''), 'copied', 'to',  'dist/'+file.substring(0, file.lastIndexOf("/")));
        });
    },
    lib: () => {

        mkdir('-p', __dirname + '/' + paths.dist);

        for( var i=0;  i < paths.dep.length; i++ ) {

            cp('-R', paths.src + '/' + paths.dep[i], paths.dist + '/' + paths.dep[i]);
            log(paths.dep[i], 'copied', 'to',  paths.dist + '/' + paths.dep[i]);

        }
    },
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
        log('src/*.ts', 'copied', 'to', 'tmp/*ts');

        // remove moduleId prior to ngc build. TODO: look for another method.
        ls('tmp/**/*.ts').forEach(function(file) {
          sed('-i', /^.*moduleId: module.id,.*$/, '', file);
        });

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

              log('ngc', 'started', 'compiling', 'ngfactory');

              let tsc = exec(scripts['build:ngc'], function(code, output, error) {
                  log('ngc', 'compiled', '/ngfactory');
                  log('Rollup', 'started', 'bundling', 'ngfactory');

                 let bundle = exec(scripts['bundle:src'], function(code, output, error) {
                     log('Rollup', 'bundled', 'bundle.es2015.js in', './dist');
                     log('Closure Compiler', 'is optimizing', 'bundle.js', 'for '+ colors.bold(colors.cyan(env)));

                     let closure = exec(scripts['transpile:closure'], function(code, output, error){
                          log('Closure Compiler', 'transpiled', './dist/bundle.es2015.js to', './dist/bundle.js');
                          if (canWatch === true) {
                            log(colors.green('Ready'), 'to', colors.green('serve'));
                            log(colors.green('Watcher'), 'listening for', colors.green('changes'));
                          } else {
                            log(colors.green('Build'), 'is', colors.green('ready'));
                          }
                          compile.clean();
                          isCompiling = false;
                          hasInit = true;
                     });
                 });
              });
       });

    },

    ts : (path) => {

        isCompiling = true;

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

            if (path) {
               log('typescript', 'started', 'transpiling', path);
            } else {
               log('typescript', 'started', 'transpiling', 'src/*ts');
            }

            let tsc = exec(scripts['transpile:src'], function(code, output, error) {
                if (path) {
                  log('typescript', 'transpiled', path+' to', 'dist/'+path.replace('.ts','.js'));
                  cp(path, 'dist/'+path);
                } else {
                  log('typescript', 'transpiled', 'src/*ts to', 'dist/src/*ts');
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

    let program = Linter.createProgram('./tsconfig.'+env+'.json', path ? path.substring(0, path.lastIndexOf('/')) : './src/');
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
        let outFile = path.indexOf('src/style') > -1 ? 'dist/style/style.css' : (env === 'dev') ? 'dist/'+srcPath+'/'+filename.replace('.scss','.css') : path.replace('.scss','.css').replace('src', 'tmp');
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

                if (watch === true) log('node-sass', 'compiled', 'component style at', outFile);

                let postcss = exec('postcss -c postcss.'+env+'.json -r '+outFile, function(code, output, error) {


                    if ( watch === true ) {
                      log('PostCSS', 'transformed', 'component style at', outFile);
                      if( env === 'prod') {
                        setTimeout(compile.src, 1000);
                      }
                    } else {
                        log('PostCSS', 'transformed', 'component style at', outFile);
                    }
                    if( !watch ) {

                      if( styleFiles.indexOf(path) === styleFiles.length - 1  ) {
                        log('node-sass and postcss', 'compiled', 'for', colors.bold(colors.cyan(env)));
                        if ( env === 'prod' ) {
                          setTimeout(compile.src, 2000);
                        }
                        if( env === 'dev' ) {
                          //exec('node server.js');

                          if (canWatch === true) {
                            log(colors.green('Ready'), 'to', colors.green('serve'));
                            log(colors.green('Watcher'), 'listening for', colors.green('changes'));
                          } else {
                            log(colors.green('Build'), 'is', colors.green('ready'));
                          }
                        }
                      }
                    }
                });
              }
            });

          }
        });

    },
    src:() =>{

        mkdir('dist/style');

        ls('src/**/*.scss').forEach(function(file, index) {
          if( file.replace(/^.*[\\\/]/, '')[0] !== '_' ) {
             styleFiles.push(file);
          }
        });

        ls('src/**/*.scss').forEach(function(file, index) {
          if( file.replace(/^.*[\\\/]/, '')[0] !== '_' ) {
            style.file(file);
          }
        });

        if(env === 'dev') {
          hasInit = true;
        }

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

  if (env === 'prod') {
    cp('-R', './src', './tmp');
    mkdir('./ngfactory');
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

};

/* Watcher */


let watcher = chokidar.watch('./src/**/*.*', {
  ignored: /[\/\\]\./,
  persistent: canWatch
}).on('change', path => {

      log('File', path, 'has been', 'changed');

      if ( path.indexOf('src/public') > -1 ) {

          if ( path.indexOf('src/index.html') ) {
            copy.public();
          } else {
            copy.file(path);
          }


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

          //tslint(path);

          if (env === 'dev') {
            compile.ts(path);
          }
          if (env === 'prod') {
            compile.src();
          }


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

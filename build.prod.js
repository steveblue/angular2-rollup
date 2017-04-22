"use strict";

require('shelljs/global');

const fs        = require('fs');
const utils     = require('./build.utils.js');
const chokidar  = require('chokidar');
const sass      = require('node-sass');

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const paths     = utils.paths;
const log       = utils.log;
const warn      = utils.warn;
const clean     = utils.clean;

const env       = 'prod';
let canWatch    = false;
let isCompiling = false;
let hasInit     = false;
let styleFiles  = [];
let hasCompletedFirstStylePass = false;

process.argv.forEach((arg)=>{
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});

/* Copy */

const copy = {
    public: (path) => {

        cp('-R', paths.src+'/public/.', paths.build+'/');

        exec(scripts['replace:html-prod'], function(code, output, error){
               log('index.html','formatted', 'for',  colors.bold(colors.cyan(env)));
        });

        log(path || paths.src+'/public/', 'copied', 'to', paths.build+'/');

        if(paths && paths.clean) {
          clean.paths(paths);
        }

    },
    file: (path) => {
        cp('-R', path, paths.build+'/');
        log(path, 'copied', 'to', paths.build+'/');
    },
    lib: () => {

        mkdir('-p', __dirname + '/' + paths.dep.dist);

        for( var i=0;  i < paths.dep.lib.length; i++ ) {

            cp('-R', paths.dep.src + '/' + paths.dep.lib[i], paths.dep.dist + '/' + paths.dep.lib[i]);
            log(paths.dep.lib[i], 'copied', 'to',  paths.dep.dist + '/' + paths.dep.lib[i]);

        }
    }
};


/* Compile */

const compile = {

    clean: (path) => {

      const outFile = path ? path : './'+paths.build+'/bundle.js';

      fs.readFile(outFile, 'utf8', function(err, contents) {
        if(!err) {
            contents = contents.replace(utils.multilineComment, '');
            contents = contents.replace(utils.singleLineComment, '');
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

        // remove moduleId prior to ngc build. TODO: look for another method.
        ls('tmp/**/*.ts').forEach(function(file) {
          sed('-i', /^.*moduleId: module.id,.*$/, '', file);
        });

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

              log('ngc', 'started', 'compiling', 'ngfactory');

              let tsc = exec(scripts['compile:'+env], function(code, output, error) {
                  log('ngc', 'compiled', '/ngfactory');
                  log('Rollup', 'started', 'bundling', 'ngfactory');

                 let bundle = exec(scripts['bundle:'+env], function(code, output, error) {
                     log('Rollup', 'bundled', 'bundle.es2015.js in', './build');
                     log('Closure Compiler', 'is optimizing', 'bundle.js', 'for '+ colors.bold(colors.cyan(env)));

                     let closure = exec(scripts['transpile:'+env], function(code, output, error){
                          log('Closure Compiler', 'transpiled', './'+paths.build+'/bundle.es2015.js to', './'+paths.build+'/bundle.js');
                          if (canWatch === true) {
                            log(colors.green('Ready'), 'to', colors.green('serve'));
                            log(colors.green('Watcher'), 'listening for', colors.green('changes'));
                          } else {
                            log(colors.green('Build'), 'is', colors.green('ready'));
                          }
                          //compile.clean();
                          isCompiling = false;
                          hasInit = true;
                     });
                 });
              });
       });

    }
}


/* Styling */

let style = {

    file: (path, watch) => {


        let srcPath = path.substring(0, path.lastIndexOf("/"));
        let filename = path.replace(/^.*[\\\/]/, '');
        let outFile = path.indexOf(paths.src+'/style') > -1 ? paths.build+'/style/style.css' : path.replace('.scss','.css').replace(paths.src, 'tmp');
        sass.render({
          file: path,
          outFile: outFile,
          includePaths: [ paths.src+'/style/' ],
          outputStyle: 'expanded',
          sourceComments: false
        }, function(error, result) {
          if (error) {
            warn(error.status);
            warn(error.column);
            warn(error.message);
            warn(error.line);
          } else {

            fs.writeFile(outFile, result.css, function(err){
              if(!err){

                let postcss = exec('postcss -c postcss.'+env+'.json -r '+outFile, function(code, output, error) {

                    if ( (styleFiles.indexOf(path) === styleFiles.length - 1) && hasCompletedFirstStylePass === false) {
                      log('libsass and postcss', 'compiled', 'for', colors.bold(colors.cyan(env)));
                      setTimeout(compile.src,2000);
                    }
                    if (hasCompletedFirstStylePass === true) {
                      compile.src();
                    }

                });
              }
            });

          }
        });

    },
    src:() =>{

        mkdir(paths.build+'/style');

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


/* Init */

let init = function() {

    rm('-rf', paths.rootDir+'/.tmp/');

    rm('-rf', './ngfactory');
    mkdir('./ngfactory');

    rm('-rf', './'+paths.build);
    mkdir('./'+paths.build);
    mkdir('./'+paths.build+'/lib');

    clean.tmp();
    copy.lib();
    copy.public();
    style.src();

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
          cp(path, path.replace(paths.src, './tmp'));
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

         hasCompletedFirstStylePass = true;
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

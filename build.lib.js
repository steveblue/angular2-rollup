"use strict";

require('shelljs/global');

const fs          = require('fs');
const utils       = require('./build.utils.js');
const chokidar    = require('chokidar');
const sass        = require('node-sass');
const minifyHtml  = require('html-minifier').minify;

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const paths     = utils.paths;
const log       = utils.log;
const warn      = utils.warn;
const clean     = utils.clean;
const angular   = utils.angular;

const env = 'prod';

let canWatch = false;
let isCompiling = false;
let hasInit = false;
let styleFiles = [];
let hasCompletedFirstStylePass = false;

process.argv.forEach((arg)=>{
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});


/* Copy */

const copy = {
    file: (path) => {
        cp('-R', path, paths.dist+'/');
        log(path, 'copied', 'to', paths.dist+'/');
    }
};


/* Compile */

const compile = {

    clean: (path) => {

      const outFile = path ? path : './'+paths.dist+'/bundle.js';
      let inline = '';

      fs.readFile(outFile, 'utf8', function(err, contents) {
        if(!err) {
            contents = contents.replace(utils.multilineComment, '');
            contents = contents.replace(utils.singleLineComment, '');

            if ( contents.search(utils.componentRegex) > -1 ) {
              inline = angular({
                preprocessors: {
                  template: template => minifyHtml(template, {
                      caseSensitive: true,
                      collapseWhitespace: true,
                      removeComments: true,
                      quoteCharacter: '"'
                  })
                }
              }, contents, path.substring(0, path.lastIndexOf('/')));

              log('Inline', 'template and styles', 'for', path);

              if (inline) {
                contents = inline.code;
              }

            }

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

          compile.clean(file);
          sed('-i', /^.*moduleId: module.id,.*$/, '', file);

        });

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

              log('ngc', 'started', 'compiling', 'ngfactory');

              let tsc = exec(scripts['compile:lib'], function(code, output, error) {

                  log('ngc', 'compiled', '/ngfactory');
                  cp('-R', paths.lib+'/.', 'ngfactory/');
                  log('Rollup', 'started', 'bundling', 'ngfactory');

                 let bundle = exec(scripts['rollup:lib'], function(code, output, error) {

                     log('Rollup', 'bundled', paths.libFilename+'.js in', './'+paths.dist);
                     compile.umdLib();

                 });


              });
       });

    },

    umdLib : () => {

         let tsc = exec(scripts['compile:umd'], function(code, output, error) {
                  log('ngc', 'compiled', '/ngfactory');
                  log('Rollup', 'started', 'bundling', 'ngfactory');

                 let bundle = exec(scripts['rollup:umd'], function(code, output, error) {

                    log('Rollup', 'bundled', paths.libFilename+'.umd.js in', './'+paths.dist);
                    compile.es5Lib();

                 });
              });
    },

    es5Lib : () => {

         let tsc = exec(scripts['compile:es5'], function(code, output, error) {
                  log('ngc', 'compiled', '/ngfactory');
                  log('Rollup', 'started', 'bundling', 'ngfactory');

                 let bundle = exec(scripts['rollup:es5'], function(code, output, error) {

                    log('Rollup', 'bundled', paths.libFilename+'.es5.js in', './'+paths.dist);

                    exec(scripts['copy:lib'], function() {

                      log('Copied', 'd.ts, metadata.json', ' to ', './'+paths.dist);

                      rm(paths.dist + '/index.ts');

                      find('./'+paths.dist).filter(function(file) {

                        if ( file.match(/component.ts$/) || file.match(/module.ts$/) || file.match(/.html$/) || file.match(/.scss$/)) {
                          rm(file);
                        }

                      });

                    });

                    exec(scripts['copy:package'], function() {

                      log('Copied', 'package.json', ' to ', './'+paths.dist);

                    });

                 });
              });
    }
};


/* Styling */

let style = {

    file: (path, watch) => {


        let srcPath = path.substring(0, path.lastIndexOf("/"));
        let filename = path.replace(/^.*[\\\/]/, '');
        let outFile = path.indexOf(paths.src+'/style') > -1 ? paths.dist+'/style/style.css' : path.replace('.scss','.css').replace(paths.src, 'tmp').replace('lib/', '');

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

                let postcss = exec('postcss -c postcss.'+env+'.json -r '+outFile, function(code, output, error) {
                   if( !watch ) {

                      if( hasCompletedFirstStylePass === true || styleFiles.indexOf(path) === styleFiles.length - 1) {

                        log('libsass and postcss', 'compiled', 'for', colors.bold(colors.cyan(env)));
                        hasCompletedFirstStylePass === true;
                        compile.src();

                      }

                    }
                });

            });

          }
        });

    },
    src:() =>{

        mkdir(paths.dist+'/style');

        style.file(paths.src+'/style/style.scss');

        ls('./'+paths.lib+'/**/*.scss').forEach(function(file, index) {

          if( file.replace(/^.*[\\\/]/, '')[0] !== '_' ) {
             styleFiles.push(file);
          }

        });

        ls('./'+paths.lib+'/**/*.scss').forEach(function(file, index) {

          if( file.replace(/^.*[\\\/]/, '')[0] !== '_' ) {
            style.file(file);
          }

        });

    }
};

/* Init */

let init = function() {
    rm('-rf', './tmp');
    rm('-rf', './ngfactory');
    mkdir('./ngfactory');
    rm('-rf', './'+paths.dist);
    mkdir('./'+paths.dist);
    mkdir('./'+paths.dist+'/bundles');
    cp('-R', paths.lib+'/.', 'tmp/');
    log(paths.lib+'/*.ts', 'copied', 'to', 'tmp/*ts');
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

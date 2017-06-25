"use strict";

require('shelljs/global');

const env         = 'prod';

const fs          = require('fs');
const utils       = require('./build.utils.js');
const chokidar    = require('chokidar');
const sass        = require('node-sass');
const postcss     = require('./postcss.'+env+'.js');
const minifyHtml  = require('html-minifier').minify;

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const paths     = utils.paths;
const log       = utils.log;
const warn      = utils.warn;
const clean     = utils.clean;
const angular   = utils.angular;


let canWatch = false;
let isCompiling = false;
let hasInit = false;
let styleFiles = [];
let hasCompletedFirstStylePass = false;
let postcssConfig = ' -u';


/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg)=>{
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});

/* Process PostCSS CLI plugins for the --use argument */

for (let cssProp in postcss.plugins) {
  postcssConfig += ' '+cssProp;
}


/*

  Copy Tasks

- file: Copies a file to /dist

*/

const copy = {
    file: (path) => {
        cp('-R', path, paths.dist+'/');
        log(path, 'copied', 'to', paths.dist+'/');
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

                     log('Rollup', 'bundled', paths.libFilename+'.umd.js in', './'+paths.dist+'/bundles');

                     log('Babel', 'is transpiling', paths.libFilename+'.umd.js');

                     let transpile = exec(scripts['transpile:umd'], function(code, output, error){
                          log('Babel', 'transpiled', './'+paths.dist+'/bundles/'+paths.libFilename+' to', './'+paths.dist+'/bundles/'+paths.libFilename+'.umd.js');
                          compile.es5Lib();
                     });



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

                        if ( file.match(/component.ts$/) || file.match(/directive.ts$/) || file.match(/module.ts$/) || file.match(/.html$/) || file.match(/.scss$/)) {
                          rm(file);
                        }

                      });

                    });

                    log('Babel', 'is transpiling', paths.libFilename+'.es5.js');

                     let transpile = exec(scripts['transpile:lib'], function(code, output, error){
                          log('Babel', 'transpiled', './'+paths.dist+'/'+paths.libFilename+' to', './'+paths.dist+'/'+paths.libFilename+'.es5.js');
                     });

                    exec(scripts['copy:package'], function() {

                      log('Copied', 'package.json', ' to ', './'+paths.dist);

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


let style = {

    file: (path, watch) => {


        let srcPath = path.substring(0, path.lastIndexOf("/"));
        let filename = path.replace(/^.*[\\\/]/, '');
        let outFile = path.indexOf(paths.src+'/style') > -1 ? paths.dist+'/style/style.css' : path.replace('.scss','.css').replace(paths.src, 'tmp').replace(paths.lib.replace('src/', ''), '');

        sass.render({
          file: path.indexOf(paths.src+'/style') > -1 ? 'src/style/style.scss' : path,
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

                let postcss = exec('postcss -c postcss.'+env+'.js -r '+outFile, function(code, output, error) {
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

/*

  Init Tasks

  A sequence of commands needed to clean and start the lib build

*/


let init = function() {

    rm('-rf', paths.rootDir+'/.tmp/');
    rm('-rf', './ngfactory');
    rm('-rf', './'+paths.dist);

    mkdir('./ngfactory');
    mkdir('./'+paths.dist);
    mkdir('./'+paths.dist+'/bundles');

    clean.lib();
    style.src();

};

/*

  Watcher

  Chokidar is used to watch files, run the above methods.

*/


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
          clean.lib();
          compile.src();
        }

      }

      else if ( path.indexOf('.ts') > -1 && hasInit === true) {

        log('File', path, 'triggered', 'transpile');

        utils.tslint(path);

        if (!isCompiling) {
              clean.lib();
              compile.src();
        }

      }

      else if ( path.indexOf('.scss') > -1 ) {

        log('File', path, 'triggered', 'compile');
        clean.lib();
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

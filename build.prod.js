"use strict";

require('shelljs/global');

const env       = 'prod';

const fs        = require('fs');
const utils     = require('./build.utils.js');
const chokidar  = require('chokidar');
const sass      = require('node-sass');
const postcss   = require('./postcss.'+env+'.js');

/* References to shared tools are found in build.utils.js */

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const paths     = utils.paths;
const log       = utils.log;
const warn      = utils.warn;
const alert     = utils.alert;
const clean     = utils.clean;


let canWatch    = false;
let isCompiling = false;
let hasInit     = false;
let styleFiles  = [];
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

- public: Copies the contents of the src/public folder
- file: Copies a file to /build
- lib: Copies files and folders from /node_modules to /build/lib

*/


const copy = {
    public: (path) => {

        cp('-R', paths.src+'/public/.', paths.build+'/');

        exec(paths.cliRoot +'/node_modules/.bin/htmlprocessor ./build/index.html -o ./build/index.html -e prod', function(code, output, error){
               log('index.html','formatted', 'for',  colors.bold(colors.cyan(env)));
        });

        log(path || paths.src+'/public/', 'copied to', paths.build+'/');

        if(paths && paths.clean) {
          clean.paths(paths);
        }

    },
    file: (path) => {
        cp('-R', path, paths.build+'/');
        log(path, 'copied to', paths.build+'/');
    },
    lib: () => {

        mkdir('-p', __dirname + '/' + paths.dep.dist);

        for( var i=0;  i < paths.dep.prodLib.length; i++ ) {

            if (paths.dep.prodLib[i].split('/').pop().split('.').length > 1) { // file
              let path = paths.dep.dist + '/' + paths.dep.prodLib[i];
              if (!fs.existsSync(path.substring(0, path.lastIndexOf('/')))) {
                mkdir('-p', path.substring(0, path.lastIndexOf('/')));
              } // catch folders
              cp('-R', paths.dep.src + '/' + paths.dep.prodLib[i], paths.dep.dist + '/' + paths.dep.prodLib[i]);
            } else { // folder
              cp('-R', paths.dep.src + '/' + paths.dep.prodLib[i], paths.dep.dist + '/' + paths.dep.prodLib[i]);
            }

            log(paths.dep.prodLib[i], 'copied to',  paths.dep.dist + '/' + paths.dep.prodLib[i]);

        }
    }
};


/*

  Compile Tasks

- clean: Removes source code comments
- ts: Compiles AOT for production using ngc, Rollup, and ClosureCompiler

*/


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

              alert ('ngc', 'started compiling', 'ngfactory');

              let tsc = exec(paths.projectRoot+'/node_modules/.bin/ngc -p ./tsconfig.prod.json', function(code, output, error) {
                  alert('ngc', 'compiled', '/ngfactory');
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(paths.projectRoot+'/node_modules/.bin/rollup -c rollup.config.js', function(code, output, error) {
                     alert('Rollup', 'bundled bundle.es2015.js in', './build');
                     alert('Closure Compiler', 'started optimizing', 'bundle.js');

                     let closure = exec(require(utils.paths.projectRoot + '/package.json').scripts['transpile:'+env], function(code, output, error){
                          alert('Closure Compiler', 'transpiled', './'+paths.build+'/bundle.es2015.js to', './'+paths.build+'/bundle.js');
                          if (canWatch === true) {
                            alert(colors.green('Ready to serve'));
                            alert(colors.green('Watcher listening for changes'));
                          } else {
                            alert(colors.green('Build is ready'));
                          }
                          //compile.clean();
                          isCompiling = false;

                          if (utils.paths.buildHooks && utils.paths.buildHooks[env] && utils.paths.buildHooks[env].post && hasInit === false) {
                            utils.paths.buildHooks[env].post();
                          }

                          hasInit = true;
                     });
                 });
              });
       });

    }
}


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
        let globalCSSFilename = paths.globalCSSFilename !== undefined ? paths.globalCSSFilename : 'style.css';
        let filename = path.replace(/^.*[\\\/]/, '');
        let outFile = path.indexOf(paths.src+'/style') > -1 ? paths.build+'/style/'+globalCSSFilename : path.replace('.scss','.css').replace(paths.src, 'tmp');
        sass.render({
          file: path.indexOf(paths.src+'/style') > -1 ? 'src/style/style.scss' : path,
          outFile: outFile,
          includePaths: [ paths.src+'/style/' ],
          outputStyle: 'expanded',
          sourceComments: false
        }, function(error, result) {
          if (error) {
            warn(error.message, 'LINE: '+error.line);
          } else {

            fs.writeFile(outFile, result.css, function(err){
              if(!err){

                let postcss = exec(paths.projectRoot+'/node_modules/.bin/postcss ./'+outFile+' -c '+paths.projectRoot+'/postcss.'+env+'.js -r'+postcssConfig, function(code, output, error) {

                    if ( (styleFiles.indexOf(path) === styleFiles.length - 1) && hasCompletedFirstStylePass === false) {
                      alert('libsass and postcss', 'compiled');
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



/*

  Init Tasks

  A sequence of commands needed to clean and start the prod build

*/


let init = function() {

    rm('-rf', paths.projectRoot+'/.tmp/');
    rm('-rf', './ngfactory');
    rm('-rf', './'+paths.build);

    clean.tmp();

    mkdir('./ngfactory');
    mkdir('./'+paths.build);
    mkdir('./'+paths.build+'/lib');

    if (utils.paths.buildHooks && utils.paths.buildHooks[env] && utils.paths.buildHooks[env].pre) {
      utils.paths.buildHooks[env].pre();
    }

    copy.lib();
    copy.public();
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


      if ( path.indexOf(paths.src+'/public') > -1 ) {

          if ( path.indexOf(paths.src+'/index.html') ) {
            copy.public();
          } else {
            copy.file(path);
          }


      }

      else if ( path.indexOf('.html') > -1 && path.indexOf('src') > -1) {

        if(!isCompiling) {
          alert('CHANGE DETECTED', path, 'triggered', 'compile');
          cp(path, path.replace(paths.src, './tmp'));
          compile.src();
        }

      }

      else if ( path.indexOf('.ts') > -1 && hasInit === true) {

        alert('CHANGE DETECTED', path, 'triggered', 'compile');

        utils.tslint(path);

        if (!isCompiling) {
            compile.src();
        }


      }
      else if ( path.indexOf('.scss') > -1 ) {

        alert('CHANGE DETECTED', path, 'triggered', 'compile');

         hasCompletedFirstStylePass = true;
         style.file(path, true);

      }

   })
  .on('unlink', path => log('File', path, 'has been', 'removed'));

watcher
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    alert('INITIAL SCAN COMPLETE', 'building for', env);

    init();

  });

"use strict";

require('shelljs/global');

const env       = 'dev';

const fs        = require('fs');
const chokidar  = require('chokidar');
const sass      = require('node-sass');
const utils     = require('./build.utils.js');
const postcss   = require('./postcss.'+env+'.js');

/* References to shared tools are found in build.utils.js */

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const paths     = utils.paths;
const log       = utils.log;
const warn      = utils.warn;
const clean     = utils.clean;

let canWatch = true;
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

- public: Copies the contents of the src/public folder
- file: Copies a file to /build
- html: Copies all .html files to /build
- lib: Copies files and folders from /node_modules to /build/lib

*/

const copy = {
    public: (path) => {

        cp('-R', paths.src+'/public/.', 'build/');

        exec(paths.rootDir+'/node_modules/.bin/htmlprocessor ./build/index.html -o ./build/index.html -e dev', function(code, output, error){
              log('index.html', 'formatted',  'for',  colors.bold(colors.cyan(env)));
        });

        log(path || paths.src+'/public/', 'copied', 'to', 'build/');

        if(paths && paths.clean) {
          clean.paths(paths);
        }

    },
    file: (path) => {
        cp('-R', path, 'build/');
        log(path, 'copied', 'to', 'build/');
    },
    html: (path) => {
        ls(paths.src+'/app/**/*.html').forEach(function(file) {
          cp(file, 'build/'+file);
          log(file.replace(/^.*[\\\/]/, ''), 'copied', 'to',  'build/'+file.substring(0, file.lastIndexOf("/")));
        });
    },
    lib: () => {

        mkdir('-p', __dirname + '/' + paths.dep.dist);

        for( var i=0;  i < paths.dep.lib.length; i++ ) {

            if (paths.dep.lib[i].split('/').pop().split('.').length > 1) { // file
              let path = paths.dep.dist + '/' + paths.dep.lib[i];
              if (!fs.existsSync(path.substring(0, path.lastIndexOf('/')))) {
                mkdir('-p', path.substring(0, path.lastIndexOf('/')));
              } // catch folders
              cp('-R', paths.dep.src + '/' + paths.dep.lib[i], paths.dep.dist + '/' + paths.dep.lib[i]);
            } else { // folder
              cp('-R', paths.dep.src + '/' + paths.dep.lib[i], paths.dep.dist + '/' + paths.dep.lib[i]);
            }

            log(paths.dep.lib[i], 'copied', 'to',  paths.dep.dist + '/' + paths.dep.lib[i]);

        }
    }
};

/*

  Compile Tasks

- ts: Compiles Typescript files from /src into /build

*/

const compile = {

    ts : (path) => {

        isCompiling = true;

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

            if (path) {
               log('typescript', 'started', 'transpiling', path);
            } else {
               log('typescript', 'started', 'transpiling', paths.src+'/*ts');
            }

            // let tsConfigPath = fs.existsSync(paths.rootDir + '/tsconfig.dev.json') ? paths.rootDir : paths.cliRoot;

            // let tsc = exec(paths.rootDir + '/node_modules/.bin/tsc -p ' + tsConfigPath + '/tsconfig.dev.json', function (code, output, error) {

            //let tsConfigPath = fs.existsSync(paths.rootDir + '/conf/tsconfig.dev.json') ? paths.rootDir : paths.cliRoot;

            let tsc = exec(paths.rootDir + '/node_modules/.bin/tsc -p ./tsconfig.dev.json', function(code, output, error) {

                if (path) {
                  log('typescript', 'transpiled', path+' to', 'build/'+path.replace('.ts','.js'));
                  cp(path, 'build/'+path);
                } else {
                  log('typescript', 'transpiled', paths.src+'/*ts to', 'build/'+paths.src+'/*ts');
                }

                if(hasInit === false) {
                  copy.html();
                  style.src();
                }

                isCompiling = false;
                

            });
       });

    }
};

/*

  Style Tasks

  - file: Styles a single file.
         - If the file is in the /src/styles folder it will compile /src/styles/style.scss
         - If the file is elsewhere, like part of a Component, it will compile into the
          appropriate folder in the /build directory
  - src: Compiles the global styles

  SASS render method is called and fs writes the files to appropriate folder
  PostCSS processes the file in place, using the --replace argument


*/

let style = {

    file: (path, watch) => {

        let srcPath = path.substring(0, path.lastIndexOf("/"));
        let filename = path.replace(/^.*[\\\/]/, '');
        let outFile = path.indexOf(paths.src+'/style') > -1 ? 'build/style/style.css' : 'build/'+srcPath+'/'+filename.replace('.scss','.css');
        sass.render({
          file: path.indexOf(paths.src+'/style') > -1 ? 'src/style/style.scss' : path,
          outFile: outFile,
          includePaths: [ paths.src+'/style/' ],
          outputStyle: 'expanded',
          sourceComments: true
        }, function(error, result) {
          if (error) {
            warn(error.message, 'LINE: '+error.line);
          } else {

            fs.writeFile(outFile, result.css, function(err){
              if(!err){

                if (watch === true) log('node-sass', 'compiled', 'component style at', outFile);

                let postcss = exec(paths.rootDir+'/node_modules/.bin/postcss ./'+outFile+' -c ./postcss.'+env+'.js -r'+postcssConfig, function() {

                    if ( (styleFiles.indexOf(path) === styleFiles.length - 1) && hasCompletedFirstStylePass === false) {
                      log('libsass and postcss', 'compiled', 'for', colors.bold(colors.cyan(env)));
                      if (canWatch === true) {
                            log(colors.green('Ready'), 'to', colors.green('serve'));
                            log(colors.green('Watcher'), 'listening for', colors.green('changes'));
                      } else {
                        log(colors.green('Ready'), 'to', colors.green('serve'));
                      }
                    }
                    if (hasCompletedFirstStylePass === true) {
                      compile.ts();
                    }

                });
              }
            });

          }
        });

    },
    src:() =>{

        mkdir('build/style');

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

        hasInit = true;
        
        if (utils.paths.buildHooks && utils.paths.buildHooks[env] && utils.paths.buildHooks[env].post) {
          utils.paths.buildHooks[env].post();
        }

    }
};

/*

  Init Tasks

  A sequence of commands needed to clean and start the dev build

*/

let init = function() {

    rm('-rf', paths.rootDir+'/.tmp/');
    rm('-rf', './'+paths.build);
    rm('-rf', './ngfactory');

    mkdir('./'+paths.build);
    mkdir('./'+paths.build+'/lib');

    if (utils.paths.buildHooks && utils.paths.buildHooks[env] && utils.paths.buildHooks[env].pre) {
      utils.paths.buildHooks[env].pre();
    }

    copy.lib();
    copy.public();
    compile.ts();

};

/*

  Watcher

  Chokidar is used to watch files, run the above methods

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

      else if ( path.indexOf('.html') > -1 && path.indexOf(paths.src) > -1) {

       copy.html(path);

      }

      else if ( path.indexOf('.ts') > -1 && hasInit === true) {

       log('File', path, 'triggered', 'transpile');

        utils.tslint(path);

        if (!isCompiling) {

          compile.ts(path);

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

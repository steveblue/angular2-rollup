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

const env = 'dev';

let canWatch = true;
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
    public: (path) => {

        cp('-R', paths.src+'/public/.', 'build/');

        exec(scripts['replace:html-dev'], function(code, output, error){
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
                mkdir(path.substring(0, path.lastIndexOf('/')));
              } // catch folders 
              cp('-R', paths.dep.src + '/' + paths.dep.lib[i], paths.dep.dist + '/' + paths.dep.lib[i]);
            } else { // folder
              cp('-R', paths.dep.src + '/' + paths.dep.lib[i], paths.dep.dist + '/' + paths.dep.lib[i]);
            }

            log(paths.dep.lib[i], 'copied', 'to',  paths.dep.dist + '/' + paths.dep.lib[i]);
            
       }
    }
};

/* Compile */

const compile = {

    clean: (path) => {

      const outFile = path ? path : './build/bundle.js';

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

/* Styling */

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

                let postcss = exec('postcss -c postcss.'+env+'.json -r '+outFile, function(code, output, error) {

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

    }
};

/* Init */

let init = function() {

    rm('-rf', paths.rootDir+'/.tmp/');
    rm('-rf', './'+paths.build);
    rm('-rf', './ngfactory');
    mkdir('./'+paths.build);
    mkdir('./'+paths.build+'/lib');
    copy.lib();
    copy.public();
    compile.ts();

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

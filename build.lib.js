"use strict";

require('shelljs/global');

const env         = 'prod';
const path        = require('path');
const fs          = require('fs');
const Rsync       = require('rsync');
const utils       = require('./build.utils.js');
const chokidar    = require('chokidar');
const sass        = require('node-sass');
const postcss     = require('./postcss.'+env+'.js');
const minifyHtml  = require('html-minifier').minify;

if (utils.paths.preLibraryBuild) {
  const preBuild = utils.paths.preLibraryBuild;
}

if (utils.paths.postLibraryBuild) {
  const postBuild = utils.paths.postLibraryBuild;
}

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const paths     = utils.paths;
const log       = utils.log;
const alert     = utils.alert;
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
    file: (filePath) => {
        cp('-R', path.normalize(filePath), path.normalize(paths.dist+'/'));
        log(filePath, 'copied to', path.normalize(paths.dist+'/'));
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

    clean: (filePath) => {

      const outFile = filePath ? filePath : path.normalize('./'+paths.dist+'/bundle.js');
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
              }, contents, filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf('/')));

              alert('ngr', 'inline', 'template and styles for', filePath);

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
        ls(path.normalize('./tmp/**/*.ts')).forEach(function(file) {

          compile.clean(file);
          sed('-i', /^.*moduleId: module.id,.*$/, '', file);

        });

        let clean = exec(scripts['clean:ngfactory'], function(code, output, error) {

              alert('ngc', 'started', 'compiling', 'ngfactory');

              let tsc = exec(path.normalize(paths.projectRoot+'/node_modules/.bin/ngc')+' -p '+path.normalize('./tsconfig.lib.json'), function(code, output, error) {

                  alert('ngc', 'compiled', '/ngfactory');
                  cp('-R', path.normalize(paths.lib+'/')+'.', path.normalize('ngfactory/'));
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(path.normalize(paths.projectRoot+'/node_modules/.bin/rollup')+' -c rollup.config.lib.js', function(code, output, error) {

                     alert('Rollup', 'bundled', paths.libFilename+'.js in', './'+paths.dist);
                     compile.umdLib();

                 });


              });
       });

    },

    umdLib : () => {

         let tsc = exec(path.normalize(paths.projectRoot+'/node_modules/.bin/ngc')+' -p '+path.normalize('./tsconfig.lib.es5.json'), function(code, output, error) {
                  alert('ngc', 'compiled', '/ngfactory');
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(path.normalize(paths.projectRoot+'/node_modules/.bin/rollup')+' -c rollup.config.lib-umd.js', function(code, output, error) {

                     alert('Rollup', 'bundled', paths.libFilename+'.umd.js in', './'+paths.dist+'/bundles');

                     alert('Babel', 'started transpiling', paths.libFilename+'.umd.js');

                     let transpile = exec(path.normalize(paths.projectRoot + '/node_modules/.bin/babel')+' --plugins=transform-es2015-modules-commonjs ' + path.normalize('./dist/bundles/') + paths.libFilename + '.umd.js --out-file '+path.normalize('./dist/bundles/') + paths.libFilename +'.umd.js', function(code, output, error){
                          alert('Babel', 'transpiled', './'+paths.dist+'/bundles/'+paths.libFilename+' to', './'+paths.dist+'/bundles/'+paths.libFilename+'.umd.js');
                          compile.es5Lib();
                     });



                 });
              });
    },


    es5Lib : () => {



         let tsc = exec(path.normalize(paths.projectRoot+'/node_modules/.bin/ngc')+' -p '+path.normalize('./tsconfig.lib.es5.json'), function(code, output, error) {

          log('ngc', 'compiled', '/ngfactory');
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(path.normalize(paths.projectRoot+'/node_modules/.bin/rollup')+' -c rollup.config.lib-es5.js', function(code, output, error) {

                    alert('Rollup', 'bundled', paths.libFilename+'.es5.js in', './'+paths.dist);

         
                    find(path.normalize('./ngfactory/'))
                              .filter(function (file) { return file.match(/\.d.ts$/); })
                              .forEach((filePath)=>{
                                let dir = path.normalize(filePath.substring(0, filePath.lastIndexOf("/")).replace('ngfactory', 'dist'));
                                let fileName = filePath.replace(/^.*[\\\/]/, '');
                                if (!fs.existsSync(dir)) {
                                  mkdir('-p', dir);
                                }
                                cp(filePath, path.join(dir, fileName));
                              });

                      log('d.ts, metadata.json', 'copied to', './'+paths.dist);

                      cp(path.normalize(path.join('./ngfactory', paths.libFilename + '.metadata.json')), path.normalize(paths.dist));

                      //rm(path.normalize(paths.dist + '/index.ts'));

                      find(path.normalize('./'+paths.dist)).filter(function(file) {

                        if (utils.paths.buildHooks && utils.paths.buildHooks.lib && utils.paths.buildHooks.lib.clean) {
                          utils.paths.buildHooks.lib.clean(file);
                        } else {
                          if (file.match(/component.ts$/) || file.match(/directive.ts$/) || file.match(/injectable.ts$/) || file.match(/module.ts$/) || file.match(/.html$/) || file.match(/.scss$/)) {
                            rm(file);
                          }
                        }

                      });

                    alert('Babel', 'started transpiling', paths.libFilename+'.es5.js');

                    let transpile = exec(path.normalize(paths.projectRoot + '/node_modules/.bin/babel')+' --presets=es2015-rollup '+ path.normalize('./dist/') + paths.libFilename + '.es5.js --out-file '+ path.normalize('./dist/') + paths.libFilename +'.es5.js', function(code, output, error){
                          alert('Babel', 'transpiled', './'+paths.dist+'/'+paths.libFilename+' to', './'+paths.dist+'/'+paths.libFilename+'.es5.js');
                     });

                    exec( require(utils.paths.projectRoot + '/package.json').scripts['copy:package'], function() {

                      log('package.json', 'copied to', './'+paths.dist);

                      if (utils.paths.buildHooks && utils.paths.buildHooks.lib && utils.paths.buildHooks.lib.post) {
                        utils.paths.buildHooks.lib.post();
                      }

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
  
    file: (filePath, watch) => {
      
          let srcPath = filePath.substring(0, filePath.replace(/\\/g,"/").lastIndexOf("/"));
          let globalCSSFilename = paths.globalCSSFilename !== undefined ? paths.globalCSSFilename : 'style.css';
          let filename = filePath.replace(/^.*[\\\/]/, '');
          let outFile = filePath.indexOf(paths.src+'/style') > -1 ? paths.dist+'/style/'+globalCSSFilename : filePath.replace('.scss','.css').replace(paths.src, 'tmp');
          sass.render({
            file: filePath.indexOf(path.normalize(paths.src+'/style')) > -1 ? path.normalize(paths.src+'/style/style.scss') : filePath,
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
  
                  let postcss = exec(path.normalize(path.join(paths.projectRoot , 'node_modules/.bin/postcss')) + ' ' + outFile + ' -c ' + path.normalize(path.join(paths.projectRoot , 'postcss.' + env + '.js'))+' -r ' + postcssConfig, function (code, output, error) {
  
                      if ( (styleFiles.indexOf(filePath) === styleFiles.length - 1) && hasCompletedFirstStylePass === false) {
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
      src: () => {
        
        mkdir(path.join(paths.dist , 'style'));
    
        ls(path.normalize(paths.src + '/**/*.scss')).forEach(function (file, index) {
          if (file.replace(/^.*[\\\/]/, '')[0] !== '_') {
            styleFiles.push(file);
          }
        });
    
        ls(path.normalize(paths.src + '/**/*.scss')).forEach(function (file, index) {
          if (file.replace(/^.*[\\\/]/, '')[0] !== '_') {
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

    rm('-rf', path.normalize( paths.projectRoot+'/.tmp/'));
    rm('-rf',  path.normalize('./ngfactory'));
    rm('-rf',  path.normalize('./'+paths.dist));

    mkdir( path.normalize('./ngfactory'));
    mkdir( path.normalize('./'+paths.dist));
    mkdir( path.normalize('./'+paths.dist+'/bundles'));

    if (utils.paths.buildHooks && utils.paths.buildHooks.lib &&  utils.paths.buildHooks.lib.pre) {
      utils.paths.buildHooks.lib.pre();
    }

    clean.lib();
    style.src();

};

/*

  Watcher

  Chokidar is used to watch files, run the above methods.

*/


let watcher = chokidar.watch(path.normalize('./' + paths.src + '/**/*.*'), {
  ignored: /[\/\\]\./,
  persistent: canWatch
}).on('change', filePath => {

      if (filePath.indexOf(path.join(paths.src , 'public')) > -1) {
    
        if (filePath.indexOf(path.join(paths.src , 'index.html'))) {
          copy.public();
        } else {
          copy.file(filePath);
        }
    
      }

      else if ( filePath.indexOf('.html') > -1 && filePath.indexOf('src') > -1) {

        alert('CHANGE DETECTED', filePath, 'triggered', 'compile');

        if(!isCompiling) {
          clean.lib();
          compile.src();
        }

      }

      else if ( filePath.indexOf('.ts') > -1 && hasInit === true) {

        alert('CHANGE DETECTED', filePath, 'triggered', 'compile');

        utils.tslint(filePath);

        if (!isCompiling) {
              clean.lib();
              compile.src();
        }

      }

      else if ( filePath.indexOf('.scss') > -1 ) {

        alert('CHANGE DETECTED', filePath, 'triggered', 'sass and postcss');
        clean.lib();
        style.file(filePath, true);

      }

   })
  .on('unlink', filePath => log('File', filePath, 'has been', 'removed'));

watcher
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    alert('INITIAL SCAN COMPLETE', 'building for', 'lib');

    init();
});

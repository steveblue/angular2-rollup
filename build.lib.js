"use strict";

require('shelljs/global');

const env         = 'prod';
const path        = require('path');
const fs          = require('fs');
const utils       = require('./build.utils.js');
const chokidar    = require('chokidar');
const sass        = require('node-sass');
const postcss     = require('./postcss.'+env+'.js');
const minifyHtml  = require('html-minifier').minify;

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const config    = utils.config;
const log       = utils.log;
const alert     = utils.alert;
const warn      = utils.warn;
const clean     = utils.clean;
const angular   = utils.angular;

if (config.preLibraryBuild) {
  const preBuild = config.preLibraryBuild;
}

if (config.postLibraryBuild) {
  const postBuild = config.postLibraryBuild;
}

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
        cp('-R', path.normalize(filePath), path.normalize(config.dist+'/'));
        log(filePath, 'copied to', path.normalize(config.dist+'/'));
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

      const outFile = filePath ? filePath : path.normalize('./'+config.dist+'/bundle.js');
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

              alert('ngc', 'started compiling', 'ngfactory');

              let tsc = exec(path.normalize(config.projectRoot+'/node_modules/.bin/ngc')+
                             ' -p '+path.normalize('./tsconfig.lib.json'), function(code, output, error) {

                  alert('ngc', 'compiled', 'ngfactory');
                  cp('-R', path.normalize(config.lib+'/')+'.', path.normalize('ngfactory/'));
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(path.normalize(config.projectRoot+'/node_modules/.bin/rollup')+' -c rollup.config.lib.js', function(code, output, error) {

                     alert('Rollup', 'bundled', config.libFilename+'.js in', './'+config.dist);
                     compile.umdLib();

                 });


              });
       });

    },

    umdLib : () => {

         let tsc = exec(path.normalize(config.projectRoot+'/node_modules/.bin/ngc')+
                        ' -p '+path.normalize('./tsconfig.lib.es5.json'), function(code, output, error) {
                  alert('ngc', 'compiled', 'ngfactory');
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(path.normalize(config.projectRoot+'/node_modules/.bin/rollup')+
                                   ' -c rollup.config.lib-umd.js', function(code, output, error) {

                     alert('Rollup', 'bundled', config.libFilename+'.umd.js in', './'+config.dist+'/bundles');

                     alert('Babel', 'started transpiling', config.libFilename+'.umd.js');

                     let transpile = exec(path.normalize(config.projectRoot + '/node_modules/.bin/babel')+
                                         ' --plugins=transform-es2015-modules-commonjs '+
                                         ' --module umd ' +
                                         path.normalize('./dist/bundles/') + config.libFilename + '.umd.js'+
                                         ' --out-file '+path.normalize('./dist/bundles/') + config.libFilename +'.umd.js', function(code, output, error){

                          alert('Babel', 'transpiled', './'+config.dist+'/bundles/'+config.libFilename+' to', './'+config.dist+'/bundles/'+config.libFilename+'.umd.js');
                          compile.es5Lib();

                     });



                 });
              });
    },


    es5Lib : () => {



         let tsc = exec(path.normalize(config.projectRoot+'/node_modules/.bin/ngc')+
                        ' -p '+path.normalize('./tsconfig.lib.es5.json'), function(code, output, error) {

          log('ngc', 'compiled', 'ngfactory');
                  alert('Rollup', 'started bundling', 'ngfactory');

                 let bundle = exec(path.normalize(config.projectRoot+'/node_modules/.bin/rollup')+
                                   ' -c rollup.config.lib-es5.js', function(code, output, error) {

                    alert('Rollup', 'bundled', config.libFilename+'.es5.js in', './'+config.dist);


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

                      log('d.ts, metadata.json', 'copied to', './'+config.dist);

                      cp(path.normalize(path.join('./ngfactory', config.libFilename + '.metadata.json')), path.normalize(config.dist));

                      //rm(path.normalize(config.dist + '/index.ts'));

                      find(path.normalize('./'+config.dist)).filter(function(file) {

                        if (config.buildHooks && config.buildHooks.lib && config.buildHooks.lib.clean) {
                          config.buildHooks.lib.clean(file);
                        } else {
                          if (file.match(/component.ts$/) || file.match(/directive.ts$/) || file.match(/injectable.ts$/) || file.match(/module.ts$/) || file.match(/.html$/) || file.match(/.scss$/)) {
                            rm(file);
                          }
                        }

                      });

                    alert('Babel', 'started transpiling', config.libFilename+'.es5.js');

                    let transpile = exec(path.normalize(config.projectRoot + '/node_modules/.bin/babel')+
                                    ' --presets=es2015-rollup '+ path.normalize('./dist/') + config.libFilename + '.es5.js'+
                                    ' --out-file '+ path.normalize('./dist/') + config.libFilename +'.es5.js', function(code, output, error){
                          alert('Babel', 'transpiled', './'+config.dist+'/'+config.libFilename+' to', './'+config.dist+'/'+config.libFilename+'.es5.js');
                     });

                    exec( require(config.projectRoot + '/package.json').scripts['copy:package'], function() {

                      log('package.json', 'copied to', './'+config.dist);

                      if (config.buildHooks && config.buildHooks.lib && config.buildHooks.lib.post) {
                        config.buildHooks.lib.post();
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


let style = utils.style;

/*

  Init Tasks

  A sequence of commands needed to clean and start the lib build

*/


let init = function() {

    rm('-rf', path.normalize( config.projectRoot+'/.tmp/'));
    rm('-rf',  path.normalize('./ngfactory'));
    rm('-rf',  path.normalize('./'+config.dist));

    mkdir( path.normalize('./ngfactory'));
    mkdir( path.normalize('./'+config.dist));
    mkdir( path.normalize('./'+config.dist+'/bundles'));

    if (config.buildHooks && config.buildHooks.lib &&  config.buildHooks.lib.pre) {
      config.buildHooks.lib.pre();
    }

    clean.lib();

   
    style.src({
      sassConfig: config.style.sass.prod || {
        includePaths: ['src/style/'],
        outputStyle: 'expanded',
        sourceComments: false
      },
      env: 'prod',
      allowPostCSS: true,
      src: config.lib,
      dist: config.dist,
      styleSrcOnInit: false
    },
    function (filePath) {
      if (utils.style.files.indexOf(filePath) === utils.style.files.length - 1) {
        alert('libsass and postcss', 'compiled');
        hasCompletedFirstStylePass === true;
        compile.src();
      }
    },
    function (filePath, outFile, err) {

    });

};

/*

  Watcher

  Chokidar is used to watch files, run the above methods.

*/


let watcher = chokidar.watch(path.normalize('./' + config.src + '/**/*.*'), {
  ignored: /[\/\\]\./,
  persistent: canWatch
}).on('change', filePath => {

      if (filePath.indexOf(path.join(config.src , 'public')) > -1) {

        if (filePath.indexOf(path.join(config.src , 'index.html'))) {
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
   .on('unlink', filePath => log(filePath, 'has been removed'));

watcher
  .on('error', error =>  warn('ERROR:', error))
  .on('ready', () => {

    alert('INITIAL SCAN COMPLETE', 'building for', 'lib');

    init();
});

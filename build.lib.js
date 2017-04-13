"use strict";

require('shelljs/global');

const fs          = require('fs');
const path        = require('path');
const utils       = require('./build.utils.js');
const chokidar    = require('chokidar');
const sass        = require('node-sass');
const MagicString = require('magic-string');
const minifyHtml  = require('html-minifier').minify;

const console   = utils.console;
const colors    = utils.colors;
const scripts   = utils.scripts;
const paths     = utils.paths;
const log       = utils.log;
const warn      = utils.warn;

const moduleIdRegex = /moduleId\s*:(.*)/g;
const componentRegex = /@Component\(\s?{([\s\S]*)}\s?\)$/gm;
const templateUrlRegex = /templateUrl\s*:(.*)/g;
const styleUrlsRegex = /styleUrls\s*:(\s*\[[\s\S]*?\])/g;
const stringRegex = /(['"])((?:[^\\]\\\1|.)*?)\1/g;

const env = 'prod';

let canWatch = false;
let isCompiling = false;
let hasInit = false;
let styleFiles = [];

process.argv.forEach((arg)=>{
  if (arg.includes('watch')) {
    canWatch = arg.split('=')[1].trim() === 'true' ? true : false;
  }
});

// Logic for inling styles adapted from rollup-plugin-angular CREDIT Felix Itzenplitz

function insertText(str, dir, preprocessor = res => res, processFilename = false) {
  return str.replace(stringRegex, function (match, quote, url) {
    const includePath = path.join(dir, url);
    if (processFilename) {
      return "'" + preprocessor(includePath) + "'";
    }
    const text = fs.readFileSync(includePath).toString();
    return "'" + preprocessor(text, includePath) + "'";
  });
}

function angular(options, source, dir) {

  options.preprocessors = options.preprocessors || {};
  // ignore @angular/** modules
  options.exclude = options.exclude || [];
  if (typeof options.exclude === 'string' || options.exclude instanceof String) options.exclude = [options.exclude];
  if (options.exclude.indexOf('node_modules/@angular/**') === -1) options.exclude.push('node_modules/@angular/**');

  const magicString = new MagicString(source);

  let hasReplacements = false;
  let match;
  let start, end, replacement;

  while ((match = componentRegex.exec(source)) !== null) {
    start = match.index;
    end = start + match[0].length;

    replacement = match[0]
      .replace(templateUrlRegex, function (match, url) {
        hasReplacements = true;
        return 'template:' + insertText(url, dir, options.preprocessors.template, options.processFilename);
      })
      .replace(styleUrlsRegex, function (match, urls) {
        hasReplacements = true;
        return 'styles:' + insertText(urls, dir, options.preprocessors.style, options.processFilename);
      })
      .replace(moduleIdRegex, function (match, moduleId) {
        hasReplacements = true;
        return '';
      });

    if (hasReplacements) magicString.overwrite(start, end, replacement);
  }

  if (!hasReplacements) return null;

  let result = { code: magicString.toString() };
  if (options.sourceMap !== false) result.map = magicString.generateMap({ hires: true });

  return result;

}

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
          // cp(file, paths.dist+'/'+file);
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

};

/* Compile */

const compile = {

    clean: (path) => {

      const multilineComment = /^[\t\s]*\/\*\*?[^!][\s\S]*?\*\/[\r\n]/gm;
      const singleLineComment = /^[\t\s]*(\/\/)[^\n\r]*[\n\r]/gm;
      const outFile = path ? path : './'+paths.dist+'/bundle.js';
      let inline = '';

      fs.readFile(outFile, 'utf8', function(err, contents) {
        if(!err) {
            contents = contents.replace(multilineComment, '');
            contents = contents.replace(singleLineComment, '');

            if ( contents.search(componentRegex) > -1 ) {
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

        log(paths.src+'/*.ts', 'copied', 'to', 'tmp/*ts');

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
                     log('Rollup', 'bundled', paths.libFilename+'.js in', './dist');

                     compile.es5Lib();
                    //  exec(scripts['copy:lib'], function() {

                    //   log('Copied', 'd.ts, metadata.json', ' to ', './dist');

                    // });

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

                      if( styleFiles.indexOf(path) === styleFiles.length - 1  ) {
                        log('libsass and postcss', 'compiled', 'for', colors.bold(colors.cyan(env)));
                        setTimeout(compile.src, 2000);
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
    cp('-R', paths.lib+'/.', 'tmp/');
    rm('-rf', './ngfactory');
    mkdir('./ngfactory');
    rm('-rf', './'+paths.dist);
    mkdir('./'+paths.dist);
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

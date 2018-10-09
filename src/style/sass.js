require('shelljs/global');

const sass = require('node-sass');
const path = require('path');
const fs = require('fs');
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class Sass {
  constructor(sassConfig) {
    this.sassConfig = sassConfig;
  }

  batch(fileList) {

    if (!fs.existsSync(path.join(this.sassConfig.dist, 'style'))) {
      // TODO: figure out best way to handle use case without any global style
      mkdir('-p', path.join(this.sassConfig.dist, 'style'));
    }

    return new Promise(res => {
      try {

        const styles = config.projects[config.project].architect.build.options.styles;
        const globalFiles = styles.map((stylePath) => {
          return this.file(stylePath);
        });

        const files = fileList.filter((filePath, index) => {
          return (filePath && filePath.replace(/^.*[\\\/]/, '')[0] !== '_' &&
            styles.indexOf(filePath) === -1);
        }).map((filePath) => {
          return this.file(filePath)
        });

        Promise.all(files.concat(globalFiles)).then((css) => {
          res(css);
        });

      } catch (err) {
        err.service = 'sass';
        log.error(err);
      }
    });
  }

  file(filePath) {

    let env;

    if (cli.env === 'jit') {
      env = 'dev';
    } else {
      env = cli.env;
    }

    const srcPath = util.getFilePath(filePath);
    const filename = util.getFileName(filePath);
    const styles = config.projects[config.project].architect.build.options.styles;
    const globalBaseNames = styles.map((stylePath) => {
      return path.dirname(stylePath);
    }).filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
    // determine if file is global or not, swap .scss to .css in filename
    const isGlobal = new RegExp(globalBaseNames.join('|')).test(filePath);
    let outFile = filePath;

    if (isGlobal) {

      globalBaseNames.forEach((baseName) => {
        if (outFile.includes(config.src)) {
          outFile = path.normalize(outFile.replace(config.src, this.sassConfig.dist));
        }
      })

    }

    let outFilePath = util.getFilePath(outFile);


    if (cli.env === 'dev' || cli.env === 'prod' || cli.env === 'lib') {
      outFilePath = util.getFilePath(outFile);
    }
    if (cli.env === 'jit' && srcPath.indexOf(config.src + '/style') === -1) {
      outFilePath = util.getFilePath(path.join(this.sassConfig.dist, outFile));
    }

    outFile = path.join(outFilePath, filename.replace('scss', 'css'));

    // this file is global w/ underscore and should not be compiled, compile global files instead

    if (isGlobal && filename[0] === '_') {
      return Promise.all(
        styles.map(filePath => {
          return this.file(filePath);
        })
      );
    }

    // TODO: figure out better way to transform paths based on needs

    if (cli.program.build === 'prod' &&
      isGlobal === false) {
      outFilePath = path.join('out-tsc', outFilePath);
      outFile = path.join('out-tsc', outFile);
    }

    if (cli.program.build === 'lib' &&
      isGlobal === true) {
      outFilePath = path.join(this.sassConfig.dist, outFilePath.replace('src/', '').replace('src\\', ''));
      outFile = path.join(outFilePath, path.basename(outFile));
    }


    return new Promise(res => {

      const renderConfig = config.projects[config.project].architect.build.options.stylePreprocessorOptions;
      renderConfig.file = filePath;
      renderConfig.outFile = outFile;

      if (fs.existsSync(outFilePath) == false) {
        mkdir('-p', outFilePath);
      }

      if (env === 'dev') {
        renderConfig.sourceComments = true;
      }

      if (this.sassConfig.sourceMap) {
        renderConfig.sourceMap = this.sassConfig.sourceMap;
      }


      sass.render(renderConfig, (error, result) => {
        if (error) {
          log.line();
          error.service = 'sass';
          log.error(error);
        } else {
          fs.writeFile(outFile, result.css, err => {
            if (err) {
              log.line();
              err.service = 'sass';
              log.error(err);
            }
            if (res) {
              res(outFile);
            }
          });
        }
      });
    });
  }
}

module.exports = Sass;

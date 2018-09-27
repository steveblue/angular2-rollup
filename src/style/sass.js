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
        const files = fileList.filter((filePath, index) => {
          if (filePath && filePath.replace(/^.*[\\\/]/, '')[0] !== '_') {
            return this.file(filePath);
          }
        });

        res(files);
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

    if (!fs.existsSync('out-css')) {
      mkdir('-p', 'out-css');
    }

    const srcPath = util.getFilePath(filePath);
    const filename = util.getFileName(filePath);

    const styles = config.projects[config.project].architect.build.options.styles;
    const globalBaseNames = config.projects[config.project].architect.build.options.styles.map((stylePath) => {
      return path.dirname(stylePath);
    }).filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
    // determine if file is global or not, swap .scss to .css in filename
    const isGlobal = new RegExp(globalBaseNames.join('|')).test(filePath);
    let outFile = filePath;

    if (isGlobal) {

      globalBaseNames.forEach((baseName) => {
        if (outFile.includes(baseName)) {
          outFile = path.normalize(outFile.replace(baseName, this.sassConfig.dist));
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

    outFilePath = path.join('out-css', outFilePath);
    outFile = path.join('out-css', outFile);

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

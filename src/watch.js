
const findup = require('findup');
const path = require('path');
const utils = require('./util');
const chokidar = require('chokidar');
const SassBuilder = require('./style/sass.js');
const PostCSSBuilder = require('./style/postcss.js');
const config = require('./config');
const util = require('./util');
const cli = require('./../cli.config.json');

class Watcher {
    constructor() {

        const sassBuilder = new SassBuilder({ dist: config.build });
        const postcssBuilder = new PostCSSBuilder({ dist: config.build, sourceMap: (cli.env === 'dev') ? false : true });

        const watcher = chokidar.watch(path.normalize('./' + config.src + '/**/*.*'), {
            ignored: /[\/\\]\./,
            persistent: true
        }).on('change', filePath => {

            if (filePath.includes(path.join(config.src, 'public'))) {
                this.updatePublic(filePath);
            }
            else if (filePath.indexOf('.scss') > -1) {
                (async () => {
                    const sass = await sassBuilder.file(filePath);
                    const postcss = await postcssBuilder.file(sass);
                    util.log('libass and postcss compiled', util.getFileName(postcss));
                })();
            }

        }).on('unlink', filePath => util.warn(filePath, 'has been removed'))
          .on('error', error => util.warn('ERROR:', error));
          //.on('ready', error => util.log('listening for changes'));

        return watcher;

    }

    updatePublic(filePath) {
 
        if (filePath.includes(path.join(config.src, 'public', 'index.html'))) {
            util.formatIndex(path.normalize(config.src + '/public/index.html'));
        } else {
            util.copyFile(filePath, path.normalize(config.build + '/'));
        }

    }
}

module.exports = Watcher;
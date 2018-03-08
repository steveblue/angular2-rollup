
const findup = require('findup');
const path = require('path');
const utils = require('./util');
const chokidar = require('chokidar');
const config = require('./config');
const util = require('./util');
const cli = require('./../cli.config.json');

class Watcher {
    constructor() {}



    watch() {

        const sassBuilder = new SassBuilder({ dist: config.build });
        const postcssBuilder = new PostCSSBuilder({ dist: config.build, sourceMap: true });

        const watcher = chokidar.watch(path.normalize('./' + config.src + '/**/*.*'), {
            ignored: /[\/\\]\./,
            persistent: true
        }).on('change', filePath => {

            if (filePath.includes(path.join(config.src, 'public'))) {
                this.updatePublic(filePath);
            }
            else if (filePath.indexOf('.scss') > -1) {
                const sass = await sassBuilder.file(filePath);
                const postcss = await postcssBuilder.file(sass);
                util.log('libass and postcss compiled ', postcss);
            }

        })
        .on('add', filePath => {
            util.log(`File ${path} has been added`);
            if (filePath.includes(path.join(config.src, 'public'))) {
                this.updatePublic(filePath);
            }
        })
        .on('unlink', filePath => util.warn(filePath, 'has been removed'));

        watcher
            .on('error', error => warn('ERROR:', error));

    }

    updatePublic(filePath) {
 
        if (filePath.includes(path.join(config.src, 'public', 'index.html'))) {
            util.formatIndex(path.normalize(config.src + '/public/index.html'));
        } else {
            console.log(filePath, path.normalize(config.build + '/'));
            // util.copyFile(filePath, path.normalize(config.build + '/')));
        }

    }
}

module.exports = new Watcher();
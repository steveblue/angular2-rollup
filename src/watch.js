
const findup = require('findup');
const path = require('path');
const utils = require('./util');
const chokidar = require('chokidar');
const SassBuilder = require('./style/sass.js');
const PostCSSBuilder = require('./style/postcss.js');
const TSBuilder      = require('./compile/tsc.js');
const config = require('./config');
const util = require('./util');
const log = require('./log');
const cli = require('./../cli.config.json');

let = lastPath = '';

class Watcher {
    constructor() {

        const sassBuilder = new SassBuilder({ dist: config.build });
        const postcssBuilder = new PostCSSBuilder({ dist: config.build, sourceMap: (cli.env === 'dev') ? false : true });
        const jitBuilder = new TSBuilder();
        const watcher = chokidar.watch([config.src], {
            ignored: /[\/\\]\./,
            persistent: true
        }).on('change', filePath => {

            if (filePath.includes('out-css')) {
                return;
            }

            if (cli.program.verbose) log.message(filePath + ' changed');

            if (filePath.includes(path.join(config.src, 'public'))) {
                this.updatePublic(filePath);
            }
            else if (filePath.indexOf('.scss') > -1) {

                (async () => {
   
                    const sass = await sassBuilder.file(filePath);
               
                    if (Array.isArray(sass)) {
                        const postcss = await postcssBuilder.batch(sass);
                        log.cancelError('sass');
                        log.cancelError('postcss');
                        // log.success('libsass and postcss compiled', ['sass', 'postcss']);
                    } else {
                        const postcss = await postcssBuilder.file(sass);
                        log.cancelError('sass');
                        log.cancelError('postcss');
                        //log.success('libsass and postcss compiled', ['sass', 'postcss']);
                    }


                })();
            }
            else if (filePath.indexOf('.ts') > -1 && cli.env === 'jit') {
                jitBuilder.compile(path.join('src','tsconfig.' + cli.env + '.json'));
            }
            else if (filePath.indexOf('.html') > -1 && cli.env === 'jit') {
                util.copyFile(filePath, path.join(config.build, filePath));
            }
            
            if (util.hasHook('watch') && config.buildHooks[cli.env].watch.src) {
                config.buildHooks[cli.env].watch.src(filePath);
            }

        }).on('unlink', filePath => log.warn(filePath, 'has been removed'))
          .on('error', error => log.warn('ERROR:', error));
          //.on('ready', error => log.message('listening for changes'));

        return watcher;

    }

    updatePublic(filePath) {

        if (filePath.includes(path.join(config.src, 'public', 'index.html'))) {
            util.formatIndex(path.normalize(config.src + '/public/index.html'));
        } else {
            util.copyFile(filePath, path.join(config.build, filePath.replace(path.normalize('src/public/'), '')));
        }

    }
}

module.exports = Watcher;

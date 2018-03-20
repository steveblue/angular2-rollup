require('shelljs/global');
const path = require('path');
const fs = require('fs');
const Build = require('./index.js');
const SassBuilder = require('./../style/sass.js');
const PostCSSBuilder = require('./../style/postcss.js');
const AOTBuilder = require('./../compile/ngc.js');
const RollupBuilder = require('./../bundle/rollup.js');
const Watcher = require('./../watch.js');
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class LibBuild extends Build {

    constructor() {
        super();
        this.libConfigPath = cli.program.config.trim();
        this.hasInit = false;
    }

    init() {
        this.pre();
    }


    build() {

        // TODO: figure out best way to abstract styling tasks for the builds, should be able to support LESS, Stylus, etc.

        const sassBuilder = new SassBuilder({ dist: this.libConfig.dist, sourceMap: false });
        const postcssBuilder = new PostCSSBuilder({ dist: this.libConfig.dist, sourceMap: false });

        if (ls(path.normalize(this.libConfig.src + '/**/*.scss')).length > 0) {

            const sassFileList = ls(path.normalize(this.libConfig.src + '/**/*.scss'));

            (async () => {
                const sass = await sassBuilder.batch(sassFileList);
                const postcss = await postcssBuilder.batch(sass);
                const bundle = await this.bundleLib();
            })();

   
        }
        else if (ls(path.normalize(this.libConfig.src + '/**/*.css')).length > 0) {

            const cssFileList = ls(path.normalize(this.libConfig.src + '/**/*.css'));

            (async () => {
                const postcss = await postcssBuilder.batch(cssFileList);
                const bundle = await this.bundleLib();
            })();


        } else { // dont barf on a lib without styling
            this.bundleLib(); 
        }

        // process global styles 
        if (ls(path.normalize(config.src + '/style/*.scss')).length > 0) {

            (async () => {
                const sass = await sassBuilder.batch(ls(path.normalize(config.src + '/style/*.scss')));
                const postcss = await postcssBuilder.batch(sass);
            })();

        }
        else if (ls(path.normalize(config.src + '/style/*.css')).length > 0) {
            const globalCSSFileList = ls(path.normalize(config.src + '/**/*.css'));
            postcssBuilder.batch(globalCSSFileList);
        }

    }

    bundleLib() {

        const aotBuilder = new AOTBuilder();
        const rollupBuilder = new RollupBuilder();

        return new Promise((res, rej) => {

            (async () => {
                const compileFESM = await aotBuilder.compile(path.join(this.libConfig.src, this.libConfig.es2015.tsConfig));
                const rollupFESM = await rollupBuilder.bundle(path.join(this.libConfig.src, this.libConfig.es2015.rollupConfig));
                const post = await this.checkBuild();
            })();
            (async () => {
                const compileUMD = await aotBuilder.compile(path.join(this.libConfig.src, this.libConfig.es5.tsConfig));
                const rollupUMD = await rollupBuilder.bundle(path.join(this.libConfig.src, this.libConfig.umd.rollupConfig));
                const post = await this.checkBuild();
            })();
            (async () => {
                const compileES5 = await aotBuilder.compile(path.join(this.libConfig.src, this.libConfig.es5.tsConfig));
                const rollupES5 = await rollupBuilder.bundle(path.join(this.libConfig.src, this.libConfig.es5.rollupConfig));
                const post = await this.checkBuild();
            })();

        });
    }

    checkBuild() {

        return new Promise((res, rej) => {
            if (fs.existsSync(this.libConfig.es2015.outFile) && fs.existsSync(this.libConfig.es5.outFile) && fs.existsSync(this.libConfig.umd.outFile)) {
                this.post();
                res();
            } else {
                res(); // fail silently
            }
        });
  
    }

    fetchLibConfig() {

        return new Promise((res, rej) => {
            fs.readFile(this.libConfigPath, 'utf8', (err, contents) => {
                if (!err) {
                    this.libConfig = JSON.parse(contents);
                    res();
                } else {
                    rej(err);
                }
            });
        })

    }

    processTypeDefinitions() {

        return new Promise((res, rej) => {

            try {
                // process d.ts files and copy to dist
                find(path.normalize('./ngfactory/'))
                    .filter(function (file) { return file.match(/\.d.ts$/); })
                    .forEach((filePath) => {

                        let fileName = filePath.replace(/^.*[\\\/]/, '');

                        if (fileName === (this.libConfig.filename + '.d.ts')) {
                            // do nothing
                        }
                        else if (fileName === ('index.d.ts')) {
                            let dir = path.normalize(filePath.substring(0, filePath.lastIndexOf("/")).replace('ngfactory', 'dist'));
                            fs.readFile(path.join('ngfactory', fileName), 'utf8', (err, contents) => {
                                if (err) rej(err);
                                if (!err) {
                                    fs.writeFile(path.join(dir, this.libConfig.filename + '.d.ts'), contents, 'utf-8', () => {});
                                }
                            });
                        }
                        else {
                            let dir = path.normalize(filePath.substring(0, filePath.lastIndexOf("/")).replace('ngfactory', 'dist'));
                            if (!fs.existsSync(dir)) {
                                mkdir('-p', dir);
                            }
                            cp(filePath, path.join(dir, fileName));
                        }

                    });

                // remove extra d.ts
                rm(path.join(path.normalize(this.libConfig.dist), this.libConfig.filename)+'.es5.d.ts'); 
                // copy metadata
                cp(path.normalize(path.join('./ngfactory', this.libConfig.filename + '.metadata.json')), path.normalize(this.libConfig.dist)); 
                log.message('d.ts, metadata.json', 'copied to', './' + this.libConfig.dist);
                // remove .ts files from dist
                find(path.normalize('./' + this.libConfig.dist)).filter((file) => {

                    if (util.hasHook('clean')) {
                        log.message('processing clean task');
                        config.buildHooks.lib.clean(process.argv, file);
                    } else {
                        if (file.match(/component.ts$/) || file.match(/directive.ts$/) || file.match(/injectable.ts$/) || file.match(/module.ts$/) || file.match(/.html$/) || file.match(/.scss$/)) {
                            rm(file);
                        }
                    }

                });
                res();
           

            }
            catch(err) {
                rej(err);
            }
            
        });
    }


    pre() {

        util.cleanBuild();

        this.fetchLibConfig().then((res) => {

            rm('-rf', this.libConfig.dist);
            mkdir('-p', this.libConfig.dist);

            cp('-R', path.normalize(this.libConfig.src + '/')+'.', path.normalize('./tmp'));

            // remove moduleId prior to ngc build, inline template and styles
            ls(path.normalize('tmp/**/*.ts')).forEach((file) => {
                sed('-i', /^.*moduleId: module.id,.*$/, '', file);
                util.inline(file);
            });

            if (util.hasHook('pre')) {
                log.message('processing pre task');
                config.buildHooks[cli.env].pre(process.argv).then(() => {
                    this.build();
                });

            } else {

                this.build();

            }

        }).catch((err) => {
            log.warn(err); // TODO: exit process
        })
   
    }

    post() {

        if (!this.hasInit) {
            this.hasInit = true;
        } else {
            return;
        }

        this.processTypeDefinitions().then((res) => {

            // copy package.json to dist
            exec('cp ' + this.libConfig.src + '/package.json' + ' ' + this.libConfig.dist + '/package.json', () => {

                log.message('package.json', 'copied to', './' + this.libConfig.dist);
                if (util.hasHook('post')) {
                    log.message('processing post task');
                    config.buildHooks[cli.env].post(process.argv);
                }
                util.getTime(this.startTime);

            });
          
            
        });  

    }

}

module.exports = LibBuild;
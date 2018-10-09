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

    constructor(libName) {
        super();

        this.hasInit = false;
        this.hasPost = false;


        if (!cli.program.config) {
            if (!libName) {
                libName = cli.program.build;
                const libConfig = config.projects[cli.program.rawArgs[cli.program.rawArgs.indexOf(libName) + 1]];
                this.libConfigPath = path.join(libConfig.root, libConfig.configFile);
            } else {
                const libConfig = config.projects[libName];
                this.libConfigPath = path.join(libConfig.root, libConfig.configFile);
            }

        } else {
            this.libConfigPath = cli.program.config.trim();
        }

    }

    init() {
        this.pre();
    }


    build() {

        // TODO: figure out best way to abstract styling tasks for the builds, should be able to support LESS, Stylus, etc.
        const sassBuilder = new SassBuilder({ dist: this.libConfig.dist, sourceMap: false });
        const postcssBuilder = new PostCSSBuilder({ dist: this.libConfig.dist, sourceMap: false });
        const styles = config.projects[config.project].architect.build.options.styles;

        if (ls(path.normalize('tmp/**/*.scss')).length > 0) {

            const sassFileList = ls(path.normalize('tmp/**/*.scss'));
            (async () => {
                const sass = await sassBuilder.batch(sassFileList);
                const postcss = await postcssBuilder.batch(sass);
                const bundle = await this.bundleLib();
            })();

        }
        else if (ls(path.normalize('tmp/**/*.css')).length > 0) {

            const cssFileList = ls(path.normalize('tmp/**/*.css'));

            (async () => {
                const postcss = await postcssBuilder.batch(cssFileList);
                const bundle = await this.bundleLib();
            })();


        } else { // dont barf on a lib without styling
            (async () => {
                const bundle = await this.bundleLib();
            })();
        }

        // process global styles

        // if (styles.length > 0) {
        //     const globalFiles = styles.map((stylePath) => {
        //       return sassBuilder.file(stylePath);
        //     });

        //     Promise.all(globalFiles).then((css) => {
        //         postcssBuilder.batch(css);
        //     });
        // }

    }

    bundleLib() {

        const aotBuilder = new AOTBuilder();
        const rollupBuilder = new RollupBuilder();

        return new Promise((res, rej) => {

            log.process('compiling library');

            (async () => {
                const compileFESM = await aotBuilder.compile(path.join(this.libConfig.src, 'config', this.libConfig.es2015.tsConfig));
                const rollupFESM = await rollupBuilder.bundle(path.join(this.libConfig.src, 'config', this.libConfig.es2015.rollupConfig));
                const post = await this.checkBuild();
            })();
            (async () => {
                const compileUMD = await aotBuilder.compile(path.join(this.libConfig.src, 'config', this.libConfig.es5.tsConfig));
                const rollupUMD = await rollupBuilder.bundle(path.join(this.libConfig.src, 'config', this.libConfig.umd.rollupConfig));
                const post = await this.checkBuild();
            })();
            (async () => {
                const compileES5 = await aotBuilder.compile(path.join(this.libConfig.src, 'config', this.libConfig.es5.tsConfig));
                const rollupES5 = await rollupBuilder.bundle(path.join(this.libConfig.src, 'config', this.libConfig.es5.rollupConfig));
                const post = await this.checkBuild();
            })();
            (async () => {
                const compileESM5 = await aotBuilder.compile(path.join(this.libConfig.src, 'config', this.libConfig.esm5.tsConfig));
                const post = await this.checkBuild();
            })();
            (async () => {
                const compileESM2015 = await aotBuilder.compile(path.join(this.libConfig.src, 'config', this.libConfig.esm2015.tsConfig));
                const post = await this.checkBuild();
            })();

        });
    }

    checkBuild() {

        return new Promise((res, rej) => {
            if (fs.existsSync(this.libConfig.es2015.outFile) &&
                fs.existsSync(this.libConfig.es5.outFile) &&
                fs.existsSync(this.libConfig.umd.outFile) &&
                fs.existsSync(path.join('out-tsc', 'esm5', 'index.js')) &&
                fs.existsSync(path.join('out-tsc', 'esm2015', 'index.js'))) {
                if (!this.hasPost) {
                    this.post();
                }
                log.stop('compiling library');
                res();
            } else {
                log.stop('compiling library');
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

    processESM() {

        return new Promise((res, rej) => {

            let copyFile = (filePath, distFilePath) => {
                if (!fs.existsSync(util.getFilePath(distFilePath))) {
                    mkdir('-p', util.getFilePath(distFilePath));
                }
                cp('-R', filePath, distFilePath);
            };

            try {

                // copy typings
                find(path.normalize('./out-tsc/esm5'))
                    .filter(function (file) { return file.match(/\.d.ts$/); })
                    .forEach((filePath) => {
                        copyFile(filePath, path.join(this.libConfig.dist, filePath.replace(path.normalize('out-tsc/esm5'), '')));
                    });
                // copy esm5
                find(path.normalize('./out-tsc/esm5'))
                    .filter(function (file) { return file.match(/\.js$/); })
                    .forEach((filePath) => {
                        copyFile(filePath, path.join(this.libConfig.dist, filePath.replace('out-tsc', '')));
                    });
                // copy esm2015
                find(path.normalize('./out-tsc/esm2015'))
                    .filter(function (file) { return file.match(/\.js$/); })
                    .forEach((filePath) => {
                        copyFile(filePath, path.join(this.libConfig.dist, filePath.replace('out-tsc', '')));
                    });
                // cophy meteadata
                cp(path.join('out-tsc', 'esm2015', this.libConfig.filename + '.metadata.json'),
                    path.join(this.libConfig.dist, this.libConfig.filename + '.metadata.json'));

                res();

            }
            catch (err) {
                rej(err);
            }

        });
    }


    pre() {

        util.cleanBuild();

        this.fetchLibConfig().then((res) => {

            rm('-rf', 'out-tsc');
            rm('-rf', this.libConfig.dist);
            mkdir('-p', this.libConfig.dist);

            cp('-R', path.normalize(this.libConfig.src + '/') + '.', path.normalize('./tmp'));

            // remove moduleId prior to ngc build, inline template and styles
            ls(path.normalize('tmp/**/*.ts')).forEach((file) => {
                sed('-i', /^.*moduleId: module.id,.*$/, '', file);
                util.inline(file);
            });

            if (util.hasHook('pre')) {
                log.message('processing pre task');
                config.projects[config.project].architect.build.hooks[cli.env].pre(process.argv).then(() => {
                    this.build();
                });

            } else {

                this.build();

            }

            this.emitter.emit('hook', {
                payload: {
                    step: 'pre'
                }
            });

        }).catch((err) => {
            log.warn(err); // TODO: exit process
        })

    }

    post() {

        this.hasPost = true;

        this.processESM().then((res) => {

            // copy package.json to dist
            exec('cp ' + this.libConfig.src + '/package.json' + ' ' + this.libConfig.dist + '/package.json', () => {

                log.message('package.json copied to ./' + this.libConfig.dist);


                if (util.hasHook('post')) {
                    log.message('processing post task');
                    config.projects[config.project].architect.build.hooks[cli.env].post(process.argv);

                }

                log.destroy();
                log.buildStats(this.startTime, this.libConfig.dist);

                this.emitter.emit('hook', {
                    payload: {
                        step: 'post'
                    }
                });

            });


        }).catch((err) => {
            log.warn(err);
        });

    }

}

module.exports = LibBuild;
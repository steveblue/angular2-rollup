
const path           = require('path');
const fs             = require('fs');
const Build          = require('./index.js');
const SassBuilder    = require('./../style/sass.js');
const PostCSSBuilder = require('./../style/postcss.js');
const AOTBuilder     = require('./../compile/ngc.js');
const Watcher        = require('./../watch.js');
const util           = require('./../util.js');
const config         = require('./../config');
const cli            = require('./../../cli.config.json');

class DevBuild extends Build {

    constructor() {
        super();
    }

    init() {
       this.pre();
    }


    build() {

      const sassBuilder = new SassBuilder({ dist: config.build });
      const postcssBuilder = new PostCSSBuilder({ dist: config.build, sourceMap: true });
      const aotBuilder = new AOTBuilder();

      (async () => {
        const lib = await util.copyLib(config.lib && config.lib[cli.env] ? config.lib[cli.env] : config.dep['lib'], 
                                       config.lib && config.lib[cli.env] ? config.lib.src : config.dep.src, 
                                       config.lib && config.lib[cli.env] ? config.lib.dist : config.dep.dist);
        const publicDir = await util.copyDir(path.normalize(config.src + '/public/'), config.build);
        const template = await util.formatIndex(path.normalize(config.src + '/public/index.html'));
      })();

      (async () => {
        const sass = await sassBuilder.src();
        const postcss = await postcssBuilder.batch(sass);
        const src = await aotBuilder.compileSrc();
        this.post();
      })();

      fs.readFile(path.resolve('build', 'main.ts'), 'utf8', (err, content) => {
        if (err || content.includes('enableProdMode();')) {
          const main = aotBuilder.compileMain().then((res) => {
            util.log('compiled main.ts');
          });
        }
      });

    }

    pre() {

      if (cli.program.clean === true) {
        util.cleanBuild();
      }

      if (util.hasHook('pre')) {

        config.buildHooks[cli.env].pre(process.argv).then(() => {
          this.build();
        });

      } else {

        this.build();

      }

    }

    post() {
      
      if (util.hasHook('post')) config.buildHooks[cli.env].post(process.argv);
      if (cli.program.watch === true) {
        const watcher = new Watcher();
      }
      util.getTime(this.startTime);

    }

}

module.exports = DevBuild;
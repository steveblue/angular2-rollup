
const path            = require('path');
const fs              = require('fs');
const moment          = require('moment');
const Build           = require('./index.js');
const SassBuilder     = require('./../style/sass.js');
const PostCSSBuilder  = require('./../style/postcss.js');
const AOTBuilder      = require('./../compile/ngc.js');
const ClosureBuilder  = require('./../bundle/closure.js');
const util            = require('./../util.js');
const config          = require('./../config');
const cli             = require('./../../cli.config.json');

class ProdBuild extends Build {

    constructor() {
        super();
        this.startTime = moment(new Date());
    }

    init() {

        console.log(cli.env);

        if (cli.program.clean !== false) {
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

    build() {

      const sassBuilder = new SassBuilder({ dist: config.build });
      const postcssBuilder = new PostCSSBuilder({ dist: config.build, sourceMap: true });

      // remove moduleId prior to ngc build. TODO: look for another method.
      ls(path.normalize('ngfactory/**/*.ts')).forEach(function (file) {
        sed('-i', /^.*moduleId: module.id,.*$/, '', file);
      });

      const aotBuilder = new AOTBuilder();
      const closureBuilder = new ClosureBuilder();

      (async () => {
        const lib = await util.copyLib(config.lib[cli.env], config.lib.src, config.lib.dist);
        const publicDir = await util.copyDir(path.normalize(config.src + '/public/'), config.build);
        const template = await util.formatIndex(path.normalize(config.src + '/public/index.html'));
      })();

      (async () => {
        const sass = await sassBuilder.src();
        const postcss = await postcssBuilder.batch(sass);
        const copycss = await postcssBuilder.copyToNgFactory(postcss);
        const src = await aotBuilder.compileSrc();
        const bundle = await closureBuilder.bundle();
        util.getTime(this.startTime);
        if (util.hasHook('post')) config.buildHooks[cli.env].post(process.argv);
      })();

    }

}

module.exports = ProdBuild;
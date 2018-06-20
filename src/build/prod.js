require('shelljs/global');
const path            = require('path');
const fs              = require('fs');
const Build           = require('./index.js');
const SassBuilder     = require('./../style/sass.js');
const PostCSSBuilder  = require('./../style/postcss.js');
const AOTBuilder      = require('./../compile/ngc.js');
const ClosureBuilder  = require('./../bundle/closure.js');
const RollupBuilder   = require('./../bundle/rollup.js');
const util            = require('./../util.js');
const log             = require('./../log.js');
const config          = require('./../config');
const cli             = require('./../../cli.config.json');
const buildOptimizer  = require('@angular-devkit/build-optimizer').buildOptimizer;


class ProdBuild extends Build {

    constructor() {
        super();
    }

    init() {
        this.pre();
    }

    build() {

      const sassBuilder = new SassBuilder({ dist: config.build, sourceMap: false });
      const postcssBuilder = new PostCSSBuilder({ dist: config.build, sourceMap: false });
      const aotBuilder = new AOTBuilder();
      const closureBuilder = new ClosureBuilder();
      const rollupBuilder = new RollupBuilder();
      const libCheck = config.lib && config.lib[cli.env];

      (async () => {
        const publicDir = await util.copyDir(path.normalize(config.src + '/public'), config.build);
        const template = await util.formatIndex(path.normalize(config.src + '/public/index.html'));
        const vendor = await util.formatVendorScripts(libCheck ? config.lib[cli.env] : config.dep['prodLib'],
                                                      libCheck ? config.lib.src : config.dep.src,
                                                      libCheck ? config.lib.dist : config.build);
        const concatVendor = await util.concatVendorScripts(libCheck ? config.lib.dist : config.build);
      })();

      (async () => {
        const copyMain = await cp('main.ts', 'main.js');
        const copy = await cp('-R', path.normalize(config.src + '/'), path.normalize('./out-tsc'));
        // remove moduleId prior to ngc build. TODO: look for another method.
        const stripModuleId = await ls(path.normalize('out-tsc/**/*.ts')).forEach(function (file) {
          sed('-i', /^.*moduleId: module.id,.*$/, '', file);
        });

        const sass = await sassBuilder.batch(ls(path.normalize(config.src + '/**/*.scss')));
        const postcss = await postcssBuilder.batch(sass);
        const copycss = await postcssBuilder.copyToNgFactory(postcss);

        const src = await aotBuilder.compile(path.join('src', 'tsconfig.' + cli.env + '.json'));
        const buildOptimize = await ls(path.normalize('out-tsc/**/*.component.js')).forEach(function (file) {
          let content = fs.readFileSync(file, 'utf-8');
          fs.writeFileSync(file, buildOptimizer({ content: content }).content);
        });
        if (cli.program.rollup) {
          const bundle = await rollupBuilder.bundle(path.join(config.projectRoot, 'rollup.config.js'));
        } else {
          const bundle = await closureBuilder.bundle();
        }
        const cleanRoot = await rm(path.normalize('main.js'));
        if (util.hasHook('post')) config.buildHooks[cli.env].post(process.argv);
        util.getTime(this.startTime);

      })();

    }

    pre() {

      let build = () => {

        if (util.hasHook('pre')) {

          config.buildHooks[cli.env].pre(process.argv).then(() => {
            this.build();
          });

        } else {

          this.build();

        }

      }

      if (cli.program.clean !== false) {

        util.cleanBuild().then(()=>{
          build();
        });
      } else {

        build();
      }

    }

    post() {

      if (util.hasHook('post')) config.buildHooks[cli.env].post(process.argv);
      rm('main.js');
      log.break();
      util.getTime(this.startTime);

    }

}

module.exports = ProdBuild;
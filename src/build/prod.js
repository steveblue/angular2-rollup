require('shelljs/global');
const path            = require('path');
const fs              = require('fs');
const spawn           = require('child_process').spawn;
const Build           = require('./index.js');
const SassBuilder     = require('./../style/sass.js');
const PostCSSBuilder  = require('./../style/postcss.js');
const JITBuilder      = require('./../compile/tsc.js');
const AOTBuilder      = require('./../compile/ngc.js');
const UglifyBuilder   = require('./../compile/uglify.js');
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
      const jitBuilder = new JITBuilder();
      const closureBuilder = new ClosureBuilder();
      const rollupBuilder = new RollupBuilder();
      const uglifyBuilder = new UglifyBuilder();
      const libCheck = config.lib && config.lib[cli.env];
      const outFile = path.join(config.angular.projects[config.angular.defaultProject].architect.build.options.outputPath, 'bundle.js');

      (async () => {
        const publicDir = await util.copyDir(path.normalize(config.src + '/public'), config.build);
        const template = await util.formatIndex(path.normalize(config.src + '/public/index.html'));
        const vendor = await util.formatVendorScripts(libCheck ? config.lib[cli.env] : config.dep['prodLib'],
                                                      libCheck ? config.lib.src : config.dep.src,
                                                      libCheck ? config.build : config.build);
        const concatVendor = await util.concatVendorScripts(libCheck ? config.build : config.build);
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
          const transpile = await jitBuilder.compile(path.join(config.projectRoot, 'src', 'tsconfig.rollup.json'));
          const optimize = await uglifyBuilder.minify(outFile);
        } else {
          // use fesm instead for closure compiler, results in smaller bundles
          const prepRxjs = await this.buildRxjsFESM();
          const bundle = await closureBuilder.bundle();
        }
        const cleanRoot = await rm(path.normalize('main.js'));
        if (util.hasHook('post')) config.buildHooks[cli.env].post(process.argv);
        util.getTime(this.startTime);

      })();

    }

    pre() {

      let build = () => {

        cp(path.normalize('config/postcss.' + cli.env + '.js'), 'postcss.config.js');

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

    buildRxjsFESM() {
        return new Promise((res) => {

          let editFile = (filePath) => {
              return new Promise((res) => {
                  fs.readFile(filePath, 'utf-8', (error, stdout, stderr) => {
                      let pack = JSON.parse(stdout);
                      pack.es2015 = pack.es2015.replace('_esm2015', '_fesm2015');
                      log.message('editing ' + filePath);
                      fs.writeFile(filePath, JSON.stringify(pack), () => {
                          res(filePath);
                      })
                  });
              });
          };

          let rollup = spawn(path.join(config.projectRoot, 'node_modules', '.bin', 'rollup'), ['-c', 'config/rollup.rxjs.js']);

          rollup.stdout.on('data', (msg) => {
            log.message(msg);
          });

          rollup.on('exit', () => {
            log.message('rollup completed');
              Promise.all([editFile('node_modules/rxjs/package.json'),
                          editFile('node_modules/rxjs/operators/package.json'),
                          editFile('node_modules/rxjs/ajax/package.json'),
                          editFile('node_modules/rxjs/testing/package.json'),
                          editFile('node_modules/rxjs/websocket/package.json')])
                          .then(data => {
                              res();
                            });

          });
      });
    }

    post() {

      if (util.hasHook('post')) config.buildHooks[cli.env].post(process.argv);
      rm('main.js');
      log.break();
      util.getTime(this.startTime);

    }

}

module.exports = ProdBuild;
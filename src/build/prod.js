require('shelljs/global');
const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const Build = require('./index.js');
const SassBuilder = require('./../style/sass.js');
const PostCSSBuilder = require('./../style/postcss.js');
const AOTBuilder = require('./../compile/ngc.js');
const ClosureBuilder = require('./../bundle/closure.js');
const RollupBuilder = require('./../bundle/rollup.js');
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');
const buildOptimizer = require('@angular-devkit/build-optimizer').buildOptimizer;


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
    const libCheck = config.projects[config.project].architect.build.options.lib && config.projects[config.project].architect.build.options.lib[cli.build];

    (async () => {
      const publicDir = await util.copyDir(path.normalize(config.src + '/public'), config.build);
      const template = await util.formatIndex(path.normalize(config.src + '/public/index.html'));
      const vendor = await util.formatVendorScripts(libCheck ? config.projects[config.project].architect.build.options.lib[cli.build] : config.lib['prod'],
        libCheck ? config.projects[config.project].architect.build.options.lib.src : config.lib.src,
        libCheck ? config.build : config.build);
      const concatVendor = await util.concatVendorScripts(libCheck ? config.build : config.build);
    })();

    (async () => {
      // const copyMain = await cp('main.ts', 'main.js');
      const copy = await cp('-R', path.normalize(config.src + '/'), path.normalize('./tmp'));
      // // remove moduleId prior to ngc build. TODO: look for another method.
      // const stripModuleId = await ls(path.normalize('out-tsc/**/*.ts')).forEach(function (file) {
      //   sed('-i', /^.*moduleId: module.id,.*$/, '', file);
      // });
      if (ls(path.normalize('tmp/**/*.scss')).length > 0) {

        const sass = await sassBuilder.batch(ls(path.normalize('./tmp/**/*.scss')));
        await postcssBuilder.batch(sass);
        await this.transformSCSSPathstoCSS();

      } 
      else if (ls(path.normalize('tmp/**/*.css')).length > 0) {

        const cssFileList = ls(path.normalize('tmp/**/*.css'));
        await postcssBuilder.batch(cssFileList);

      }
      
      // rewrite tsconfig to compile tmp instead of src
      await sed('-i', 'src/', 'tmp/', path.join('tmp', 'tsconfig.' + cli.build + '.json'));
      // use tsconfig copied to tmp instead of src
      const src = await aotBuilder.compile(path.join('tmp', 'tsconfig.' + cli.build + '.json'));

      const main = await aotBuilder.compileMain();
      await log.message('copied main.ts');
      const buildOptimize = await ls(path.normalize('out-tsc/**/*.component.js')).forEach(function (file) {
        let content = fs.readFileSync(file, 'utf-8');
        fs.writeFileSync(file, buildOptimizer({ content: content }).content);
      });

      await mv(path.normalize('out-tsc/tmp'), path.normalize('out-tsc/src'));

      if (cli.program.rollup) { 
        const prepRxjs = await this.buildRxjsFESM();
        const bundle = await rollupBuilder.bundle(path.join(config.projectRoot, 'rollup.config.js'));
        const optimize = await closureBuilder.bundle();
      } else {
        // use fesm instead for closure compiler, results in smaller bundles
        const prepRxjs = await this.buildRxjsFESM();
        const bundle = await closureBuilder.bundle();
      }

      this.post();

    })();


  }

  pre() {

    let build = () => {

      cp('-R', path.join('src', 'environments'), 'config');
      rm('-rf', path.join('tmp'));
      rm('-f', path.join('src', 'environments', 'environment.ts'));
      if (cli.env === 'dev') {
        cp(path.join('config', 'environments', 'environment.ts'), path.join('src', 'environments', 'environment.ts'));
      } else {
        cp(path.join('config', 'environments', 'environment.' + cli.env + '.ts'), path.join('src', 'environments', 'environment.ts'));
      }
      if (util.hasHook('pre')) {

        config.projects[config.project].architect.build.hooks[cli.env].pre(process.argv).then(() => {
          if (cli.program.webpack === true) {
            exec('ng build --prod', { shell: true, stdio: 'inherit' }, () => {
              this.post();
            });
          } else {
            this.build();
          }
        });

      } else {

        if (cli.program.webpack === true) {
          exec('ng build --prod', { shell: true, stdio: 'inherit' }, () => {
            this.post();
          });
        } else {
          this.build();
        }

      }

    }

    if (cli.program.clean !== false) {

      util.cleanBuild().then(() => {
        build();
      });
    } else {

      build();
    }

    this.emitter.emit('hook', {
      payload: {
        step: 'pre'
      }
    });

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

      let rollup;

      if (process.platform === 'win32') {
        rollup = spawn('cmd', ['/c', path.join(config.projectRoot, 'node_modules', '.bin', 'rollup'), '-c', path.join('config', 'rollup.rxjs.js')]);
      } else {
        rollup = spawn(path.join(config.projectRoot, 'node_modules', '.bin', 'rollup'), ['-c', path.join('config', 'rollup.rxjs.js')]);
      }

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

  transformSCSSPathstoCSS() {
    
    return Promise.all(ls(path.normalize('tmp/**/*.ts')).map((filePath) => {
        return new Promise((res, rej) => {

            try {
                sed('-i', '.scss', '.css', filePath);
                res();
            } catch(err) {
                rej(err);
            }
         
        });
    }));

  }


  post() {

    if (!cli.program.keepTempFiles) {
      rm('-rf', 'tmp');
      rm('-rf', 'out-tsc');
      rm('-rf', 'dist/out-tsc');
    }

    const bundleArtifact = path.join(this.outputPath, 'bundle.es2015.js');
    // return environments to rightful place
    if (fs.existsSync(path.join('config', 'environments'))) {
      rm('-rf', path  .join('src', 'environments'));
      cp('-R', path.join('config', 'environments'), 'src');
      rm('-rf', path.join('config', 'environments'));
    }

    if (util.hasHook('post')) config.projects[config.project].architect.build.hooks[cli.env].post(process.argv);
    if (fs.existsSync(path.normalize('main.js'))) {
      rm(path.normalize('main.js'));
    }
    if (fs.existsSync(bundleArtifact)) {
      rm(bundleArtifact);
    }

    log.break();

    if (cli.program.webpack === true) {
      ls(this.outputPath).forEach((file) => {
        log.logFileStats(path.join(this.outputPath, file));
      });
    } else {
      log.buildStats(this.startTime);
    }

    if (util.hasArg('serve')) {
      util.serve(cli.program.watch);
    }

    this.emitter.emit('hook', {
      payload: {
        step: 'post'
      }
    });
  }

}

module.exports = ProdBuild;
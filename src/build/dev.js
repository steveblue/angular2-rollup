const path           = require('path');
const fs             = require('fs');
const spawn          = require('child_process').spawn;
const Build          = require('./index.js');
const SassBuilder    = require('./../style/sass.js');
const PostCSSBuilder = require('./../style/postcss.js');
const TSBuilder      = require('./../compile/tsc.js');
const AOTBuilder     = require('./../compile/ngc.js');
const Watcher        = require('./../watch.js');
const util           = require('./../util.js');
const log            = require('./../log.js');
const config         = require('./../config');
const cli            = require('./../../cli.config.json');
const chokidar       = require('chokidar');
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
      const libCheck = config.lib && config.lib[cli.env];
      (async () => {
        const lib = await util.copyLib(libCheck ? config.lib[cli.env] : config.dep['lib'],
                                       libCheck ? config.lib.src : config.dep.src,
                                       libCheck ? config.lib.dist : config.dep.dist);
      })();

      (async () => {
        const publicDir = await util.copyDir(path.normalize(config.src + '/public'), config.build);
        const template = await util.formatIndex(path.normalize(config.src + '/public/index.html'));
      })();

      (async () => {
        const sass = await sassBuilder.batch(ls(path.normalize(config.src + '/**/*.scss')));
        const postcss = await postcssBuilder.batch(sass);
        log.message('styled components');
        if (!fs.existsSync(path.join(config.build, 'main.js'))) {
          (async () => {
            const main = await aotBuilder.compileMain().then((res) => {
                log.message('compiled main.js');
                log.message('@angular/compiler...');
            });
          })();
        }
        const src = await aotBuilder.compile(path.join('src', 'tsconfig.' + cli.env + '.json'));
        this.post();
      })();

    }

    pre() {

      let build = () => {

        //cp(path.normalize('config/postcss.' + cli.env + '.js'), 'postcss.config.js');
  

        if (util.hasHook('pre')) {

          config.buildHooks[cli.env].pre(process.argv).then(() => {

            if (cli.program.webpack === true) {
              spawn('ng',['serve'], {shell: true, stdio: 'inherit'});
            } else {
              this.build();
            }

          });

        } else {

          if (cli.program.webpack === true) {
            spawn('ng',['serve'], {shell: true, stdio: 'inherit'});
          } else {
            this.build();
          }

        }

      }

      if (cli.program.clean) {
        util.cleanBuild().then(()=>{
          build();
        });
      } else {
        build();
      }

    }

    post() {

      if (cli.program.env) {
        cp(path.join(this.outputPath, 'src', 'environments', 'environment.' + cli.program.env + '.js'), path.join(this.outputPath, 'src', 'environments', 'environment.js'));
        cp(path.join(this.outputPath, 'src', 'environments', 'environment.' + cli.program.env + '.js.map'), path.join(this.outputPath, 'src', 'environments', 'environment.js.map'));
        cp(path.join(this.outputPath, 'src', 'environments', 'environment.' + cli.program.env + '.ngsummary.json'), path.join(this.outputPath, 'src', 'environments', 'environment.ngsummary.json'));
      } 

      if (util.hasHook('post')) config.buildHooks[cli.env].post(process.argv);

      if (cli.program.watch === true && util.hasHook('watch') && config.buildHooks[cli.env].watch.dist) {
        const watcher = new Watcher();
        const distWatcher = chokidar.watch([this.outputPath], {
          ignored: /[\/\\]\./,
          persistent: true
        }).on('change', filePath => {

          config.buildHooks[cli.env].watch.dist(filePath);

        });
      }

      if (!util.hasArg('watch')) {
        log.break();
        ls(this.outputPath).forEach((file) => {
          log.logFileStats(path.join(this.outputPath, file));
        });
      }

      if (util.hasArg('serve')) {
        util.serve(cli.program.watch);
      }

    }

}

module.exports = DevBuild;
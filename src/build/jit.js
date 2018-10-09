require('shelljs/global');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const Build = require('./index.js');
const SassBuilder = require('./../style/sass.js');
const PostCSSBuilder = require('./../style/postcss.js');
const TSBuilder = require('./../compile/tsc.js');
const Watcher = require('./../watch.js');
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

class JitBuild extends Build {

  constructor() {
    super();
  }

  init() {
    this.pre();
  }


  build() {

    const env = 'dev';
    const sassBuilder = new SassBuilder({ dist: config.build });
    const postcssBuilder = new PostCSSBuilder({ dist: config.build, sourceMap: true });
    const jitBuilder = new TSBuilder();
    const libCheck = config.projects[config.project].architect.build.options.lib && config.projects[config.project].architect.build.options.lib[cli.env];

    (async () => {
      const lib = await util.copyLib(libCheck ? config.projects[config.project].architect.build.options.lib[cli.env] : config.lib['dev'],
        libCheck ? config.projects[config.project].architect.build.options.lib.src : config.lib.src,
        libCheck ? config.projects[config.project].architect.build.options.lib.dist : config.lib.dist);
    })();

    (async () => {
      const html = await util.copyBatch(ls(path.normalize(config.src + '/app/**/*.html')), config.build);
      const publicDir = await util.copyDir(path.normalize(config.src + '/public'), config.build);
      const template = await util.formatIndex(path.normalize(config.src + '/public/index.html'));
    })();

    (async () => {
      const sass = await sassBuilder.batch(ls(path.normalize(config.src + '/**/*.scss')));
      const postcss = await postcssBuilder.batch(sass);
      const src = await jitBuilder.compile(path.join('src', 'tsconfig.' + cli.build + '.json'));
      this.post();
    })();

    //if (!fs.existsSync(path.join(config.build, 'main.js'))) {
    (async () => {
      const main = await jitBuilder.compileMain().then((res) => {
        log.message('compiled main.js');
      });
    })();
    //}

  }

  pre() {

    if (cli.program.clean === true) {
      util.cleanBuild();
    }

    if (util.hasHook('pre')) {

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

  }

  post() {

    if (cli.program.env) {
      cp(path.join(this.outputPath, 'src', 'environments', 'environment.' + cli.program.env + '.js'), path.join(this.outputPath, 'src', 'environments', 'environment.js'));
      cp(path.join(this.outputPath, 'src', 'environments', 'environment.' + cli.program.env + '.js.map'), path.join(this.outputPath, 'src', 'environments', 'environment.js.map'));
      cp(path.join(this.outputPath, 'src', 'environments', 'environment.' + cli.program.env + '.ngsummary.json'), path.join(this.outputPath, 'src', 'environments', 'environment.ngsummary.json'));
    }

    if (util.hasHook('post')) config.projects[config.project].architect.build.hooks[cli.env].post(process.argv);

    if (cli.program.watch === true) {
      const watcher = new Watcher();
    }

    if (cli.program.watch === true && util.hasHook('watch') && config.projects[config.project].architect.build.hooks[cli.env].watch.dist) {

      const distWatcher = chokidar.watch([this.outputPath], {
        ignored: /[\/\\]\./,
        persistent: true
      }).on('change', filePath => {

        config.projects[config.project].architect.build.hooks[cli.env].watch.dist(filePath);

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

    this.emitter.emit('hook', {
      payload: {
        step: 'post'
      }
    });


  }

}

module.exports = JitBuild;
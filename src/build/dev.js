const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const spawn = require('child_process').spawn;
const Build = require('./index.js');
const SassBuilder = require('./../style/sass.js');
const PostCSSBuilder = require('./../style/postcss.js');
const AOTBuilder = require('./../compile/ngc.js');
const Watcher = require('./../watch.js');
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');

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
    const libCheck =
      config.projects[config.project].architect.build.options.lib &&
      config.projects[config.project].architect.build.options.lib[cli.build];

    (async () => {
      const lib = await util.copyLib(
        libCheck ? config.projects[config.project].architect.build.options.lib[cli.build] : config.lib['dev'],
        libCheck ? config.projects[config.project].architect.build.options.lib.src : config.lib.src,
        libCheck ? config.projects[config.project].architect.build.options.lib.dist : config.lib.dist
      );
    })();

    (async () => {
      const publicDir = await util.copyDir(path.normalize(config.src + '/public'), config.build);
      const template = await util.formatIndex(path.normalize(config.src + '/public/index.html'));
    })();

    (async () => {
      const sass = await sassBuilder.batch(ls(path.normalize(config.src + '/**/*.scss')));
      const postcss = await postcssBuilder.batch(sass);
      await log.message('styled components');
      const main = await aotBuilder.compileMain();
      await log.message('compiled main.js');
      const src = await aotBuilder.compile(path.join('src', 'tsconfig.' + cli.build + '.json'));
      this.post();
    })();
  }

  pre() {
    let build = () => {
      //cp(path.normalize('config/postcss.' + cli.build + '.js'), 'postcss.config.js');

      if (util.hasHook('pre')) {
        config.projects[config.project].architect.build.hooks[cli.build].pre(process.argv).then(() => {
          if (cli.program.webpack === true) {
            spawn('ng', ['serve'], { shell: true, stdio: 'inherit' });
          } else {
            this.build();
          }
        });
      } else {
        if (cli.program.webpack === true) {
          spawn('ng', ['serve'], { shell: true, stdio: 'inherit' });
        } else {
          this.build();
        }
      }
    };

    if (cli.program.clean) {
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

  post() {


    if (!fs.existsSync(path.join(this.outputPath, 'environments'))) {
      mkdir('-p', path.join(this.outputPath, 'environments'));
    }

    if (cli.env === 'dev') {
      cp(
        path.join(this.outputPath, 'src', 'environments', 'environment.js'),
        path.join(this.outputPath, 'environments', 'environment.js')
      );
      cp(
        path.join(this.outputPath, 'src', 'environments', 'environment.js.map'),
        path.join(this.outputPath, 'environments', 'environment.js.map')
      );
      if (fs.existsSync(path.join(this.outputPath, 'src', 'environments', 'environment.ngsummary.json'))) {
        cp(
          path.join(this.outputPath, 'src', 'environments', 'environment.ngsummary.json'),
          path.join(this.outputPath, 'environments', 'environment.ngsummary.json')
        );
      }
    } else {
      cp(
        path.join(this.outputPath, 'src', 'environments', 'environment.' + cli.env + '.js'),
        path.join(this.outputPath, 'environments', 'environment.js')
      );

      fs.readFile(path.join(this.outputPath, 'environments', 'environment.js'), 'utf-8', (err, stdout) => {
        stdout = stdout.replace(`environment.${cli.env}.js`, 'environment.js');
        fs.writeFile(path.join(this.outputPath, 'environments', 'environment.js'), stdout, 'utf-8', () => {});
      });

      cp(
        path.join(this.outputPath, 'src', 'environments', 'environment.' + cli.env + '.js.map'),
        path.join(this.outputPath, 'environments', 'environment.js.map')
      );

      fs.readFile(path.join(this.outputPath, 'environments', 'environment.js.map'), 'utf-8', (err, stdout) => {
        stdout = stdout.replace(`environment.${cli.env}.ts`, 'environment.ts');
        stdout = stdout.replace(`environment.${cli.env}.js`, 'environment.js');
        fs.writeFile(path.join(this.outputPath, 'environments', 'environment.js.map'), stdout, 'utf-8', () => {});
      });

      cp(
        path.join(this.outputPath, 'src', 'environments', 'environment.' + cli.env + '.ngsummary.json'),
        path.join(this.outputPath, 'environments', 'environment.ngsummary.json')
      );

      fs.readFile(path.join(this.outputPath, 'environments', 'environment.ngsummary.json'), 'utf-8', (err, stdout) => {
        stdout = stdout.replace(`environment.${cli.env}`, 'environment');
        fs.writeFile(path.join(this.outputPath, 'environments', 'environment.ngsummary.json'), stdout, 'utf-8', () => {});
      });

    }

    if (util.hasHook('post')) config.projects[config.project].architect.build.hooks[cli.build].post(process.argv);

    if (cli.program.watch === true) {
      const watcher = new Watcher();
    }

    if (cli.program.watch === true && util.hasHook('watch') && config.projects[config.project].architect.build.hooks[cli.build].watch.dist) {
      const distWatcher = chokidar
        .watch([this.outputPath], {
          ignored: /[\/\\]\./,
          persistent: true,
        })
        .on('change', filePath => {
          config.projects[config.project].architect.build.hooks[cli.build].watch.dist(filePath);
        });
    }

    if (!util.hasArg('watch')) {
      log.break();
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

module.exports = DevBuild;

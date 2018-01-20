"use strict";

require('shelljs/global');

const fs          = require('fs');
const path        = require('path');
const logger       = require('./build.log.js');

const log = logger.log;
const warn = logger.warn;
const alert = logger.alert;
const colors = logger.colors;

let lib = false;
let useVersion = '^5.0.0';
let hasWarning = false;
let dynamicRoutes = false;
let isLazy = false;
let isElectron = false;
let isBare = false;
let hasRollup = false;
let hasServer = false;

const projectPath = path.dirname(process.cwd()) + '/' + path.basename(process.cwd());
const cliPath = path.dirname(fs.realpathSync(__filename));

const files = [
    '.editorconfig',
    'gitignore.scaffold',
    '.npmignore',
    'closure.conf',
    'closure.externs.js',
    'karma-test-shim.js',
    'karma.conf.js',
    'main.prod.ts',
    'main.prod.js',
    'main.ts',
    'ngr.config.js',
    'postcss.dev.js',
    'postcss.jit.js',
    'postcss.prod.js',
    'protractor.config.js',
    'tsconfig.dev.json',
    'tsconfig.jit.json',
    'tsconfig.prod.json',
    'tslint.json'
];


/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg)=>{
  if (arg.includes('lib')) {
      lib = true;
  }
  if (arg.includes('version')) {
      useVersion = arg.toString().split('=')[1];
  }
  if (arg.includes('electron')) {
      isElectron = arg.toString().split('=')[1];
  }
  if (arg.includes('lazy')) {
      isLazy = arg.toString().split('=')[1];
  }
  if (arg.includes('dynamicRoutes')) {
      dynamicRoutes = arg.toString().split('=')[1];
  }
  if (arg.includes('rollup')) {
      hasRollup = arg.toString().split('=')[1];
  }
  if (arg.includes('server')) {
      hasServer = arg.toString().split('=')[1];
  }
  if (arg.includes('bare')) {
      isBare = arg.toString().split('=')[1];
  }
});


/*

  Copy Tasks

- file: Copies a file to /dist

*/

const copy = {
    file: (p) => {
        if (fs.existsSync(projectPath + '/' + p.split('/')[p.split('/').length - 1])) {
            warn(p.split('/')[p.split('/').length - 1] + ' already exists');
            hasWarning = true;
        } else {
            cp('-R', p, projectPath + '/');
            log(p.split('/')[p.split('/').length - 1], 'copied to', projectPath + '/');
        }
    },
    scaffold: (files) => {

        if (fs.existsSync(projectPath + '/' + 'src')) {
            warn('src' + ' already exists');
            hasWarning = true;
        } else {
            mkdir(projectPath + '/' + 'src');
            if (isBare) {
                cp('-R', cliPath + '/src-bare/*', projectPath + '/' + 'src');
            } else {
                cp('-R', cliPath + '/src/*', projectPath + '/' + 'src');
            }
            log('src', 'copied to', projectPath + '/');
        }

        if (fs.existsSync(projectPath + '/' + '.gitignore')) {
            warn('.gitignore' + ' already exists');
            hasWarning = true;
        } else {
            cp(cliPath + '/' + 'gitignore.scaffold', projectPath + '/' + '.gitignore');
            log('.gitignore', 'copied to', projectPath + '/');
        }

        files.forEach((filename)=>{
            if (filename === 'gitignore.scaffold') {
                return;
            }
            copy.file(cliPath + '/' + filename);
        });

        if (hasRollup) {
            if (fs.existsSync(projectPath + '/rollup.config.js')) {
                warn('rollup.config.js' + ' already exists');
                hasWarning = true;
            } else {
                cp(cliPath + '/rollup.config.js', projectPath + '/rollup.config.js');
                log('rollup.config.js', 'copied to', projectPath + '/');
            }
        }

        if (hasServer) {
            if (fs.existsSync(projectPath + '/server.js')) {
                warn('server.js' + ' already exists');
                hasWarning = true;
            } else {
                cp(cliPath + '/server.config.dev.js', projectPath + '/server.config.dev.js');
                cp(cliPath + '/server.config.prod.js', projectPath + '/server.config.prod.js');
                cp(cliPath + '/server.js', projectPath + '/server.js');
                cp(cliPath + '/router.js', projectPath + '/router.js');
                log('server.config.dev.js', 'copied to', projectPath + '/');
                log('server.config.prod.js', 'copied to', projectPath + '/');
                log('server.js', 'copied to', projectPath + '/');
                log('router.js', 'copied to', projectPath + '/');
            }
        }

        if (isLazy || dynamicRoutes) {
            if (fs.existsSync(projectPath + '/src/public/system.config.js')) {
                rm(projectPath + '/src/public/system.config.js');
            }
            if (fs.existsSync(projectPath + '/src/public/system.import.js')) {
                rm(projectPath + '/src/public/system.import.js');
            }
            if (fs.existsSync(projectPath + '/src/app/app.routes.ts')) {
                rm(projectPath + '/src/app/app.routes.ts');
            }
            if (fs.existsSync(projectPath + '/closure.lazy.conf')) {
                rm(projectPath + '/closure.lazy.conf');
            }
            if (fs.existsSync(projectPath + '/lazy.config.json')) {
                rm(projectPath + '/lazy.config.json');
            }
            rm(projectPath + '/src/app/app.module.ts');
            rm(projectPath + '/src/app/shared/components/lazy/lazy.module.ts');
            cp(cliPath + '/closure.lazy.conf', projectPath + '/closure.lazy.conf');
            log('closure.lazy.conf', 'copied to', projectPath + '/');
            cp(cliPath + '/lazy.config.json', projectPath + '/lazy.config.json');
            log('lazy.config.json', 'copied to', projectPath + '/');
            cp(cliPath + '/src-lazy/app/app.module.ts', projectPath + '/src/app/app.module.ts');
            cp(cliPath + '/src-lazy/app/app.routes.ts', projectPath + '/src/app/app.routes.ts');
            cp(cliPath + '/src-lazy/public/system.polyfill.js', projectPath + '/src/public/system.polyfill.js');
            cp(cliPath + '/src-lazy/public/system.config.js', projectPath + '/src/public/system.config.js');
            cp(cliPath + '/src-lazy/public/system.config.prod.js', projectPath + '/src/public/system.config.prod.js');
            cp(cliPath + '/src-lazy/public/system.import.js', projectPath + '/src/public/system.import.js');
            cp(cliPath + '/src-lazy/app/shared/components/lazy/lazy.module.ts', projectPath + '/src/app/shared/components/lazy/lazy.module.ts');
            cp(cliPath + '/src-lazy/app/shared/components/lazy/lazy.routes.ts', projectPath + '/src/app/shared/components/lazy/lazy.routes.ts');

        }

        if (dynamicRoutes) {
            if (fs.existsSync(projectPath + '/src/app/app.config.ts')) {
                rm(projectPath + '/src/app/app.config.ts');
            }
            rm(projectPath + '/src/app/app.module.ts');
            rm(projectPath + '/lazy.config.json');
            cp(cliPath + '/lazy.routes.config.json', projectPath + '/lazy.config.json');
            log('lazy.routes.config.json', 'copied to', projectPath + '/');
            cp(cliPath + '/src-dynamic-route/app/app.config.ts', projectPath + '/src/app/app.config.ts');
            cp(cliPath + '/src-dynamic-route/app/app.module.ts', projectPath + '/src/app/app.module.ts');
        }

        if (isElectron) {
            rm(projectPath + '/src/public/index.html');
            cp(cliPath + '/src-electron/public/index.html', projectPath + '/src/public/index.html');
            cp(cliPath + '/src-electron/public/renderer.js', projectPath + '/src/public/renderer.js');
            cp(cliPath + '/main.electron.js', projectPath + '/main.electron.js');
            log('renderer.js', 'copied to', projectPath + '/src/public/');
            log('main.electron.js', 'copied to', projectPath + '/');
        }

    }
};

let init = function() {


    copy.scaffold(files.filter((filename) => {

        if (parseInt(useVersion.split('.')[0]) >= 5 && filename.includes('main.prod.ts')) {
            return false;
        }
        else {
            return true;
        }

    }));

    if (lib == false) {

        rm('-rf', projectPath + '/src/lib');

    } else {
        mkdir('-p', projectPath + '/src/lib');
        cp('-R', cliPath + '/src/lib/*', projectPath + '/src/lib');
    }


    if (isBare === 'true') {
        fs.readFile(projectPath + '/tsconfig.dev.json', (err, contents) => {
            let script = JSON.parse(contents);
            script.files = script.files.splice(script.files.indexOf('./src/app/shared/components/lazy/lazy.module.ts') - 1, 1);
            fs.writeFile(projectPath + '/tsconfig.dev.json', JSON.stringify(script, null, 4));
        });
        fs.readFile(projectPath + '/tsconfig.prod.json', (err, contents) => {
            let script = JSON.parse(contents);
            script.files = script.files.splice(script.files.indexOf('./ngfactory/src/app/shared/components/lazy/lazy.module.ts') - 1, 1);
            fs.writeFile(projectPath + '/tsconfig.prod.json', JSON.stringify(script, null, 4));
        });
    }


    if (hasWarning == true) {
        warn('Please move or delete existing files to prevent overwiting.');
        return;
    }


    cp(cliPath + '/package.scaffold.json', projectPath+'/package.json');


    fs.readFile(cliPath + '/package.scaffold.json', (err, script) => {

        if (err) throw err;

        script = JSON.parse(script);
        script.name = path.basename(process.cwd());


        Object.keys(script.dependencies).forEach((dep) => {
            if (dep.includes('@angular')) {
                script.dependencies[dep] = useVersion;
            }
        });

        Object.keys(script.devDependencies).forEach((dep) => {
            if (dep.includes('@angular')) {
                script.devDependencies[dep] = useVersion;
            }
        });

        fs.writeFile(projectPath+'/package.json', JSON.stringify(script, null, 4), function (err) {
            if (err) log(err);
            alert('ngr scaffolded ' + path.basename(process.cwd()) + ' with', 'angular@'+ useVersion);
            alert(colors.green('run npm install or yarn install'));
            alert('ngr build dev --watch --serve', 'to start up Express server, enable a watcher, and build Angular for development');
            alert('ngr build prod --serve', 'to compile your project AOT for production, start up Express server');
            alert('ngr --help', 'for more CLI commands' );
        });

      });


};


init();

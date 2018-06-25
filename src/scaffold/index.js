
require('shelljs/global');

const path = require('path');
const fs = require('fs');
const detectInstalled = require('detect-installed');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const colors = require('colors');
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');
const npmExists = detectInstalled.sync('npm');
const srcDir = cli.program.src || path.normalize(config.cliRoot + '/src/scaffold/src');

class Scaffold {

    constructor(cliName, path) {
        this.path = path || config.processRoot;
        this.cliName = cliName;
    }

    formatCreateMsg(msg) {
        msg = msg.replace('create ', colors.dim('CREATE '));
        if ((msg.match(/\([0-9]* bytes\)/))) {
            msg = msg.replace((msg.match(/\([0-9]* bytes\)/)[0]), colors.cyan((msg.match(/\([0-9]* bytes\)/)[0])));
        }
        return msg;
    }

    basic() {

        exec('ng new '+this.cliName+ ' --skip-install --style scss',
             {}, (error, stdout, stderr) => {

                stdout.split('\n').forEach((msg) => { console.log(this.formatCreateMsg(msg.trim())); });

                 if (stdout.includes('initialized git.')) {

                    console.log("Project '"+this.cliName+"' is merging with angular-rollup.");
                    rm('-rf', path.join(this.path, 'src', 'app'));

                    util.copyDir(srcDir, path.join(this.path, 'src'), {silent: true});
                    ls(srcDir).forEach((file) => {
                        console.log(this.formatCreateMsg('create '+path.join(this.cliName, 'src', file)+' ('+fs.statSync(path.join(srcDir,file)).size+' bytes)'));
                    });

                    // find and replace cli name in new tsconfig
                    sed('-i', '{{projectName}}', this.cliName, path.join(this.cliName, 'src', 'tsconfig.dev.json'));
                    sed('-i', '{{projectName}}', this.cliName, path.join(this.cliName, 'src', 'tsconfig.jit.json'));
                    sed('-i', '{{projectName}}', this.cliName, path.join(this.cliName, 'src', 'tsconfig.rollup.json'));

                    util.copyDir(path.normalize(config.cliRoot + '/src/scaffold/root'), this.path, {silent: true});

                    ls(path.normalize(config.cliRoot + '/src/scaffold/root')).forEach((file) => {
                        console.log(this.formatCreateMsg('create '+path.join(this.cliName, file)+' ('+fs.statSync(path.join(config.cliRoot, 'src', 'scaffold', 'root', file)).size+' bytes)'));
                    });

                    // replace project name in rollup.config
                    sed('-i', '{{projectName}}', this.cliName, path.join(this.cliName, 'rollup.config.js'));
                    sed('-i', '{{projectName}}', this.cliName, path.join(this.cliName, 'closure.rollup.conf'));

                    // find and replace cli name in ngr.config.js
                    sed('-i', '{{projectName}}', this.cliName, path.join(this.cliName, 'ngr.config.js'));

                    this.editPackage();

                }


             });

    }

    editPackage() {

        fs.readFile(path.normalize(config.cliRoot + '/src/scaffold/standalone/package.json'), 'utf8',
        (err, data) => {
            let cliPackage = JSON.parse(data);
            fs.readFile(path.join(this.path, 'package.json'),
                        'utf8', (err, data) => {

                let projectPackage = JSON.parse(data);
                projectPackage.dependencies = Object.assign(cliPackage.dependencies, projectPackage.dependencies);
                projectPackage.devDependencies = Object.assign(cliPackage.devDependencies, projectPackage.devDependencies);
                projectPackage.scripts = Object.assign(cliPackage.scripts, projectPackage.scripts);

                fs.writeFileSync(path.join(this.path, 'package.json'), JSON.stringify(projectPackage, null, 4));
                this.editCli();
            });
        });

    }

    editCli() {

        fs.readFile(path.join(this.path, 'angular.json'), 'utf8',
        (err, data) => {

            let cliConfig = JSON.parse(data);
            cliConfig.projects[cli.program.new].architect.build.options.assets = [
                "src/public/favicon.ico",
                {
                    "glob": "**/*",
                    "input": "src/public/assets",
                    "output": "./assets/"
                }
            ];
            cliConfig.projects[cli.program.new].architect.build.options.styles = ['src/style/style.scss'];
            cliConfig.projects[cli.program.new].architect.test.options.assets = [
                "src/public/favicon.ico",
                {
                    "glob": "**/*",
                    "input": "src/public/assets",
                    "output": "./assets/"
                }
            ];
            cliConfig.projects[cli.program.new].architect.test.options.styles = ['src/style/style.scss'];
            fs.writeFileSync(path.join(this.path, 'angular.json'), JSON.stringify(cliConfig, null, 4));
            rm(path.join(this.path, 'src', 'styles.scss'));
            rm(path.join(this.path, 'src', 'favicon.ico'));
            rm('-rf', path.join(this.path, 'src', 'assets'));
            this.done();
        });

    }

    done() {

        if (cli.program.skipInstall === true) {

            log.message(util.getFileName(this.path) + ' is ready');
            log.break();

        } else {

            if (cli.program.yarn) {
                spawn('yarn', ['install'], { cwd: this.path, shell: true, stdio: 'inherit'});
            }
            else if (npmExists) {
                log.message('npm install');
                spawn('npm', ['install'], { cwd: this.path, shell: true, stdio: 'inherit'});
            }

        }


    }

}

module.exports = Scaffold;
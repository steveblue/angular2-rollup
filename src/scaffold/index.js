
require('shelljs/global');

const path = require('path');
const fs = require('fs');
const prettier = require("prettier");
const detectInstalled = require('detect-installed');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const colors = require('colors');
const util = require('./../util.js');
const log = require('./../log.js');
const config = require('./../config');
const cli = require('./../../cli.config.json');
const npmExists = detectInstalled.sync('npm');
const srcDir = path.normalize(config.cliRoot + '/src/scaffold/src');
const remoteSrc = cli.program.src || false;
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

        exec('ng new ' + this.cliName + ' --skip-install --style scss',
            {}, (error, stdout, stderr) => {

                stdout.split('\n').forEach((msg) => { console.log(this.formatCreateMsg(msg.trim())); });

                if (stdout.includes('initialized git.')) {

                    console.log("Project '" + this.cliName + "' is merging with @angular/cli.");
                    rm('-rf', path.join(this.path, 'src', 'app'));

                    util.copyDir(srcDir, path.join(this.path, 'src'), { silent: true });

                    if (cli.program.ivy) {
                        util.copyDir(path.normalize(config.cliRoot + '/src/scaffold/ivy/src'), path.join(this.path, 'src'), { silent: true });
                        rm(path.join(this.path, 'src', 'app', 'app.routes.ts'));
                        rm('-rf', path.join(this.path, 'src', 'app', 'shared'));
                    }

                    ls(srcDir).forEach((file) => {
                        console.log(this.formatCreateMsg('create ' + path.join(this.cliName, 'src', file) + ' (' + fs.statSync(path.join(srcDir, file)).size + ' bytes)'));
                    });

                    // find and replace cli name in new tsconfig
                    sed('-i', /{{projectName}}/g, this.cliName, path.join(this.cliName, 'src', 'tsconfig.dev.json'));
                    sed('-i', /{{projectName}}/g, this.cliName, path.join(this.cliName, 'src', 'tsconfig.jit.json'));
                    sed('-i', /{{projectName}}/g, this.cliName, path.join(this.cliName, 'src', 'index.html'));
                    sed('-i', /{{projectName}}/g, this.cliName, path.join(this.cliName, 'src', 'public', 'index.html'));

                    util.copyDir(path.normalize(config.cliRoot + '/src/scaffold/root'), this.path, { silent: true });


                    ls(path.normalize(config.cliRoot + '/src/scaffold/root')).forEach((file) => {
                        console.log(this.formatCreateMsg('create ' + path.join(this.cliName, file) + ' (' + fs.statSync(path.join(config.cliRoot, 'src', 'scaffold', 'root', file)).size + ' bytes)'));
                    });

                    // replace project name in rollup.config
                    sed('-i', /{{projectName}}/g, this.cliName, path.join(this.cliName, 'rollup.config.js'));
                    sed('-i', /{{projectName}}/g, this.cliName, path.join(this.cliName, 'closure.rollup.conf'));

                    // replace project name in README
                    sed('-i', /{{projectName}}/g, this.cliName, path.join(this.cliName, 'README.md'));

                    // find and replace cli name in ngr.config.js
                    sed('-i', /{{projectName}}/g, this.cliName, path.join(this.cliName, 'ngr.config.js'));


                    if (cli.program.prettier) {
                        cp(path.normalize(config.cliRoot + '/src/scaffold/pretty/.prettierrc'), this.path);
                    }

                    if (cli.program.ssl) {
                        cp(path.normalize(config.cliRoot + '/src/scaffold/ssl/server.js'), path.join(this.path, 'backend'));
                    }

                    this.editPackage();
                    // this.addProjectToConfig(this.cliName, '', this.path);
                    this.editCliConfig();

                    if (remoteSrc) {
                        // list of files to migrate if they exist from older angular-rollup or @angular/cli 6.0.0 project
                        this.migrateProject(remoteSrc);

                    }

                } else {
                    log.error('git may not be installed properly on this device or something else is preventing angular-rollup from merging with @angular/cli.')
                }


            });

    }

    sortObject(obj) {
        return Object.keys(obj)
            .sort().reduce((a, v) => {
                a[v] = obj[v];
                return a;
            }, {});
    }



    editPackage() {

        fs.readFile(path.normalize(config.cliRoot + '/src/scaffold/standalone/package.json'), 'utf8',
            (err, data) => {
                let cliPackage = JSON.parse(data);
                fs.readFile(path.join(this.path, 'package.json'),
                    'utf8', (err, data) => {

                        let projectPackage = JSON.parse(data);
                        projectPackage.dependencies = this.sortObject(Object.assign(cliPackage.dependencies, projectPackage.dependencies));
                        projectPackage.devDependencies = this.sortObject(Object.assign(cliPackage.devDependencies, projectPackage.devDependencies));
                        projectPackage.scripts = this.sortObject(Object.assign(cliPackage.scripts, projectPackage.scripts));

                        if (cli.program.angularVersion) {
                            for (let prop in projectPackage.dependencies) {
                                if (prop.includes('@angular') && !prop.includes('@angular-devkit')) {
                                    projectPackage.dependencies[prop] = cli.program.angularVersion;
                                }
                            }
                            for (let prop in projectPackage.devDependencies) {
                                if (prop.includes('@angular') && !prop.includes('@angular-devkit')) {
                                    projectPackage.devDependencies[prop] = cli.program.angularVersion;
                                }
                            }

                        }

                        if (cli.program.angularVersion &&
                            cli.program.angularVersion[0] === '7' ||
                            cli.program.angularVersion &&
                            cli.program.angularVersion.includes('~7') ||
                            cli.program.angularVersion &&
                            cli.program.angularVersion.includes('^7') ||
                            cliPackage.dependencies['@angular/core'].includes('~7')) {
                            projectPackage.devDependencies['tsickle'] = '0.33.1';
                            projectPackage.devDependencies['typescript'] = '3.1.3';
                        }

                        if (cli.program.prettier) {

                            let prettierDependencies = {
                                "prettier": "^1.14.2",
                                "pretty-quick": "^1.6.0",
                                "npm-run-all": "^4.1.3",
                                "husky": "^0.14.3"
                            };

                            let prettierScripts = {
                                "format:fix": "pretty-quick --staged",
                                "precommit": "run-s format:fix lint"
                            };

                            projectPackage.dependencies = this.sortObject(Object.assign(prettierDependencies, projectPackage.dependencies));
                            projectPackage.scripts = this.sortObject(Object.assign(prettierScripts, projectPackage.scripts));

                        }

                        fs.writeFileSync(path.join(this.path, 'package.json'), JSON.stringify(projectPackage, null, 4));

                    });
            });

    }

    addProjectToConfig(projectName, projectConfig, projectDir) {

        let configPath = '';
        if (fs.existsSync(path.join(projectDir || config.projectRoot, 'ngr.config.js'))) {
            configPath = path.join(projectDir || config.projectRoot, 'ngr.config.js')
        } else {
            log.warn('ngr.config.js does not exist in this project root directory');
            return;
        }

        fs.readFile(configPath, 'utf8',
            (err, data) => {
                let configFile = data.toString().split('\n').map((str) => { return str.trim(); });
                let project = '';

                if (configFile.indexOf('projects: {') === -1) {
                    project += 'projects : {';
                }

                project += `
                "${projectName}" : {
                    "root": "${projectConfig.root || ''}",
                    "sourceRoot": "${projectConfig.sourceRoot || 'src'}",
                    "projectType": "${projectConfig.projectType || 'application'}",
                    "configFile": "${projectConfig.configFile || ''}",
                    "architect": {
                        "build": {
                            "builder": "angular-rollup",
                            "options": {
                                "outputPath": "dist/${projectName}",
                                "styles": [
                                    "src/style/style.scss"
                                ],
                                "stylePreprocessorOptions": {
                                    "includePaths": ["src/style"],
                                    "outputStyle": "expanded",
                                    "sourceComments": true
                                }
                            }
                        }
                    }
                }

                `
                if (configFile.indexOf('projects: {') === -1) {
                    project += '},';
                    configFile.splice(configFile.indexOf('lib: {'), 0, project);
                } else {
                    project += ',';
                    configFile.splice(configFile.indexOf('projects: {') + 1, 0, project);
                }


                configFile = configFile.join('\n');
                configFile = prettier.format(configFile, {
                    tabWidth: 2,
                    parser: 'babylon'
                })

                fs.writeFileSync(configPath, configFile);
            });
    }

    editCliConfig() {

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
                spawn('yarn', ['install'], { cwd: this.path, shell: true, stdio: 'inherit' });
            }
            else if (npmExists) {
                log.message('npm install');
                spawn('npm', ['install'], { cwd: this.path, shell: true, stdio: 'inherit' });
            }

        }


    }

    migrateProject(remoteSrc) {
        if (fs.existsSync(path.join(remoteSrc, '../package.json'))) {
            util.copyFile(path.join(remoteSrc, '../package.json'), path.join(this.path, 'package.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../angular.json'))) {
            util.copyFile(path.join(remoteSrc, '../angular.json'), path.join(this.path, 'angular.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../ngr.config.js'))) {
            util.copyFile(path.join(remoteSrc, '../ngr.config.js'), path.join(this.path, 'ngr.config.js.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../closure.conf'))) {
            util.copyFile(path.join(remoteSrc, '../closure.conf'), path.join(this.path, 'closure.conf.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../closure.externs.js'))) {
            util.copyFile(path.join(remoteSrc, '../closure.externs.js'), path.join(this.path, 'closure.externs.js.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../karma.conf.js'))) {
            util.copyFile(path.join(remoteSrc, '../karma.conf.js'), path.join(this.path, 'karma.conf.js.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../karma-test-shim.js'))) {
            util.copyFile(path.join(remoteSrc, '../karma-test-shim.js'), path.join(this.path, 'karma-test-shim.js.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../protractor.config.js'))) {
            util.copyFile(path.join(remoteSrc, '../protractor.config.js'), path.join(this.path, 'protractor.config.js.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../tslint.json'))) {
            util.copyFile(path.join(remoteSrc, '../tslint.json'), path.join(this.path, 'tslint.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../tsconfig.json'))) {
            util.copyFile(path.join(remoteSrc, '../tsconfig.json'), path.join(this.path, 'tsconfig.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../tsconfig.jit.json'))) {
            util.copyFile(path.join(remoteSrc, '../tsconfig.jit.json'), path.join(this.path, 'src', 'tsconfig.jit.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../tsconfig.dev.json'))) {
            util.copyFile(path.join(remoteSrc, '../tsconfig.dev.json'), path.join(this.path, 'src', 'tsconfig.dev.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../tsconfig.prod.json'))) {
            util.copyFile(path.join(remoteSrc, '../tsconfig.prod.json'), path.join(this.path, 'src', 'tsconfig.prod.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../main.ts'))) {
            util.copyFile(path.join(remoteSrc, '../main.ts'), path.join(this.path, 'src', 'main.ts.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../README.md'))) {
            util.copyFile(path.join(remoteSrc, '../README.md'), path.join(this.path, 'src', 'README.md.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../CHANGELOG.md'))) {
            util.copyFile(path.join(remoteSrc, '../CHANGELOG.md'), path.join(this.path, 'src', 'CHANGELOG.md.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'tsconfig.jit.json'))) {
            util.copyFile(path.join(remoteSrc, 'tsconfig.jit.json'), path.join(this.path, 'src', 'tsconfig.jit.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'tsconfig.dev.json'))) {
            util.copyFile(path.join(remoteSrc, 'tsconfig.dev.json'), path.join(this.path, 'src', 'tsconfig.dev.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'tsconfig.prod.json'))) {
            util.copyFile(path.join(remoteSrc, 'tsconfig.prod.json'), path.join(this.path, 'src', 'tsconfig.prod.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'tsconfig.app.json'))) {
            util.copyFile(path.join(remoteSrc, 'tsconfig.app.json'), path.join(this.path, 'src', 'tsconfig.app.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'tsconfig.spec.json'))) {
            util.copyFile(path.join(remoteSrc, 'tsconfig.spec.json'), path.join(this.path, 'src', 'tsconfig.spec.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'tslint.json'))) {
            util.copyFile(path.join(remoteSrc, 'tslint.json'), path.join(this.path, 'src', 'tslint.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, '../tslint.json'))) {
            util.copyFile(path.join(remoteSrc, '../tslint.json'), path.join(this.path, 'tslint.json.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'browserslist'))) {
            util.copyFile(path.join(remoteSrc, 'browserslist'), path.join(this.path, 'src', 'browserslist.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'main.ts'))) {
            util.copyFile(path.join(remoteSrc, 'main.ts'), path.join(this.path, 'src', 'main.ts.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'index.html'))) {
            util.copyFile(path.join(remoteSrc, 'index.html'), path.join(this.path, 'src', 'index.html.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'main.ts'))) {
            util.copyFile(path.join(remoteSrc, 'main.ts'), path.join(this.path, 'src', 'main.ts.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'karma.conf.js'))) {
            util.copyFile(path.join(remoteSrc, 'karma.conf.js'), path.join(this.path, 'src', 'karma.conf.js.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'polyfill.ts'))) {
            util.copyFile(path.join(remoteSrc, 'polyfill.ts'), path.join(this.path, 'src', 'polyfill.ts.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'test.ts'))) {
            util.copyFile(path.join(remoteSrc, 'test.ts'), path.join(this.path, 'src', 'test.ts.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'public'))) {
            util.copyDir(path.join(remoteSrc, 'public'), path.join(this.path, 'src', 'public'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'environments'))) {
            util.copyDir(path.join(remoteSrc, 'environments'), path.join(this.path, 'src', 'environments'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'app'))) {
            util.copyDir(path.join(remoteSrc, 'app'), path.join(this.path, 'src', 'app'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'style'))) {
            util.copyDir(path.join(remoteSrc, 'style'), path.join(this.path, 'src', 'style'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'styles'))) {
            util.copyDir(path.join(remoteSrc, 'styles'), path.join(this.path, 'src', 'style'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'styles.css'))) {
            util.copyFile(path.join(remoteSrc, 'styles.css'), path.join(this.path, 'src', 'styles.css.bak'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'public', 'index.html'))) {
            util.copyFile(path.join(remoteSrc, 'public', 'index.html'), path.join(this.path, 'src', 'public', 'index.html.bak'), { silent: true, force: true });
            util.copyFile(path.join(srcDir, 'public', 'index.html'), path.join(this.path, 'src', 'public', 'index.html'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'public', 'system.config.js'))) {
            util.copyFile(path.join(remoteSrc, 'public', 'system.config.js'), path.join(this.path, 'src', 'public', 'system.config.js.bak'), { silent: true, force: true });
            util.copyFile(path.join(srcDir, 'public', 'system.config.js'), path.join(this.path, 'src', 'public', 'system.config.js'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'public', 'system.config.prod.js'))) {
            util.copyFile(path.join(remoteSrc, 'public', 'system.config.prod.js'), path.join(this.path, 'src', 'public', 'system.config.prod.js.bak'), { silent: true, force: true });
            util.copyFile(path.join(srcDir, 'public', 'system.config.prod.js'), path.join(this.path, 'src', 'public', 'system.config.prod.js'), { silent: true, force: true });
        }
        if (fs.existsSync(path.join(remoteSrc, 'public', 'system.import.js'))) {
            util.copyFile(path.join(remoteSrc, 'public', 'system.import.js'), path.join(this.path, 'src', 'public', 'system.import.js.bak'), { silent: true, force: true });
            util.copyFile(path.join(srcDir, 'public', 'system.import.js'), path.join(this.path, 'src', 'public', 'system.import.js'), { silent: true, force: true });
        }
    }

}

module.exports = Scaffold;
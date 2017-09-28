"use strict";

require('shelljs/global');

const fs = require('fs');
const path = require('path');
const colors = require('colors');
const clim = require('clim');
const cons = clim();
const utils = require('./build.utils.js');
const prompt = require('prompt');

let lib = false;
let useVersion = null;
let cliVersion = null;
let includeLib = false;
let hasWarning = false;
let dynamicRoutes = false;

let validateEntry = function (value) {
    if (value === 'true' ||
        value === true ||
        value === 'lazy' ||
        value === 'Y' ||
        value === 'y' ||
        value === 'YES' ||
        value === 'yes') {
        return true;
    } else {
        return false;
    }
};

const files = [
    'src',
    '.editorconfig',
    '.gitignore',
    '.npmignore',
    'build.config.js',
    'closure.conf',
    'closure.lazy.conf',
    'closure.externs.js',
    'karma-test-shim.js',
    'karma.conf.js',
    'lazy.config.json',
    'main.prod.js',
    'main.prod.ts',
    'main.ts',
    'postcss.dev.js',
    'postcss.jit.js',
    'postcss.prod.js',
    'protractor.config.js',
    'rollup.config.js',
    'rollup.config.lib.js',
    'rollup.config.lib-es5.js',
    'rollup.config.lib-umd.js',
    'router.js',
    'server.config.dev.js',
    'server.config.prod.js',
    'server.js',
    'tsconfig.dev.json',
    'tsconfig.jit.json',
    'tsconfig.prod.json',
    'tsconfig.prod.lazy.json',
    'tsconfig.lib.json',
    'tsconfig.lib.es5.json',
    'jsconfig.json',
    'tslint.json'
];


/* Test for arguments the ngr cli spits out */

process.argv.forEach((arg) => {
    if (arg.includes('version')) {
        useVersion = arg.toString().split('=')[1];
    }
    if (arg.includes('cliVersion')) {
        console.log(arg.toString());
        cliVersion = arg.toString().split('=')[1];
    }
    if (arg.includes('lib')) {
        includeLib = arg.toString().split('=')[1];
    }
    if (arg.includes('dynamicRoutes')) {
        dynamicRoutes = arg.toString().split('=')[1];
    }
});

/*

  Copy Tasks

- file: Copies a file to /dist

*/

const copy = {
    file: (filePath, fileName) => {
        if (fs.existsSync(utils.config.projectRoot + filePath)) {
            utils.warn(filePath + ' already exists');
            hasWarning = true;
        } else {
            cp(utils.config.cliRoot + '/' + filePath, utils.config.projectRoot + '/' + filePath);
            utils.log(fileName, 'copied to', path.dirname(process.cwd()) + '/' + path.basename(process.cwd()) + '/');
        }
    },
    newFile: (p) => {
        if (fs.existsSync(path.dirname(process.cwd()) + '/' + path.basename(process.cwd()) + '/' + p.split('/')[p.split('/').length - 1])) {
            utils.warn(p.split('/')[p.split('/').length - 1] + ' already exists');
            hasWarning = true;
        } else {
            cp('-R', p, path.dirname(process.cwd()) + '/' + path.basename(process.cwd()) + '/');
            utils.log(p.split('/')[p.split('/').length - 1], 'copied to', path.dirname(process.cwd()) + '/' + path.basename(process.cwd()) + '/');
        }
    },
    scaffold: (files) => {
        files.forEach((filename) => {
            copy.newFile(path.dirname(fs.realpathSync(__filename)) + '/' + filename);
        })
    }
};


let init = function () {

    if (includeLib) {

        copy.scaffold(files.filter((filename) => {
            return filename.includes('lib') === true;
        }));

        cp('-R', utils.config.cliRoot + '/src/lib/', utils.config.projectRoot + '/src');

    } 

    if (dynamicRoutes) {

        utils.console.warn(utils.colors.red('Update to dynamic routing will overwrite existing files'));
        utils.console.log('It is recommended to backup lazy.config.json, app.routes.ts, and app.module.ts prior to update');
        prompt.message = '';
        prompt.start();
        prompt.get(['Are you sure?'], function (err, result) {

            if (validateEntry(result['Are you sure?'])) {
                if (fs.existsSync(utils.config.projectRoot + '/src/app/app.config.ts')) {
                    rm(utils.config.projectRoot + '/src/app/app.config.ts');
                }
                if (fs.existsSync(utils.config.projectRoot + '/lazy.config.json')) {
                    rm(utils.config.projectRoot + '/lazy.config.json');
                }
                if (fs.existsSync(utils.config.projectRoot + '/src/app/app.routes.ts')) {
                    rm(utils.config.projectRoot + '/src/app/app.routes.ts');
                }
                rm(utils.config.projectRoot + '/src/app/app.module.ts');
                cp(utils.config.cliRoot + '/lazy.routes.config.json', utils.config.projectRoot + '/lazy.config.json');
                cp(utils.config.cliRoot + '/src-dynamic-route/app/app.routes.ts', utils.config.projectRoot + '/src/app/app.routes.ts');
                cp(utils.config.cliRoot + '/src-dynamic-route/app/app.config.ts', utils.config.projectRoot + '/src/app/app.config.ts');
                cp(utils.config.cliRoot + '/src-dynamic-route/app/app.module.ts', utils.config.projectRoot + '/src/app/app.module.ts');
                utils.console.log('routes updated to support dynamic config');
            }

        });

    }

    if (cliVersion) {

        utils.log('Review changes to angular-rollup in the CHANGELOG (https://github.com/steveblue/angular2-rollup/blob/master/CHANGELOG.md)');

        if (cliVersion === '1.0.0-beta.10') {

            copy.file('lazy.config.json', 'lazy.config.json');
            copy.file('src/public/system.polyfill.js', 'system.polyfill.js');
            copy.file('src/public/system.import.js', 'system.import.js');
            copy.file('src/public/system.config.prod.js', 'system.config.prod.js');
            copy.file('src/public/index.html', 'index.html');
            
            if (hasWarning) {
                utils.warn('Please move or delete existing files to prevent overwiting. Use a diff tool to track project specific changes.');
                return;
            }

        }
    }

    if (!useVersion) {
        return;
    }

    fs.readFile(path.dirname(process.cwd()) + '/' + path.basename(process.cwd()) + '/package.json', (err, script) => {

        if (err) throw err;
        
        script = JSON.parse(script);

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

        fs.writeFile(path.dirname(process.cwd()) + '/' + path.basename(process.cwd()) + '/package.json', JSON.stringify(script, null, 4), function (err) {
            if (err) log(err);
            utils.alert('ngr updated ' + colors.bold(colors.red('@angular')), '=> ' + colors.bold(colors.white(useVersion)) );
            utils.alert('Please run npm install');
        });

    });


};


init();
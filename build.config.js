require('shelljs/global');
const fs = require('fs');
const path = require('path');

module.exports = {
    dep: {
        lib: [
            'core-js/client/shim.min.js',
            'core-js/client/shim.min.js.map',
            'systemjs/dist/system.js',
            'zone.js/dist/zone.js',
            'reflect-metadata/Reflect.js',
            'reflect-metadata/Reflect.js.map',
            'tslib/tslib.js',
            '@angular',
            'rxjs'
        ],
        prodLib: [
            'core-js/client/shim.min.js',
            'core-js/client/shim.min.js.map',
            'systemjs/dist/system.js',
            'zone.js/dist/zone.js'
        ],
        src: './node_modules',
        dist: './build/lib'
    },
    clean:{
      files:[],
      folders:[]
    },
    style: {
        sass: {
            dev: {
                includePaths: ['src/style/'],
                outputStyle: 'expanded',
                sourceComments: true
            },
            lib: {
                includePaths: ['src/style/'],
                outputStyle: 'expanded',
                sourceComments: false
            },
            prod: {
                includePaths: ['src/style/'],
                outputStyle: 'expanded',
                sourceComments: false
            }
        }
    },
    src: 'src',
    build: 'build',
    dist: 'dist',
    lib: 'src/lib',
    libFilename: 'default-lib',
    classPrefix: 'My',
    componentPrefix: 'cmp',
    directivePrefix: 'dir',
    buildHooks: {
        dev: {
            pre: () => {

                return new Promise((res, rej) => {
                    cp('lazy.config.json', './build/lazy.config.json');
                    res();
                });

            }
        }
    }
}

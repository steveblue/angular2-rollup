const spawn = require('child_process').spawn;
const fs = require('fs');

module.exports = {
    dep: {
        lib: [
            'core-js/client/shim.min.js',
            'core-js/client/shim.min.js.map',
            'zone.js/dist/zone.min.js',
            'web-animations-js/web-animations.min.js',
            'web-animations-js/web-animations.min.js.map',
            'ie9-oninput-polyfill/ie9-oninput-polyfill.js',
            'angular-polyfills/dist/blob.js',
            'angular-polyfills/dist/classList.js',
            'angular-polyfills/dist/formdata.js',
            'angular-polyfills/dist/intl.js',
            'angular-polyfills/dist/typedarray.js',
            'console-polyfill/index.js',
            'systemjs/dist/system.js',
            'systemjs/dist/system.js.map',
            'reflect-metadata/Reflect.js',
            'reflect-metadata/Reflect.js.map',
            'tslib/tslib.js',
            '@angular',
            'rxjs'
        ],
        prodLib: [
            'core-js/client/shim.min.js',
            'zone.js/dist/zone.min.js',
            'web-animations-js/web-animations.min.js',
            'ie9-oninput-polyfill/ie9-oninput-polyfill.js',
            'angular-polyfills/dist/blob.js',
            'angular-polyfills/dist/classList.js',
            'angular-polyfills/dist/formdata.js',
            'angular-polyfills/dist/intl.js',
            'angular-polyfills/dist/typedarray.js',
            'console-polyfill/index.js',
            'systemjs/dist/system.js'
        ],
        src: './node_modules',
        dist: './build/lib'
    },
    style: {
        files: [
            'src/style/style.scss'
        ],
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
    classPrefix: 'My',
    componentPrefix: 'cmp',
    directivePrefix: 'dir',
    buildHooks: {
        prod: {
            pre: () => {
                return new Promise((res) => {

                    let editFile = (filePath) => {
                        return new Promise((res) => {
                            fs.readFile(filePath, 'utf-8', (error, stdout, stderr) => {
                                let package = JSON.parse(stdout);
                                package.es2015 = package.es2015.replace('_esm2015', '_fesm2015');
                                console.log('editing ' + filePath);
                                fs.writeFile(filePath, JSON.stringify(package), () => {
                                    res(filePath);
                                })
                            });
                        });
                    };

                    let rollup = spawn('npm', ['run', 'rollup:closure'], {shell: true, stdio: 'inherit'});
                    rollup.on('exit', () => {
                        console.log('rollup completed');
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
        }
    }
}

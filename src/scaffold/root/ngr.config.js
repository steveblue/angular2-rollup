const spawn = require('child_process').spawn;
const fs = require('fs');

module.exports = {
    defaultProject: '{{projectName}}',
    projects: {
        '{{projectName}}': {
            root: '',
            sourceRoot: 'src',
            projectType: 'application',
            configFile: '',
            architect: {
                build: {
                    builder: 'angular-rollup',
                    options: {
                        outputPath: 'dist/{{projectName}}',
                        styles: ['src/style/style.scss'],
                        stylePreprocessorOptions: {
                            includePaths: ['src/style'],
                            outputStyle: 'expanded',
                            sourceComments: true
                        },
                        lib: {
                            dev: [
                                "core-js/client/shim.min.js",
                                "core-js/client/shim.min.js.map",
                                "zone.js/dist/zone.min.js",
                                "web-animations-js/web-animations.min.js",
                                "web-animations-js/web-animations.min.js.map",
                                "ie9-oninput-polyfill/ie9-oninput-polyfill.js",
                                "angular-polyfills/dist/blob.js",
                                "angular-polyfills/dist/classList.js",
                                "angular-polyfills/dist/formdata.js",
                                "angular-polyfills/dist/intl.js",
                                "angular-polyfills/dist/typedarray.js",
                                "console-polyfill/index.js",
                                "systemjs/dist/system.js",
                                "systemjs/dist/system.js.map",
                                "reflect-metadata/Reflect.js",
                                "tslib/tslib.js",
                                "@angular",
                                "rxjs"
                            ],
                            prod: [
                                "core-js/client/shim.min.js",
                                "zone.js/dist/zone.min.js",
                                "web-animations-js/web-animations.min.js",
                                "ie9-oninput-polyfill/ie9-oninput-polyfill.js",
                                "angular-polyfills/dist/blob.js",
                                "angular-polyfills/dist/classList.js",
                                "angular-polyfills/dist/formdata.js",
                                "angular-polyfills/dist/intl.js",
                                "angular-polyfills/dist/typedarray.js",
                                "console-polyfill/index.js",
                                "systemjs/dist/system.js"
                            ],
                            src: "node_modules",
                            dist: "dist/{{projectName}}/lib"
                        }

                    },
                    hooks: {
                        prod: {
                            pre: () => {
                                return new Promise((res) => {
                                    // put togic in here for before the production build
                                    res();
                                });
                            },
                            post: () => {
                                return new Promise((res) => {
                                    // put togic in here for after the production build
                                    res();
                                });
                            }
                        }
                    }
                }
            }
        }
    }
}

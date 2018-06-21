const spawn = require('child_process').spawn;
const fs = require('fs');

module.exports = {
    buildHooks: {
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
            "reflect-metadata/Reflect.js.map",
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
    },
    style: {
        sass: {
            dev: {
                includePaths: ["src/style/"],
                outputStyle: "expanded",
                sourceComments: true
            },
            lib: {
                includePaths: ["src/style/"],
                outputStyle: "expanded",
                sourceComments: false
            },
            prod: {
                includePaths: ["src/style/"],
                outputStyle: "expanded",
                sourceComments: false
            }
        }
    }
}

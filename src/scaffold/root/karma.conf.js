const path = require('path');

module.exports = function (config) {
  config.set({

    basePath: './',

    frameworks: ['jasmine'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-remap-coverage')
    ],
    client: {
      clearContext: false
    },


    remapCoverageReporter: {
      'text-summary': null, // to show summary in console
      html: './coverage/html',
      cobertura: './coverage/cobertura.xml'
    },

    files: [
      // Polyfills.
      'node_modules/core-js/client/shim.min.js',

      'node_modules/reflect-metadata/Reflect.js',

      // System.js for module loading
      'node_modules/systemjs/dist/system.src.js',

      // Zone.js dependencies
      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/long-stack-trace-zone.js',
      'node_modules/zone.js/dist/proxy.js',
      'node_modules/zone.js/dist/sync-test.js',
      'node_modules/zone.js/dist/jasmine-patch.js',
      'node_modules/zone.js/dist/async-test.js',
      'node_modules/zone.js/dist/fake-async-test.js',

      // RxJs.
      { pattern: 'node_modules/rxjs/**/*.js', included: false, watched: false },
      { pattern: 'node_modules/rxjs/**/*.js.map', included: false, watched: false },


      { pattern: 'karma-test-shim.js', included: true, watched: true },

      // paths loaded via module imports
      // Angular itself
      { pattern: 'node_modules/@angular/**/*.js', included: false, watched: true },
      { pattern: 'node_modules/@angular/**/*.js.map', included: false, watched: true },

      // Our built application code
      { pattern: 'build/**/*.js', included: false, watched: true },

      // paths loaded via Angular's component compiler
      // (these paths need to be rewritten, see proxies section)
      { pattern: 'build/**/*.html', included: false, watched: true },
      { pattern: 'build/**/*.css', included: false, watched: true },

      // paths to support debugging with source maps in dev tools
      { pattern: 'src/**/*.ts', included: false, watched: true },
      //{pattern: 'build/**/*.js.map', included: false, watched: false}
    ],

    // proxied base paths
    proxies: {
      // required for component assests fetched by Angular's compiler
      "/app/": "/build/src/"
    },

    preprocessors: {
      'build/src/app/shared/lib/**/*.component.js': ['coverage']
    },

    coverageReporter: {
      type: 'in-memory'
    },

    reporters: ['progress', 'kjhtml', 'coverage', 'remap-coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  })
}

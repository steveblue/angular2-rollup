// #docregion
// /*global jasmine, __karma__, window*/
Error.stackTraceLimit = 0; // "No stacktrace"" is usually best for app testing.

// Uncomment to get full stacktrace output. Sometimes helpful, usually not.
// Error.stackTraceLimit = Infinity; //

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

var builtPath = '/base/build/src/app/';

__karma__.loaded = function () { };

function isJsFile(path) {
  return path.slice(-3) == '.js';
}

function isSpecFile(path) {
  return /\.spec\.(.*\.)?js$/.test(path);
}

function isBuiltFile(path) {
  return isJsFile(path) && (path.substr(0, builtPath.length) == builtPath);
}

var allSpecFiles = Object.keys(window.__karma__.files)
  .filter(isSpecFile)
  .filter(isBuiltFile);

System.config({
  baseURL: '/base/build/',
  // Extend usual application package list with test folder
  packages: { 'testing': { main: 'index.js', defaultExtension: 'js' } },

  // Assume npm: is set in `paths` in systemjs.config
  // Map the angular testing umd bundles
  map: {
    'app' : '/build',
    '@angular/core/testing': 'lib/@angular/core/bundles/core-testing.umd.js',
    '@angular/common/testing': 'lib/@angular/common/bundles/common-testing.umd.js',
    '@angular/compiler/testing': 'lib/@angular/compiler/bundles/compiler-testing.umd.js',
    '@angular/platform-browser/testing': 'lib/@angular/platform-browser/bundles/platform-browser-testing.umd.js',
    '@angular/platform-browser-dynamic/testing': 'lib/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic-testing.umd.js',
    '@angular/http/testing': 'lib/@angular/http/bundles/http-testing.umd.js',
    '@angular/router/testing': 'lib/@angular/router/bundles/router-testing.umd.js',
    '@angular/forms/testing': 'lib/@angular/forms/bundles/forms-testing.umd.js',
    'rxjs': 'node_modules/rxjs'
  },
});

System.import('/base/build/system.config.js')
  .then(initTestBed)
  .then(initTesting);


function initTestBed(){
  return Promise.all([
    System.import('/base/build/lib/@angular/core/bundles/core-testing.umd.js'),
    System.import('/base/build/lib/@angular/platform-browser-dynamic/bundles/platform-browser-dynamic-testing.umd.js')
  ])

  .then(function (providers) {
    var coreTesting    = providers[0];
    var browserTesting = providers[1];

    coreTesting.TestBed.initTestEnvironment(
      browserTesting.BrowserDynamicTestingModule,
      browserTesting.platformBrowserDynamicTesting());
  })
}

// Import all spec files and start karma
function initTesting () {
  return Promise.all(
    allSpecFiles.map(function (moduleName) {
      return System.import(moduleName);
    })
  )
  .then(__karma__.start, __karma__.error);
}

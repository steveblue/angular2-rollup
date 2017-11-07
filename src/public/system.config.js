(function (global) {

  System.config({
    paths: {
      // paths serve as alias
      'npm:': 'node_modules/',
      'lib:': 'lib/'
    },
    // map tells the System loader where to look for things
    map: {
      // our app is within the app folder
      app: '.',
      // angular bundles
      '@angular/animations': 'lib:@angular/animations/bundles/animations.umd.js',
      '@angular/animations/browser':'lib:@angular/animations/bundles/animations-browser.umd.js',
      '@angular/platform-browser/animations': 'lib:@angular/platform-browser/bundles/platform-browser-animations.umd.js',
      '@angular/core': 'lib:@angular/core/bundles/core.umd.js',
      '@angular/common': 'lib:@angular/common/bundles/common.umd.js',
      '@angular/compiler': 'lib:@angular/compiler/bundles/compiler.umd.js',
      '@angular/platform-browser': 'lib:@angular/platform-browser/bundles/platform-browser.umd.js',
      '@angular/platform-browser-dynamic': 'lib:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
      '@angular/common/http': 'lib:@angular/common/bundles/common-http.umd.js',
      '@angular/http': 'lib:@angular/http/bundles/http.umd.js',
      '@angular/router': 'lib:@angular/router/bundles/router.umd.js',
      '@angular/forms': 'lib:@angular/forms/bundles/forms.umd.js',
      // other libraries
      'rxjs/Observable': 'lib:rxjs/observable',
      'rxjs/observable': 'lib:rxjs/observable',
      'rxjs/Subject': 'lib:rxjs/Subject',
      'rxjs/BehaviorSubject': 'lib:rxjs/BehaviorSubject',
      'rxjs/Subscription': 'lib:rxjs/Subscription',
      'rxjs/Observer': 'lib:rxjs/Observer',
      'rxjs/operators': 'lib:rxjs/operators/index.js',
      'rxjs/operator': 'lib:rxjs/operator',
      'rxjs/add/operator': 'lib:rxjs/add/operator',
      'rxjs/add/operators': 'lib:rxjs/operators',
      'rxjs/util/EmptyError': 'lib:rxjs/util/EmptyError',
      'tslib': 'lib:tslib/tslib.js'
    },
    // packages tells the System loader how to load when no filename and/or no extension
    packages: {
      app: {
        main: './main.js',
        defaultExtension: 'js'
      },
      rxjs: {
        defaultExtension: 'js'
      }
    }
  });

})(this);

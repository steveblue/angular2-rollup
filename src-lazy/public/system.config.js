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
      'rxjs/Subject': 'lib:rxjs/Subject',
      'rxjs/BehaviorSubject': 'lib:rxjs/BehaviorSubject',
      'rxjs/Observable': 'lib:rxjs/Observable',
      'rxjs/observable/merge': 'lib:rxjs/observable/merge',
      'rxjs/observable/of': 'lib:rxjs/observable/of',
      'rxjs/observable/from': 'lib:rxjs/observable/from',
      'rxjs/observable/interval': 'lib:rxjs/observable/interval',
      'rxjs/observable/forkJoin': 'lib:rxjs/observable/forkJoin',
      'rxjs/observable/fromPromise': 'lib:rxjs/observable/fromPromise',
      'rxjs/operators': 'lib:rxjs/operators/index.js',
      'rxjs/operator/share': 'lib:rxjs/operator/share',
      'rxjs/operator/concatMap': 'lib:rxjs/operator/concatMap',
      'rxjs/operator/filter': 'lib:rxjs/operator/filter',
      'rxjs/operator/map': 'lib:rxjs/operator/map',
      'rxjs/operator/catch': 'lib:rxjs/operator/catch',
      'rxjs/operator/every': 'lib:rxjs/operator/every',
      'rxjs/operator/first': 'lib:rxjs/operator/first',
      'rxjs/operator/last': 'lib:rxjs/operator/last',
      'rxjs/operator/reduce': 'lib:rxjs/operator/reduce',
      'rxjs/operator/mergeAll': 'lib:rxjs/operator/mergeAll',
      'rxjs/operator/concatAll': 'lib:rxjs/operator/concatAll',
      'rxjs/operator/mergeMap': 'lib:rxjs/operator/mergeMap',
      'rxjs/util/EmptyError': 'lib:rxjs/util/EmptyError',
      'tslib': 'lib:tslib/tslib.js',
      // map lazyloaded modules for DEV, replace '.ngfactory' with '' for JIT
      'shared/components/lazy/lazy.module.ngfactory': 'src/app/shared/components/lazy/lazy.module.ngfactory.js'
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

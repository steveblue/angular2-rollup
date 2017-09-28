(function (global) {
  System.defaultJSExtensions = true;
  System.config({
    'map': {
      'bundle': 'bundle.js',
      'polyfill': 'system.polyfill.js'
    },
    'meta': {
      'bundle': {
        deps: ['polyfill']
      }
    }
  });
})(this);


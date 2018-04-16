(function (global) {
  System.defaultJSExtensions = true;
  System.config({
    'map': {
      'bundle': 'bundle.js',
      'vendor': 'vendor.js'
    },
    'meta': {
      'bundle': {
        deps: []
      }
    }
  });
})(this);


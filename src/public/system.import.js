System.import('system.config.prod.js').then(function () {
  System.import('polyfill').then(function () {
    Promise.all([
      System.import('bundle')
    ]);
  }).catch(console.error.bind(console));
}).catch(console.error.bind(console));

System.import('system.config.prod.js').then(function () {
  Promise.all([
    System.import('bundle')
  ]);
}).catch(console.error.bind(console));

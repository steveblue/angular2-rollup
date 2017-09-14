module.exports = {
    dep: {
        lib: [
            'angular-srcs/shims_for_IE.js',
            'core-js',
            'reflect-metadata',
            'zone.js',
            'systemjs',
            '@angular',
            'rxjs'
        ],
        prodLib: [
            'angular-srcs/shims_for_IE.js',
            'core-js/client/shim.min.js',
            'core-js/client/shim.min.js.map',
            'systemjs/dist/system.js',
            'zone.js/dist/zone.js'
        ],
        src: './node_modules',
        dist: './build/lib'
    },
    clean:{
      files:[],
      folders:[]
    },
    src: 'src',
    build: 'build',
    dist: 'dist',
    lib: 'src/lib',
    libFilename: 'default-lib',
    globalCSSFilename: 'style.css',
    classPrefix: 'My',
    componentPrefix: 'cmp',
    directivePrefix: 'dir'
}

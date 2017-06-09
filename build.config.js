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
        src: './node_modules',
        dist: './build/lib'
    },
    clean:{
      files:[],
      folders:[]
    },
    rootDir: __dirname,
    src: 'src',
    build: 'build',
    dist: 'dist',
    lib: 'src/lib',
    libFilename: 'default-lib',
    classPrefix: 'My',
    componentPrefix: 'cmp',
    directivePrefix: 'dir'
}

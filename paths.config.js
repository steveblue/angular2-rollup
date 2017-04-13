module.exports = {
    dep: {
        lib: [
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
    src: 'src',
    build: 'build',
    dist: 'dist',
    lib: 'src/lib',
    libFilename: 'default-lib'
}

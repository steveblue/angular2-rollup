module.exports = ctx => ({
    plugins: {
        'postcss-discard-comments': ctx.env === 'prod' ? {} : false,
        'autoprefixer': { remove: false },
        'postcss-csso': ctx.env === 'prod' ? {} : false
    }
})

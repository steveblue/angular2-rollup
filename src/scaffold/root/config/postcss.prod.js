module.exports = {
  plugins: [
    require('postcss-discard-comments')(),
    require('postcss-filter-gradient')(),
    require('autoprefixer')({ remove: false }),
    require('css-mqpacker')({ sort: true }),
    require('postcss-csso')({})
  ]
}


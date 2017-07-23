

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AotPlugin = require('@ngtools/webpack').AotPlugin;


module.exports = {
  entry: 'main.prod.js',
  output: {
    path: '/build',
    filename: 'bundle.js'
  },
  resolve: {
     extensions: ['.ts', '.js', '.html', '.css'],
  },

  module: {
            rules: [
                { test: /\.html$/, use: 'raw-loader' },
                { test: /\.css$/, use: 'raw-loader' },
            ]
        },
  plugins: [
    new AotPlugin({
      tsConfigPath: './tsconfig.webpack.json',
      entryModule: './tmp/app/app.module#AppModule'
    })
  ]
}
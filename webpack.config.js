const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/js/main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'js'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: []
          }
        }
      }
    ]
  },
  plugins: [
    // after minification so terser does not strip it
    new webpack.BannerPlugin({
      banner: '@generated: js/main.js is built from src/js (npm run build:js)',
      stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT
    })
  ],
  resolve: {
    extensions: ['.js']
  },
  mode: process.env.NODE_ENV || 'development'
};

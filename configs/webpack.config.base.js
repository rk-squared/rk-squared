/**
 * Base webpack config used across other specific configs
 */

const path = require('path');
const webpack = require('webpack');
const { dependencies } = require('../package.json');

module.exports = {
  externals: [...Object.keys(dependencies || {})],

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loaders: ['react-hot-loader/webpack', 'ts-loader'],
        exclude: /node_modules/,
      },
    ],
  },

  output: {
    path: path.join(__dirname, '..', 'app'),
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2',
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
    }),

    new webpack.NamedModulesPlugin(),
  ],
};

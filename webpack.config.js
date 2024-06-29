const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './app.js', // Adjust the entry point as needed
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'), // Adjust the output directory as needed
  },
  externals: nodeExternals(),
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
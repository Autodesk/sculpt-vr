const fs = require('fs');
const webpack = require('webpack');
const config = require('./webpack.config');
const CopyWebpackPlugin = require('copy-webpack-plugin');


config.plugins.push(
    new webpack.optimize.CommonsChunkPlugin(
        /* chunkName: */ 'vendor',
        /* filename: */ 'vendor.[hash].js'
    ),

    new webpack.optimize.DedupePlugin(),

    new CopyWebpackPlugin([{ from: 'resources', to: '../dist/resources' },
                            { from: 'models', to: '../dist/models'} ])
);

module.exports = config;
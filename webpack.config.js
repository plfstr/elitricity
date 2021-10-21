const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
    entry: {
        app: {
            import: './src/index.js',
            dependOn: 'dompurify'
        },
        dompurify: ['dompurify']
    },
    mode: 'production',
    output: {
        path: `${__dirname}/dist`,
        filename: '[name].js',
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'style.css'
        })
    ],
    module: {
        rules: [
            {
            test: /\.css$/i,
            use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
        ],
    },
    optimization: {
      minimizer: [
        `...`, new CssMinimizerPlugin(),
      ],
    },
};
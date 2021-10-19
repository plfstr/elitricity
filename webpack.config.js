const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: './src/index.js',
    mode: 'production',
    output: {
        path: `${__dirname}/dist`,
        filename: 'main.js',
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
};
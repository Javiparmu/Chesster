const MiniCssExtractPlugin = require('mini-css-extract-plugin');

let mode = 'development';
let target = 'web';

if (process.env.NODE_ENV === 'production') {
    mode = 'production';
    target = "browserslist";
}

module.exports = {
    mode: mode,

    module: {
        rules: [
            {
                test: /\.py$/,
                use: [{ loader: 'python-webpack-loader' }]
            },
            {
                test: /\.s?css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', "postcss-loader", "sass-loader"],
            },
            {
                test: /\.mp3$/,
                loader: 'file-loader'
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            }
        ]
    },

    plugins: [new MiniCssExtractPlugin()],

    devtool: "source-map",
    devServer: {
        contentBase: './dist',
        hot: true,
    },
}
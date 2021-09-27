const TerserPlugin = require("terser-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const path = require("path");

module.exports = {
    devtool: "source-map",
    entry: "./src/core/core.js",
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "[name].bundle.js",
        chunkFilename: "[name].[contenthash:7].bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"],
                            plugins: [
                                "@babel/plugin-syntax-dynamic-import",
                                "@babel/plugin-transform-runtime",
                                "es6-promise",
                                "@babel/plugin-proposal-class-properties",
                                "@babel/plugin-proposal-export-default-from",
                            ],
                        },
                    },
                ],
            },
        ],
    },
    plugins: [new ESLintPlugin()],
    node: {
        global: false,
        __filename: false,
        __dirname: false,
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                extractComments: false,
            }),
        ],
    },
};

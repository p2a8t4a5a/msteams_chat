const path = require("path");
const WebpackBar = require("webpackbar");

const node_externals = require("webpack-node-externals");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const output_path = path.resolve(__dirname, 'dist');

module.exports = [
    {
        entry: './src/app/main',
        mode: 'development',
        target: 'electron-main',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader'
                },
                // {
                //     test: /\.html$/,
                //     use: 'html-loader'
                // }
            ]
        },
        resolve: {
            extensions: [
                '.ts'
            ]
        },
        externals: [
            //'axios'
            node_externals()
        ],
        /*externals: {
            axios: 'commonjs axios'
        },*/
        output: {
            filename: 'index.js',
            path: output_path
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    {from: path.resolve(__dirname, 'src/ui'), to: path.resolve(output_path, 'ui')}
                ]
            }),
            new WebpackBar({
                name: "Main"
            })
        ]
    },
];

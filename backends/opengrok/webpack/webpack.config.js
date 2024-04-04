const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { Compilation, sources } = require("webpack");

module.exports = {
    mode: "production",
    entry: {
        background: path.resolve(__dirname, "..", "src", "scripts", "background.ts"),
        shared: path.resolve(__dirname, "..", "src", "scripts", "shared.ts"),
        content: path.resolve(__dirname, "..", "src", "scripts", "content.ts"),
        popup: path.resolve(__dirname, "..", "src", "popup", "popup.ts"),
        opengrok: path.resolve(__dirname, "..", "src", "scripts", "opengrok.ts"),
    },
    output: {
        path: path.join(__dirname, "../dist"),
        filename: "[name].js",
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: ".", to: ".", context: "public" }],
        }),
    ],
    devtool: "inline-source-map",
};

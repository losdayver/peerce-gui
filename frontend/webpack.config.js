const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "production",

  devtool: "inline-source-map",

  target: "web",

  entry: "./src/index.tsx",

  output: {
    path: path.resolve(__dirname, "../dist/frontend"),
    filename: "app.js",
    library: "Core",
    libraryTarget: "umd",
    clean: true,
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, "src/core"),
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            configFile: path.resolve(__dirname, "tsconfig.json"),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      title: "peerce",

      templateContent: ({ htmlWebpackPlugin }) => `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>${htmlWebpackPlugin.options.title}</title>
          </head>

          <body>
            <div id="root" />
          </body>
        </html>
      `,
    }),
  ],
};

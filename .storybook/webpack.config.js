const path = require("path");

module.exports = async ({ config }) => {
  // console.dir(config, { depth: null });

  config.module.rules.push({
    test: /\.scss$/,
    use: ["style-loader", "css-loader", "sass-loader"],
    include: path.resolve(__dirname, "../")
  });

  return config;
};

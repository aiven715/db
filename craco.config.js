const path = require("path");

const cracoWasm = require("craco-wasm");

module.exports = {
  plugins: [cracoWasm()],
  webpack: {
    alias: { "~": path.resolve(__dirname, "./src") },
  },
};

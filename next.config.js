/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      syncWebAssembly: true,
    };

    config.module.rules.push({
      test: /\.(wasm)$/i,
      type: "asset/resource",
    });

    config.module.rules.push({
      test: /\.worker\.js$/i,
      use: {
        loader: "file-loader",
        options: {
          publicPath: "/_next/",
          name: "static/[hash].worker.js",
        },
      },
    });

    return config;
  },
}

module.exports = nextConfig

const webpack = require('webpack');

module.exports = function override(config) {
    // 1. Add Fallbacks for Node.js modules
    config.resolve.fallback = {
        ...config.resolve.fallback,
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser.js"),
    };

    // 2. Global Plugins for process and Buffer
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser.js',
            Buffer: ['buffer', 'Buffer'],
        }),
    ]);

    // 3. Fix for ESM fully specified modules (Algosdk & WalletConnect)
    config.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
            if (oneOf.resolve) {
                oneOf.resolve.fullySpecified = false;
            }
        });
    });

    // Handle .mjs files
    config.module.rules.push({
        test: /\.m?js/,
        resolve: {
            fullySpecified: false,
        },
    });

    return config;
}

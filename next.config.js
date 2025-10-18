/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack configuration for handling WASM and native modules
  webpack: (config, { isServer }) => {
    // Handle native modules
    if (isServer) {
      config.externals.push('better-sqlite3');
    }

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

module.exports = nextConfig;

const Config = require('webpack-chain');
const { genPathResolve } = require('@huiji/shared-utils');

const resolvePath = genPathResolve(__dirname);

const options = {
  publicPath: process.env.NODE_ENV === 'production' ? '/static/' : '/',
  filenameHashing: false,

  /**
   * @param {Config} config
   */
  chainWebpack: config => {
    config.resolve.symlinks(true);
    config.resolve.alias.delete('@').set('@src', resolvePath('src'));

    if (process.env.NODE_ENV === 'development') {
      config.resolve.alias.set('@rimtrans/service', '@rimtrans/service/src/index.ts');
    }

    config.optimization
      .delete('minimizer')
      .delete('splitChunks')
      .end();
  },

  devServer: {
    port: 5102,
    open: true,
    proxy: {
      '/rest': {
        target: 'http://localhost:5100',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:5100',
        ws: true,
        changeOrigin: true,
      },
    },
  },
};

module.exports = options;
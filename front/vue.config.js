/*
  File version: 1.1.0
  This is a frontend file. FRONTEND file: vue.config.js
  Purpose: Vue CLI build configuration tuned for faster Docker builds
  Logic: Enable persistent filesystem cache and proper code splitting to reduce build time and bundle sizes
*/

const path = require('path');

module.exports = {
  transpileDependencies: true,
  pluginOptions: {
    vuetify: {}
  },
  configureWebpack: {
    // Persist webpack cache between builds (works with our BuildKit cache mount)
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
      buildDependencies: {
        config: [__filename]
      }
    },
    entry: {
      app: './src/main.ts'  // Указываем более конкретно точку входа
    },
    optimization: {
      // Re-enable chunk splitting for better parallel minification and smaller artifacts
      splitChunks: {
        chunks: 'all'
      },
      // Keep defaults for removeAvailableModules/removeEmptyChunks
    },
    output: {
      pathinfo: false
    },
    performance: {
      hints: false
    }
  },
  css: {
    sourceMap: false
  },
  productionSourceMap: false,
  lintOnSave: false,
  devServer: {
    hot: true,
    liveReload: false
  }
}
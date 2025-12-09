/*
  File version: 1.1.0
  This is a frontend file. FRONTEND file: vue.config.js
  Purpose: Vue CLI build configuration tuned for faster container builds
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
        chunks: 'all',
        cacheGroups: {
          // Group for all admin module code into a dedicated chunk
          admin: {
            name: 'chunk-admin',
            test: (module) => {
              const resource = module.nameForCondition && module.nameForCondition();
              return resource && /\/(src\/modules\/admin)\//.test(resource);
            },
            chunks: 'all',
            priority: 40,
            enforce: true
          },
          // Separate vuetify to improve caching
          vuetify: {
            name: 'chunk-vuetify',
            test: /[\\/]node_modules[\\/]vuetify[\\/]/,
            chunks: 'all',
            priority: 30,
            enforce: true
          },
          // Icons library can be heavy; split for better caching
          phosphorIcons: {
            name: 'chunk-icons-phosphor',
            test: /[\\/]node_modules[\\/]@phosphor-icons[\\/]vue[\\/]/,
            chunks: 'all',
            priority: 25,
            enforce: true
          },
          // Default vendors (left as fallback)
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 10
          },
          // Common async shared modules
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
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
    port: 8080,
    hot: true,
    liveReload: false,
    open: false  // Отключить автоматическое открытие браузера
  }
}
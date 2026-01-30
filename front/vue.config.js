/*
  File version: 1.2.0
  This is a frontend file. FRONTEND file: vue.config.js
  Purpose: Vue CLI build configuration tuned for faster container builds
  Logic: Enable persistent filesystem cache and proper code splitting to reduce build time and bundle sizes
  
  Changes in v1.2.0:
  - chainWebpack: set fork-ts-checker typescript.memoryLimit from NODE_MEMORY_CHILD_MB when set (container build via release.sh). No fallback.
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
      app: './src/main.ts'
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
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
          vuetify: {
            name: 'chunk-vuetify',
            test: /[\\/]node_modules[\\/]vuetify[\\/]/,
            chunks: 'all',
            priority: 30,
            enforce: true
          },
          phosphorIcons: {
            name: 'chunk-icons-phosphor',
            test: /[\\/]node_modules[\\/]@phosphor-icons[\\/]vue[\\/]/,
            chunks: 'all',
            priority: 25,
            enforce: true
          },
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 10
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      }
    },
    output: {
      pathinfo: false
    },
    performance: {
      hints: false
    }
  },
  chainWebpack(config) {
    // Set fork-ts-checker memoryLimit from NODE_MEMORY_CHILD_MB (container build via release.sh)
    const childMemoryMb = process.env.NODE_MEMORY_CHILD_MB;
    if (childMemoryMb) {
      config.plugin('fork-ts-checker').tap((args) => {
        args[0] = args[0] || {};
        args[0].typescript = { ...args[0].typescript, memoryLimit: Number(childMemoryMb) };
        return args;
      });
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
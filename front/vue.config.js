const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    vuetify: {}
  },
  // Оптимизации для development
  configureWebpack: {
    cache: true,
    optimization: {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    },
    output: {
      pathinfo: false
    },
    performance: {
      hints: false
    }
  },
  // Отключаем лишние опции в development
  css: {
    sourceMap: false
  },
  productionSourceMap: false,
  lintOnSave: false, // Временно отключаем линтинг при сборке
  devServer: {
    hot: true,
    liveReload: false
  }
})
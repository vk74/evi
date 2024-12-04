module.exports = {
  transpileDependencies: true,
  pluginOptions: {
    vuetify: {}
  },
  configureWebpack: {
    entry: {
      app: './src/main.js'  // Указываем более конкретно точку входа
    },
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
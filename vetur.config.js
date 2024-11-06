// vetur.config.js
module.exports = {
    // vetur специально для monorepo проектов
    projects: [
      {
        root: './front',
        package: './front/package.json',
        jsconfig: './front/jsconfig.json',
      }
    ]
  }
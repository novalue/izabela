(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@packages/generate-modules')) :
  typeof define === 'function' && define.amd ? define(['exports', '@packages/generate-modules'], factory) :
  (global = global || self, factory(global.vitePluginGenerateModules = {}, global.generateModules));
})(this, (function (exports, generateModules) {
  const generateModulesPlugin = (...args) => {
    generateModules.generateModules(...args);
    return {
      name: 'generate-modules'
    };
  };

  exports.generateModulesPlugin = generateModulesPlugin;

}));
//# sourceMappingURL=main.umd.js.map

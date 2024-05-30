(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@packages/generate-exports')) :
  typeof define === 'function' && define.amd ? define(['exports', '@packages/generate-exports'], factory) :
  (global = global || self, factory(global.generateExportsWebpackPlugin = {}, global.generateExports));
})(this, (function (exports, generateExports) {
  class GenerateExportsPlugin {
    constructor(...args) {
      this.instance = void 0;
      this.instance = generateExports.generateExports(...args);
    }
    apply() {
      this.instance.start();
    }
  }

  exports.GenerateExportsPlugin = GenerateExportsPlugin;

}));
//# sourceMappingURL=main.umd.js.map

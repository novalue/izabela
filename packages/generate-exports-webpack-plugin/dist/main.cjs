var generateExports = require('@packages/generate-exports');

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
//# sourceMappingURL=main.cjs.map

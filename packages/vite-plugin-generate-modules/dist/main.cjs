var generateModules = require('@packages/generate-modules');

const generateModulesPlugin = (...args) => {
  generateModules.generateModules(...args);
  return {
    name: 'generate-modules'
  };
};

exports.generateModulesPlugin = generateModulesPlugin;
//# sourceMappingURL=main.cjs.map

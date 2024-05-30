import { generateModules } from '@packages/generate-modules';

const generateModulesPlugin = (...args) => {
  generateModules(...args);
  return {
    name: 'generate-modules'
  };
};

export { generateModulesPlugin };
//# sourceMappingURL=main.es.js.map

import { generateExports } from '@packages/generate-exports';

class GenerateExportsPlugin {
  constructor(...args) {
    this.instance = void 0;
    this.instance = generateExports(...args);
  }
  apply() {
    this.instance.start();
  }
}

export { GenerateExportsPlugin };
//# sourceMappingURL=main.es.js.map

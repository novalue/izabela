import { generateExports } from '@packages/generate-exports';
export declare class GenerateExportsPlugin {
    instance: ReturnType<typeof generateExports>;
    constructor(...args: Parameters<typeof generateExports>);
    apply(): void;
}

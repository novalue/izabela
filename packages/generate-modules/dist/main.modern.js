import path from 'path';
import { transformSync } from '@babel/core';
import { readFileSync, writeFileSync } from 'fs';
import babelPresetTypescript from '@babel/preset-typescript';
import babelPluginTransformModulesCommonjs from '@babel/plugin-transform-modules-commonjs';
import babelPluginTransformModulesUMD from '@babel/plugin-transform-modules-umd';
import babelPluginTransformModulesAMD from '@babel/plugin-transform-modules-amd';
import babelPluginTransformModulesSystemjs from '@babel/plugin-transform-modules-systemjs';
import minimatch from 'minimatch';
import globby from 'globby';
import chokidar from 'chokidar';

const generateModules = config => {
  const {
    cwd
  } = process;
  const entries = config.entries;
  const babelPluginsParams = {
    module: {
      plugin: null,
      ext: '.mjs'
    },
    commonjs: {
      plugin: babelPluginTransformModulesCommonjs,
      ext: '.cjs'
    },
    umd: {
      plugin: babelPluginTransformModulesUMD,
      ext: '.umd.js'
    },
    amd: {
      plugin: babelPluginTransformModulesAMD,
      ext: '.amd.js'
    },
    systemjs: {
      plugin: babelPluginTransformModulesSystemjs,
      ext: '.system.js'
    }
  };
  const btfs = path => {
    return path.replace(/\\/g, '/');
  };
  const transformModules = (filepath, {
    into
  }) => {
    try {
      const moduleTypes = typeof into === 'string' ? [into] : into;
      const {
        dir,
        name,
        base
      } = path.parse(filepath);
      const fileContent = readFileSync(filepath, {
        encoding: 'utf8'
      });
      Object.entries(babelPluginsParams).filter(([type]) => moduleTypes.includes(type)).forEach(([_, {
        plugin,
        ext
      }]) => {
        var _transformSync;
        const transformedFileContent = (_transformSync = transformSync(fileContent, {
          presets: [babelPresetTypescript],
          plugins: [plugin].filter(Boolean),
          filename: base
        })) == null ? void 0 : _transformSync.code;
        const contentWithComments = `/**
 * This file is auto-generated by GenerateModulesWebpackPlugin.
 * Check this file into source control.
 * Do not edit this file.
 */\n${transformedFileContent}\n/* End of auto-generated content. */\n`;
        writeFileSync(path.join(dir, name) + ext, contentWithComments);
      });
    } catch (e) {
      console.error(`TransformModulesWebpackPlugin: Couldn't transform module (${filepath}) - ${e.message}`);
    }
  };
  const transformFile = filePath => {
    const patternOptions = entries.find(({
      pattern
    }) => {
      const target = btfs(path.resolve(cwd(), filePath));
      const resolvedPattern = btfs(path.resolve(cwd(), pattern));
      return minimatch(target, resolvedPattern);
    });
    if (patternOptions) {
      transformModules(filePath, patternOptions);
    }
  };
  const initialTransform = () => transformFiles(globby.sync(entries.map(({
    pattern
  }) => pattern)));
  const transformFiles = files => files.forEach(file => transformFile(file));
  if (config.watch) {
    const watcher = chokidar.watch(entries.map(({
      pattern
    }) => pattern), {
      ignored: /^\./,
      cwd: cwd()
    });
    watcher.on('add', filePath => transformFile(filePath)).on('change', filePath => transformFile(filePath)).on('ready', () => initialTransform());
  } else {
    initialTransform();
  }
};

export { generateModules };
//# sourceMappingURL=main.modern.js.map

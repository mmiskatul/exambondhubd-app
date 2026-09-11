const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Redux Toolkit 2.x and react-redux 9.x point their `react-native` package
 * field at an ESM bundle (`*.legacy-esm.js`) that Metro on Expo SDK 51 does not
 * resolve, which fails the build with "the package specifies a `main` module
 * field that could not be resolved".
 *
 * Their CommonJS builds are complete, so those two packages are pinned to them.
 * Everything else keeps Metro's normal resolution — this deliberately avoids
 * flipping `unstable_enablePackageExports`, which would change how every
 * dependency resolves rather than just these two.
 */
const CJS_PINNED = {
  '@reduxjs/toolkit': 'dist/cjs/index.js',
  'react-redux': 'dist/cjs/index.js',
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const entry = CJS_PINNED[moduleName];

  if (entry) {
    return {
      type: 'sourceFile',
      filePath: path.join(__dirname, 'node_modules', moduleName, entry),
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

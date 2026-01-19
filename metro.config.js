// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config')

module.exports = (() => {
  const config = getDefaultConfig(__dirname)

  const { transformer, resolver } = config

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  }
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
    alias: {
      '@': './src',
      '@dtos': './src/dtos',
      '@assets': './src/assets',
      '@components': './src/components',
      '@screens': './src/screens',
      '@storage': './src/storage',
      '@utils': './src/utils',
      '@services': './src/services',
      '@hooks': './src/hooks',
      '@contexts': './src/contexts',
      '@routes': './src/routes',
      '@config': './src/config',
      '@api': './src/api',
      '@lib': './src/lib',
    },
  }

  return config
})()

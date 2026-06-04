// Metro configuration for ExpenSee, extending Expo's defaults.
// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-gifted-charts tries to require `react-native-linear-gradient`
// first. We don't use that native module (it isn't in Expo Go); alias it to
// `expo-linear-gradient`, which is Expo Go-compatible.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-linear-gradient') {
    return context.resolveRequest(context, 'expo-linear-gradient', platform);
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;

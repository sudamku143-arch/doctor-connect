// react-native-reanimated arrives transitively via expo-router's drawer
// navigation support (expo-router -> react-native-drawer-layout ->
// react-native-reanimated) even though this app never renders a Drawer.
// Reanimated still initializes at import time and crashes
// ("Cannot read property 'getUseOfValueInStyleWarning' of undefined")
// without its Babel plugin configured, so it has to be wired up correctly
// here rather than left unconfigured.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-worklets/plugin"],
  };
};

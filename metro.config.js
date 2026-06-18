const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/**
 * Configuración base de Metro para Expo.
 */
const config = getDefaultConfig(__dirname);

/**
 * Conectamos NativeWind con Metro.
 *
 * input apunta al archivo global.css que creamos.
 */
module.exports = withNativeWind(config, {
  input: "./global.css",
});

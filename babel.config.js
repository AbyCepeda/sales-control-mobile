module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      /**
       * jsxImportSource permite que NativeWind procese className.
       */
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],

      /**
       * Preset de NativeWind.
       */
      "nativewind/babel",
    ],
  };
};

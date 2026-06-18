/** @type {import('tailwindcss').Config} */
module.exports = {
  /**
   * Archivos donde NativeWind buscará clases.
   *
   * Incluimos:
   * - app: pantallas de Expo Router
   * - components: componentes de la plantilla
   * - src: nuestros services/features/components futuros
   */
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  /**
   * Preset necesario para que Tailwind funcione con NativeWind.
   */
  presets: [require("nativewind/preset")],

  theme: {
    extend: {},
  },

  plugins: [],
};

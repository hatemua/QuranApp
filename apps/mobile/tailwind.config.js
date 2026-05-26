/** @type {import('tailwindcss').Config} */
const {colors} = require('./src/lib/tailwindTokens');

module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      fontFamily: {
        arabic: ['Amiri-Regular'],
        'arabic-bold': ['Amiri-Bold'],
        latin: ['Inter-Regular'],
        'latin-semibold': ['Inter-SemiBold'],
      },
    },
  },
  plugins: [],
};

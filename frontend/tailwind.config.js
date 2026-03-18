/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stone_wall: '#8B7355',
        clay: '#C4734A',
        soil: '#5C4033',
        limestone: '#E8DCC8',
        palay: '#D4B483',
        harvest: '#A67C52',
        basi: '#6B2D3E',
        pine: '#2D4A2D',
        terraces: '#4A7C59',
        sky: '#7BA7BC',
        fog: '#C8D8E0',
        ink: '#2C1810',
        parchment: '#F5EDD6',
        editor_bg: '#1A0F0A',
      },
      fontFamily: {
        heading: ['"Libre Baskerville"', 'serif'],
        body: ['Lora', 'serif'],
        code: ['"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};

import PrimeUI from 'tailwindcss-primeui';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{html,ts}'],
  theme: {
    extend: {}
  },
  plugins: [PrimeUI]
};

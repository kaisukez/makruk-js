/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'board-light': '#f0d9b5',
        'board-dark': '#b58863',
        'highlight-selected': 'rgba(255, 255, 0, 0.5)',
        'highlight-move': 'rgba(100, 200, 100, 0.5)',
        'highlight-last': 'rgba(155, 199, 0, 0.41)',
        'highlight-check': 'rgba(255, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}

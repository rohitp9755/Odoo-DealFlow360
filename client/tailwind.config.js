/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#d9e6ff', 200: '#b6cdff', 300: '#84a9ff',
          400: '#4f7dff', 500: '#2b58f5', 600: '#1e3fd1', 700: '#1a34a8',
          800: '#182e86', 900: '#182b6b'
        }
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff', 100: '#e0e9ff', 200: '#c2d4fe', 300: '#94b3fd',
          400: '#608afe', 500: '#3b5fdf', 600: '#2744b8', 700: '#1d3393',
          800: '#162875', 900: '#101c54'
        },
        surface: {
          base: '#ffffff',
          subtle: '#fafafa',
          muted: '#f4f4f5',
          hover: '#f4f4f5',
          raised: '#ffffff',
          dark: '#09090b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        subtle: 'none',
        card: 'none',
        popover: '4px 4px 0px 0px rgba(0,0,0,1)',
        brutal: '3px 3px 0px 0px rgba(0,0,0,1)'
      }
    }
  },
  plugins: []
};

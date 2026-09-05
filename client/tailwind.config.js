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
        },
        surface: {
          base: '#ffffff',
          subtle: '#f8fafc',
          muted: '#f1f5f9',
          hover: '#f8fafc',
          raised: '#ffffff',
          dark: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Inter Fallback', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.03)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        popover: '0 4px 20px -2px rgba(15, 23, 42, 0.12), 0 2px 6px -1px rgba(15, 23, 42, 0.06)'
      }
    }
  },
  plugins: []
};

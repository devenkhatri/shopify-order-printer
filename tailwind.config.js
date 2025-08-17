/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Shopify Polaris color palette
        'shopify-green': '#00A047',
        'shopify-blue': '#006FBB',
        'shopify-purple': '#6371C7',
        'shopify-teal': '#47C1BF',
        'shopify-yellow': '#FFD23F',
        'shopify-orange': '#FF6D42',
        'shopify-red': '#DE3618',
        'shopify-gray': {
          50: '#FAFBFB',
          100: '#F6F6F7',
          200: '#F1F2F3',
          300: '#E1E3E5',
          400: '#C9CCCF',
          500: '#A4A6A8',
          600: '#6D7175',
          700: '#303030',
          800: '#202223',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        'shopify': ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'shopify': '0.375rem',
      },
      boxShadow: {
        'shopify': '0 1px 0 0 rgba(22, 29, 37, 0.05)',
        'shopify-lg': '0 2px 4px 0 rgba(22, 29, 37, 0.1)',
      },
    },
  },
  plugins: [],
}

module.exports = config
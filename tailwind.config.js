module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
      },
      colors: {
        'stealth-primary' : '#000000',
        'stealth-secondary' : '#FFFFFF',
        'stealth-gradient-lime': '#EEFC8E',
        'stealth-gradient-teal': '#63AE9D',
      },
      boxShadow: {
        'strong': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '12px',
      },
      backgroundColor: {
        'page': '#ffffff',
        'r-sidebar' : '#F5F8F8',
        'l-sidebar' : '#D8E2E1',
      },
      backgroundImage: theme => ({
        'stealth-gradient': `linear-gradient(to top right, ${theme('colors.stealth-gradient-lime')}, ${theme('colors.stealth-gradient-teal')})`,
      }),
    },
  },
  plugins: [],
}


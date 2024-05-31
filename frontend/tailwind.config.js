module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      colors: {
        'primary-text': '#11181C',
        'secondary-text': '#6b7689',
        'stealth-primary': '#000000',
        'stealth-secondary': '#FFFFFF',
        'stealth-gradient-lime': '#80DEEA',
        'stealth-gradient-teal': '#00ACC1 ',
        'stealth-yellow': '#f9d423',
        'stealth-yellow-dark': '#f9d473',
      },
      boxShadow: {
        'strong': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '12px',
      },
      backgroundColor: {
        'page': '#f2f2f2',
        'r-sidebar': '#e0ecde',
        'l-sidebar': '#D8E2E1',
      },
      backgroundImage: theme => ({
        'stealth-gradient': `linear-gradient(to bottom left, ${theme('colors.stealth-gradient-lime')}, ${theme('colors.stealth-gradient-teal')} )`,
        // 'stealth-gradient': 'linear-gradient(68.6deg, rgba(79,183,131,1) 14.4%, rgba(254,235,151,1) 92.7%)'
      }),
    },
  },
  plugins: [],
}


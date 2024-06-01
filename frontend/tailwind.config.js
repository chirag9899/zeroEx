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
        'stealth-gradient-lime': '#FFFFFF',
        'stealth-gradient-teal': '#FFFFFF',
        'stealth-yellow': '#21ac01',
        'stealth-yellow-dark': '#f9d473',
      },
      boxShadow: {
        'strong': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '12px',
      },
      backgroundColor: {
        'page': '#d5d5da',
        'r-sidebar': '#f1f1f8',
        'l-sidebar': '#f1f1f8',
      },
      backgroundImage: theme => ({
        'stealth-gradient': `linear-gradient(to bottom left, ${theme('colors.stealth-gradient-lime')}, ${theme('colors.stealth-gradient-teal')} )`,
        // 'stealth-gradient': 'linear-gradient(68.6deg, rgba(79,183,131,1) 14.4%, rgba(254,235,151,1) 92.7%)'
      }),
    },
  },
  plugins: [],
}


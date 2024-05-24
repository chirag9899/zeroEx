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
        'stealth-gradient-lime': '#6AE10D',
        'stealth-gradient-teal': '#7AF11D',
        'stealth-yellow': '#EBFF03',
      },
      boxShadow: {
        'strong': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '12px',
      },
      backgroundColor: {
        'page': '#ffffff',
        'r-sidebar': '#F5F8F8',
        'l-sidebar': '#D8E2E1',
      },
      backgroundImage: theme => ({
        'stealth-gradient': `linear-gradient(to bottom left, ${theme('colors.stealth-gradient-lime')} 27%, ${theme('colors.stealth-gradient-teal')} )`,
        // 'stealth-gradient': `bg-gradient-to-tr from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90%`,
      }),
    },
  },
  plugins: [],
}


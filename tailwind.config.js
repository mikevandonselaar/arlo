export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Sugo Pro Display', 'system-ui', 'sans-serif'],
      },
      colors: {
        'arlo-red':   '#651610',
        'arlo-pink':  '#FFC8FF',
        'arlo-grey':  '#EDF0F5',
        'arlo-white': '#FFFFFF',
        // Legacy aliases — kept for backward-compat during migration
        'deep-red':   '#651610',
        'soft-pink':  '#FFC8FF',
        'grey-blue':  '#EDF0F5',
      },
    },
  },
  plugins: [],
}

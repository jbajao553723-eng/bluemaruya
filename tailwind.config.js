/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./dist/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        cinema: {
          950: '#111113',
          900: '#1c1c20',
          800: '#25252a',
          coral: '#ee6957',
          cream: '#faf9f7'
        }
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif']
      }
    }
  },
  plugins: []
};

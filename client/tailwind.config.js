/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        heroku: {
          purple: '#5A1BA9',
          light: '#AD7BEE',
          dark: '#401075',
          black: '#1B1B1B',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 
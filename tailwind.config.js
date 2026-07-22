/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0b2545",
          800: "#13315c",
          700: "#1d4e89",
        },
      },
    },
  },
  plugins: [],
};

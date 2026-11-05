/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared-ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fffbf0",
          100: "#fef5d6",
          200: "#fde9aa",
          300: "#fbd773",
          400: "#f7c03d",
          500: "#f0a716",
          600: "#d4860d",
          700: "#b0630e",
          800: "#8e4c12",
          900: "#753f13",
          950: "#431f05",
        },
      },
    },
  },
  plugins: [],
};

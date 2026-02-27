/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        serif: ["Source Serif 4", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Source Serif 4", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

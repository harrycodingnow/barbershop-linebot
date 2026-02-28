/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        forest: {
          DEFAULT: '#2D3A31',
          light: '#3D4A41',
        },
        sage: {
          DEFAULT: '#8C9A84',
          light: '#A4B09D',
        },
        clay: {
          DEFAULT: '#DCCFC2',
          light: '#EBE2DA',
          softer: '#F2F0EB',
        },
        alabaster: '#F9F8F4',
        terracotta: '#C27B66',
        stone: '#E6E2DA',
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        sans: ["Source Sans 3", "system-ui", "sans-serif"]
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(45, 58, 49, 0.05)',
        'soft-md': '0 10px 15px -3px rgba(45, 58, 49, 0.05)',
        'soft-lg': '0 20px 40px -10px rgba(45, 58, 49, 0.05)',
        'soft-xl': '0 25px 50px -12px rgba(45, 58, 49, 0.15)',
      }
    }
  },
  plugins: []
};

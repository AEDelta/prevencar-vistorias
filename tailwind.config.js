module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          red: { DEFAULT: '#dc2626', dark: '#fca5a5' },
          blue: { DEFAULT: '#2563eb', dark: '#93c5fd' },
          bg: { DEFAULT: '#f1f5f9', dark: '#1e293b' },
          mauve: { DEFAULT: '#7c3aed', dark: '#c4b5fd' },
          yellow: { DEFAULT: '#f59e0b', dark: '#fcd34d' },
        }
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        charcoal: '#0f172a',
        ink: '#05060f',
        accent: '#8b5cf6',
        'accent-2': '#22d3ee',
      },
    },
  },
  plugins: [],
}

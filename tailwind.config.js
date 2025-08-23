/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#86E8FF',
      },
      dropShadow: {
        glow: '0 0 6px rgba(255,255,255,0.6)',
      },
      backgroundImage: {
        texture: "url('/textures/mesh-gradient.png')",
      },
      fontFamily: {
        lynq: ['LynqFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
}


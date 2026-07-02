/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E7D32', // Forest Green
          light: '#E8F5E9',
          dark: '#1B5E20',
        },
        secondary: {
          DEFAULT: '#66BB6A', // Leaf Green
          light: '#A5D6A7',
          dark: '#388E3C',
        },
        accent: {
          DEFAULT: '#FBC02D', // Harvest Yellow
          light: '#FFF9C4',
          dark: '#F57F17',
        },
        customBg: '#F8FAFC',
        customDarkBg: '#0F172A',
        customCard: '#FFFFFF',
        customDarkCard: '#1E293B',
        success: '#4CAF50',
        warning: '#FB8C00',
        danger: '#E53935',
        customText: '#1F2937',
        customBorder: '#E5E7EB'
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./pages/**/*.{js,jsx}",
      "./components/**/*.{js,jsx}",
      "./styles/**/*.css"
    ],
    theme: {
      extend: {
        colors: {
          bgPrimary: "#121212",
          bgSecondary: "#1e1e1e",
          bgTertiary: "#2c2c2c",
          textPrimary: "#e0e0e0",
          textSecondary: "#b0b0b0",
          accentGold: "#FFD700",
          accentGreen: "#4CAF50",
          accentBlue: "#2196F3"
        }
      }
    },
    plugins: []
  };
  
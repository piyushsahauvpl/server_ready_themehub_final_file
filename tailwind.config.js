/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // MAIN WEBSITE (frontend)
    "./src/**/*.{js,jsx,ts,tsx}",

    // Admin panel
    "./src/admin/**/*.{js,jsx,ts,tsx}",

    // Customer support / CS panel
    "./src/cs/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },

  // Keeps your existing CSS safe (no global reset)
  corePlugins: {
    preflight: false,
  },

  plugins: [],
};

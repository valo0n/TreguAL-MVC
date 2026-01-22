// tailwind.config.js
module.exports = {
  content: [
    // React (siç i ke)
 

    // ✅ ASP.NET Razor (shto këto)
    "./Views/**/*.{cshtml,html}",
    "./Pages/**/*.{cshtml,html}",
    "./wwwroot/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        darkBlue: '#0d274b',
        linkOrange: '#ff9900',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
    }
  },
  plugins: [],
};

// tailwind.config.js
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          primary:   { DEFAULT: "#6366F1", light: "#818CF8" },
          accent:    { DEFAULT: "#F59E0B", light: "#FBBF24" },
          success:   "#10B981",
          warning:   "#FBBF24",
          danger:    "#EF4444",
          surface:   { light: "#F9FAFB", dark: "#1F2937" },
        },
        fontFamily: {
          sans:    ["Inter", "system-ui", "sans-serif"],
          heading: ["Poppins", "Inter", "sans-serif"],
        },
      },
    },
    plugins: [],
  };  
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#1D4ED8",
          soft: "#DBEAFE"
        }
      },
      boxShadow: {
        executive: "0 10px 35px rgba(15, 23, 42, 0.08)"
      }
    },
  },
  plugins: [],
};

export default config;

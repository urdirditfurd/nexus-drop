import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#008060",
          hover: "#006e52",
          light: "#e3f1ed",
        },
        surface: {
          DEFAULT: "#fafafa",
          card: "#ffffff",
          muted: "#f4f4f5",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        elevated: "0 4px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

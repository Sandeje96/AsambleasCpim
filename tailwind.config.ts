import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cpim: {
          blue: "#1e3a5f",
          "blue-light": "#2c5282",
          gold: "#b7791f",
          "gold-light": "#f6e05e",
        },
      },
    },
  },
  plugins: [],
};

export default config;

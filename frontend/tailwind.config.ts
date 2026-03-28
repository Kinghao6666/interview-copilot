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
        background: "#000000",
        foreground: "#f5f5f7",
        gold: "#d4b896",
        blue: "#8aa8d8",
        card: "#1C1C1E",
        "card-elevated": "#2C2C2E",
        border: "#38383A",
        success: "#30D158",
        danger: "#FF453A",
        warning: "#FFD60A",
        muted: "#8E8E93",
      },
    },
  },
  plugins: [],
};
export default config;

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
        background: "#0a0a0a",
        foreground: "#ffffff",
        gold: "#d4af37",
        blue: "#1e90ff",
        card: "#1a1a1a",
        border: "#2a2a2a",
        success: "#00ff88",
        danger: "#ff4444",
        muted: "#888888",
      },
    },
  },
  plugins: [],
};
export default config;

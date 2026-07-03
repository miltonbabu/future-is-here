import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        // English — Special Elite headlines + Courier Prime body (newspaper)
        headline: [
          '"Special Elite"',
          '"Courier Prime"',
          "Courier",
          "monospace",
        ],
        body: ['"Courier Prime"', "Courier", "monospace"],
        // English serif — Libre Caslon + Lora (landing page only)
        "landing-headline": [
          '"Libre Caslon Display"',
          '"Libre Caslon Text"',
          "Georgia",
          "serif",
        ],
        "landing-body": ['"Lora"', '"Libre Caslon Text"', "Georgia", "serif"],
        // Chinese — serif first, sans as fallback
        "headline-zh": [
          '"Noto Serif SC"',
          '"ZCOOL KuHei"',
          "Plix",
          "Ruizi JunXian Medium",
          "TASA Explorer",
          "DianZi FangHei",
          "XinYugong PinTi",
          '"Noto Sans SC"',
          "serif",
        ],
        "body-zh": [
          '"Noto Serif SC"',
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "serif",
        ],
      },
      colors: {
        // Broadsheet paper & ink — light, warm, off-white
        paper: "rgb(var(--paper) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        // Year-shifted accents — applied via CSS vars on the page root
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};

export default config;

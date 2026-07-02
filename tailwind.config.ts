import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#154212",
        "primary-container": "#2d5a27",
        "on-primary": "#ffffff",
        background: "#f7f8f3",
        surface: "#f7f8f3",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eef2ea",
        "surface-container": "#e6ece4",
        "surface-container-high": "#dde6da",
        "surface-container-highest": "#d4dfd1",
        "on-surface": "#1a1b22",
        "on-surface-variant": "#42493e",
        outline: "#72796e",
        "outline-variant": "#dde5da",
        secondary: "#3f627e",
        tertiary: "#5a2e00",
        error: "#ba1a1a"
      },
      borderRadius: {
        control: "0.5rem",
        card: "1rem"
      },
      boxShadow: {
        card: "0 4px 12px rgba(0, 0, 0, 0.05)",
        floating: "0 8px 24px rgba(0, 0, 0, 0.1)"
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "600" }],
        "headline-mobile": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "metric-lg": ["20px", { lineHeight: "24px", fontWeight: "700" }]
      },
      spacing: {
        "page-mobile": "16px",
        "page-desktop": "48px"
      }
    }
  },
  plugins: []
};

export default config;

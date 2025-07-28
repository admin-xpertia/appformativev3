import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#FAFAFA",
        foreground: "#1D1D1F",
        primary: {
          DEFAULT: "#1D1D1F",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F5F5F7",
          foreground: "#1D1D1F",
        },
        destructive: {
          DEFAULT: "#FF3B30",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F5F5F7",
          foreground: "#6D6D70",
        },
        accent: {
          DEFAULT: "#48B5A3",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1D1D1F",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1D1D1F",
        },
        mint: "#63E6BE",
        "mint-dark": "#48B5A3",
        midnight: "#1D1D1F",
        success: "#2ECC71",
        // Grises de Apple
        "gray-50": "#FAFAFA",
        "gray-100": "#F5F5F7",
        "gray-200": "#E5E5EA",
        "gray-300": "#D2D2D7",
        "gray-400": "#C7C7CC",
        "gray-500": "#AEAEB2",
        "gray-600": "#8E8E93",
        "gray-700": "#636366",
        "gray-800": "#48484A",
        "gray-900": "#1D1D1F",
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-mint": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(72, 181, 163, 0.4)" },
          "50%": { boxShadow: "0 0 0 10px rgba(72, 181, 163, 0)" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "pulse-mint": "pulse-mint 2s infinite",
        ripple: "ripple 0.6s linear",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

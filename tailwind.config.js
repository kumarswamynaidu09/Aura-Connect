/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        monad: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#836EF9", // Monad purple
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#200052",
          950: "#0e021e",
        },
        codeai: {
          cyan: "#00f0ff",
          emerald: "#10b981",
          dark: "#0a0d14",
          card: "#111726",
          border: "#1e293b",
        },
        lifeai: {
          rose: "#fb7185",
          violet: "#a855f7",
          dark: "#120f1d",
          card: "#1e182f",
          border: "#2e2447",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(131, 110, 249, 0.4)" },
          "100%": { boxShadow: "0 0 30px rgba(131, 110, 249, 0.8)" },
        }
      }
    },
  },
  plugins: [],
}

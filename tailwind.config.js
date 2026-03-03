import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
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
        border: "rgb(39, 39, 42)", // Zinc 800
        input: "rgb(39, 39, 42)", // Zinc 800
        ring: "rgb(14, 165, 233)", // Sky 500
        background: "#080808", // Deep Black/Zinc
        foreground: "rgb(244, 244, 245)", // Zinc 100
        primary: {
          DEFAULT: "rgb(14, 165, 233)", // Sky 500
          foreground: "rgb(255, 255, 255)",
        },
        secondary: {
          DEFAULT: "rgb(39, 39, 42)", // Zinc 800
          foreground: "rgb(250, 250, 250)",
        },
        accent: {
          DEFAULT: "rgb(14, 165, 233)", // Sky 500
          foreground: "rgb(255, 255, 255)",
        },
        surface: {
          DEFAULT: "rgb(9, 9, 11)", // Zinc 950
          foreground: "rgb(244, 244, 245)",
        },
        card: {
          DEFAULT: "rgb(9, 9, 11)", // Zinc 950
          foreground: "rgb(244, 244, 245)",
        },
        popover: {
          DEFAULT: "rgb(9, 9, 11)", // Zinc 950
          foreground: "rgb(244, 244, 245)",
        },
        muted: {
          DEFAULT: "rgb(24, 24, 27)", // Zinc 900
          foreground: "rgb(161, 161, 170)", // Zinc 400
        },
        destructive: {
          DEFAULT: "rgb(239, 68, 68)", // Red 500
          foreground: "rgb(255, 255, 255)",
        },
        success: {
          DEFAULT: "rgb(34, 197, 94)", // Green 500
          foreground: "rgb(255, 255, 255)",
        },
        warning: {
          DEFAULT: "rgb(234, 179, 8)", // Yellow 500
          foreground: "rgb(255, 255, 255)",
        },
        error: {
          DEFAULT: "rgb(239, 68, 68)", // Red 500
          foreground: "rgb(255, 255, 255)",
        },
        brand: {
          deep: "rgb(8, 8, 8)",
          'deep-foreground': "rgb(255, 255, 255)",
          energetic: "rgb(14, 165, 233)", // Sky 500
          'energetic-foreground': "rgb(255, 255, 255)",
        },
        text: {
          primary: "rgb(244, 244, 245)", // Zinc 100
          secondary: "rgb(161, 161, 170)", // Zinc 400
        },
        // Maintain gradients for backward compatibility but mapped to new theme
        'gradient-primary-from': "rgb(14, 165, 233)",
        'gradient-primary-to': "rgb(56, 189, 248)",
        'gradient-background-from': "#080808",
        'gradient-background-to': "rgb(24, 24, 27)",
        'gradient-card-from': "rgb(9, 9, 11)",
        'gradient-card-to': "rgb(24, 24, 27)",
      }, borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'system-ui', 'Arial', 'sans-serif'],
        heading: ['var(--font-lora)', 'system-ui', 'Arial', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" },
        },
        "animate-fade-in": {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-up": "slide-in-up 0.3s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "animate-fade-in": 'animate-fade-in 0.5s ease-in-out',
      },
      boxShadow: {
        'brand-sm': '0 2px 8px rgba(135, 206, 235, 0.08)',
        'brand-md': '0 4px 16px rgba(135, 206, 235, 0.12)',
        'brand-lg': '0 8px 32px rgba(135, 206, 235, 0.1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
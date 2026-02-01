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
        border: "rgb(59, 78, 102)",
        input: "rgb(40, 53, 66)",
        ring: "rgb(30, 144, 255)",
        background: "repeating-linear-gradient(45deg, rgb(26, 37, 51), rgb(26, 37, 51) 10px, rgb(32, 43, 56) 10px, rgb(32, 43, 56) 20px)",
        foreground: "rgb(224, 231, 235)",
        primary: {
          DEFAULT: "rgb(0, 191, 255)",
          foreground: "rgb(255, 255, 255)",
        },
        secondary: {
          DEFAULT: "rgb(128, 168, 191)",
          foreground: "rgb(26, 37, 51)",
        },
        accent: {
          DEFAULT: "rgb(30, 144, 255)",
          foreground: "rgb(255, 255, 255)",
        },
        surface: {
          DEFAULT: "rgb(32, 43, 56)",
          foreground: "rgb(224, 231, 235)",
        },
        card: {
          DEFAULT: "rgb(32, 43, 56)",
          foreground: "rgb(224, 231, 235)",
        },
        popover: {
          DEFAULT: "rgb(32, 43, 56)",
          foreground: "rgb(224, 231, 235)",
        },
        muted: {
          DEFAULT: "rgb(45, 62, 80)",
          foreground: "rgb(170, 187, 203)",
        },
        destructive: {
          DEFAULT: "rgb(255, 99, 71)",
          foreground: "rgb(255, 255, 255)",
        },
        success: {
          DEFAULT: "rgb(60, 179, 113)",
          foreground: "rgb(255, 255, 255)",
        },
        warning: {
          DEFAULT: "rgb(255, 215, 0)",
          foreground: "rgb(255, 255, 255)",
        },
        error: {
          DEFAULT: "rgb(255, 99, 71)",
          foreground: "rgb(255, 255, 255)",
        },
        brand: {
          deep: "rgb(0, 122, 204)",
          'deep-foreground': "rgb(255, 255, 255)",
          energetic: "rgb(30, 144, 255)",
          'energetic-foreground': "rgb(255, 255, 255)",
        },
        text: {
          primary: "rgb(224, 231, 235)",
          secondary: "rgb(155, 172, 191)",
        },
        'gradient-primary-from': "rgb(0, 191, 255)", // Deep sky blue
        'gradient-primary-to': "rgb(135, 206, 235)",   // Lighter sky blue
        'gradient-background-from': "rgb(26, 37, 51)", // Very dark blue-gray
        'gradient-background-to': "rgb(45, 62, 80)",   // Slightly lighter dark blue-gray
        'gradient-card-from': "rgb(32, 43, 56)",       // Dark blue-gray for cards
        'gradient-card-to': "rgb(45, 62, 80)",         // Slightly lighter blue-gray for cards
      },      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        heading: ['Lora', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
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
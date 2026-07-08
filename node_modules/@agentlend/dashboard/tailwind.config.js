/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* AgentLend Brand Colors - New Glassmorphism Palette */
        brand: {
          primary: '#1e52b3',
          accent: '#3a82f6',
        },
        /* Card Backgrounds */
        cardBg: {
          white: '#ffffff',
          red: '#fff1f2',
          yellow: '#fefec6',
          blue: '#cbdffa',
        },
        /* Semantic Status Colors */
        status: {
          critical: {
            bg: '#ffe4e6',
            text: '#b91c1c',
          },
          watch: {
            bg: '#e0f2fe',
            text: '#0369a1',
          },
          stable: {
            bg: '#dcfce7',
            text: '#15803d',
          },
        },
        /* Layout Colors */
        layout: {
          bgMain: '#f0f5fa',
          sidebarActive: '#fcf851',
          textPrimary: '#1e293b',
          textMuted: '#64748b',
          borderLight: '#e2e8f0',
        },
        /* Shadcn/UI compatibility */
        primary: {
          50: '#f0f5fa',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3a82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e52b3',
          900: '#1e3a5f',
          950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(30, 82, 179, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(30, 82, 179, 0.5)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(30, 82, 179, 0.3)',
        'glow-lg': '0 0 40px rgba(30, 82, 179, 0.5)',
      },
      backdropBlur: {
        'glass': '12px',
        'glass-strong': '20px',
      },
    },
  },
  plugins: [],
}
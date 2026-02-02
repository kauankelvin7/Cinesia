/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Deep Slate Dark Mode (Modern & Professional)
        dark: {
          app: '#020617',        // slate-950 - Background principal
          surface: '#0F172A',    // slate-900 - Cards/Surface
          elevated: '#1E293B',   // slate-800 - Surface elevada
          border: '#334155',     // slate-700 - Bordas
        },
        
        // Text Colors (Dark Mode)
        text: {
          primary: '#E2E8F0',    // slate-200 - Texto principal (evita branco puro)
          secondary: '#94A3B8',  // slate-400 - Texto secundário
          tertiary: '#64748B',   // slate-500 - Texto terciário
          muted: '#475569',      // slate-600 - Texto muito sutil
        },
        
        // Brand Colors (Teal Accent)
        brand: {
          primary: '#14B8A6',    // teal-500
          hover: '#0D9488',      // teal-600
          light: '#2DD4BF',      // teal-400 (brilhante no dark)
          dark: '#0F766E',       // teal-700
        },
        
        // Cores tradicionais (compatibilidade)
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(13, 148, 136, 0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

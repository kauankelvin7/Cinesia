/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'ipad': '600px', // Ativa modo iPad a partir de 600px
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Design System - Primary Colors
        primary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',  // Dark Mode Primary
          500: '#14B8A6',
          600: '#0D9488',  // Light Mode Primary
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        
        // Background Colors (Auto-swapped pelo Tailwind)
        // Light: slate-50 | Dark: slate-950
        background: {
          DEFAULT: '#F8FAFC',  // Light mode
          dark: '#020617',     // Dark mode (aplicado via bg-background dark:bg-background-dark)
        },
        
        // Surface/Card Colors
        // Light: white | Dark: slate-900
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#0F172A',
          elevated: '#1E293B', // Cards elevados no dark mode
        },
        
        // Text Colors (seguem hierarquia visual)
        text: {
          primary: {
            DEFAULT: '#1E293B',    // slate-800 - Light mode
            dark: '#E2E8F0',       // slate-200 - Dark mode
          },
          secondary: {
            DEFAULT: '#64748B',    // slate-500 - Light mode
            dark: '#94A3B8',       // slate-400 - Dark mode
          },
          muted: {
            DEFAULT: '#94A3B8',    // slate-400 - Light mode
            dark: '#64748B',       // slate-500 - Dark mode
          },
        },
        
        // Border Colors
        border: {
          DEFAULT: '#E2E8F0',    // slate-200 - Light mode
          dark: '#334155',       // slate-700 - Dark mode
        },
        
        // Cores tradicionais do Tailwind (compatibilidade total)
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
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.3), 0 10px 40px -5px rgba(0, 0, 0, 0.2)',
        'card': '0 4px 20px -2px rgba(13, 148, 136, 0.1)',
        'card-dark': '0 4px 20px -2px rgba(45, 212, 191, 0.2)',
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

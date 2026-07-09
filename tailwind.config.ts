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
        // Layout backgrounds (white theme)
        'dark-bg': '#f0f4f8',        // page background (light gray-blue)
        'dark-card': '#ffffff',       // card / sidebar white
        'dark-card-hover': '#f8fafc', // subtle hover
        'dark-border': '#cbd5e1',     // border color
        'dark-border-hover': '#94a3b8', // border hover

        // Green accent palette
        'green-primary': '#047857',    // deep professional green (emerald-700)
        'green-secondary': '#065f46',  // darker green (emerald-800)
        'green-dark': '#064e3b',       // very dark green (emerald-900)
        'green-light': '#059669',      // lighter accent (emerald-600)
        'green-muted': 'rgba(4, 120, 87, 0.08)',

        // Status colors
        'red-primary': '#dc2626',
        'red-secondary': '#b91c1c',
        'red-muted': 'rgba(220, 38, 38, 0.08)',
        'yellow-primary': '#d97706',
        'yellow-muted': 'rgba(217, 119, 6, 0.08)',
        'blue-primary': '#2563eb',
        'blue-muted': 'rgba(37, 99, 235, 0.08)',
        'purple-primary': '#7c3aed',
        'purple-muted': 'rgba(124, 58, 237, 0.08)',

        // Typography
        'gray-text': '#475569',   // secondary text (slate-600)
        'gray-light': '#0f172a',  // primary text (slate-900)
        'gray-muted': '#64748b',  // placeholder / muted (slate-500)
      },
      backgroundImage: {
        'gradient-green': 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
        'gradient-light': 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        'gradient-card': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(4, 120, 87, 0.04) 0%, transparent 100%)',
        'gradient-hero': 'linear-gradient(135deg, #047857 0%, #065f46 50%, #0f172a 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(4, 120, 87, 0.2)',
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'elevated': '0 8px 32px rgba(0,0,0,0.10)',
        'sidebar': '2px 0 16px rgba(0,0,0,0.05)',
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

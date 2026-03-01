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
        'dark-bg': '#0a0e14',
        'dark-card': '#111822',
        'dark-card-hover': '#151e2b',
        'dark-border': '#1e2936',
        'dark-border-hover': '#2a3a4d',
        'green-primary': '#00ff88',
        'green-secondary': '#00cc6f',
        'green-dark': '#009954',
        'green-muted': 'rgba(0, 255, 136, 0.08)',
        'red-primary': '#ff4757',
        'red-secondary': '#ee3344',
        'red-muted': 'rgba(255, 71, 87, 0.08)',
        'yellow-primary': '#ffd93d',
        'yellow-muted': 'rgba(255, 217, 61, 0.08)',
        'blue-primary': '#3b82f6',
        'blue-muted': 'rgba(59, 130, 246, 0.08)',
        'purple-primary': '#8b5cf6',
        'purple-muted': 'rgba(139, 92, 246, 0.08)',
        'gray-text': '#8b92a8',
        'gray-light': '#c9d1d9',
        'gray-muted': '#5a6478',
      },
      backgroundImage: {
        'gradient-green': 'linear-gradient(135deg, #00ff88 0%, #00cc6f 100%)',
        'gradient-dark': 'linear-gradient(145deg, #111822 0%, #0a0e14 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(17, 24, 34, 0.95) 0%, rgba(14, 20, 28, 0.95) 100%)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(0, 255, 136, 0.03) 0%, transparent 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.15)',
        'glow-red': '0 0 20px rgba(255, 71, 87, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.3)',
        'elevated': '0 12px 48px rgba(0, 0, 0, 0.4)',
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
    },
  },
  plugins: [],
};

export default config;

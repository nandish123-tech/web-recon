/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'recon': {
          'bg': '#0a0e14',
          'surface': '#0d1117',
          'card': '#161b22',
          'card2': '#1c2128',
          'border': '#21262d',
          'border2': '#30363d',
          'text': '#c9d1d9',
          'muted': '#6e7681',
          'cyan': '#58a6ff',
          'cyan-bright': '#79c0ff',
          'green': '#3fb950',
          'amber': '#d29922',
          'red': '#f85149',
          'purple': '#a371f7',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan-line 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'scan-line': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'glow': {
          'from': { boxShadow: '0 0 5px rgba(88, 166, 255, 0.2)' },
          'to': { boxShadow: '0 0 20px rgba(88, 166, 255, 0.4)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Iron Man HUD Colors
        hudBg: "#01030a",          // deep space black
        hudBgAlt: "#02060d",       // deep navy
        hudBgSecondary: "#01030a", // deep space
        
        // Neon Cyan/Blue accents
        cyan: "#00f6ff",           // neon cyan
        cyanAccent: "#00eaff",     // stark blue
        blueAccent: "#16f0ff",     // quantum blue
        blueSubtle: "#a249ff",     // plasma violet
        
        // Text colors
        hudText: "rgba(255,255,255,0.85)",  // nano white
        hudSubtle: "rgba(255,255,255,0.6)", // subtle white
        hudWhite: "#FFFFFF",       // pure white
        
        // Status colors
        hudWarning: "#FFB347",     // warning
        hudError: "#FF4B5C",       // error
        
        // Legacy support
        'neon-orange': '#00f6ff',
        'neon-gold': '#00eaff',
        'neon-blue': '#00f6ff',
        'neonPurple': '#a249ff',
        'neonPink': '#00eaff',
        'neonBlue': '#00f6ff',
        'neonSoftBlue': '#16f0ff',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'rajdhani': ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 12px rgba(0,229,255,0.7)',
        'blue-glow': '0 0 18px rgba(0,148,255,0.6)',
        'cyan-soft': '0 0 8px rgba(0,229,255,0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'rotate-slow': 'rotate 20s linear infinite',
        'rotate-medium': 'rotate 15s linear infinite',
        'rotate-fast': 'rotate 10s linear infinite',
        'scan-line': 'scanLine 3s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scanLine: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}

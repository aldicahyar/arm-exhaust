import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Readex Pro'", "'Inter'", 'system-ui', 'sans-serif'],
        geist: ["'Geist'", "'Plus Jakarta Sans'", "'Inter'", 'sans-serif'],
        jakarta: ["'Plus Jakarta Sans'", "'Inter'", 'sans-serif'],
      },
      colors: {
        warm: {
          bg: '#fffbf5',
          surface: '#ffffff',
          card: '#ffffff',
          hover: '#fbf5ea',
          border: '#eedec5',
          text: '#1e1501',
          muted: '#786b53',
          primary: '#f8a712',
          'primary-hover': '#e09207',
          secondary: '#f7fb7e',
          accent: '#d6fa47',
        },
      },
    },
  },
  plugins: [],
};

export default config;

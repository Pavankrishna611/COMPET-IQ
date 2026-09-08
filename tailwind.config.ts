import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Locked Primary Colors
        navy: {
          DEFAULT: '#123B66',
          dark: '#0D2B4A',
          light: '#1B4E85',
        },
        primary: {
          DEFAULT: '#1769AA',
          hover: '#13568C',
          light: '#E8F1F9',
        },
        // Locked Intelligence / Analytics
        teal: {
          DEFAULT: '#0E9F9A',
          hover: '#0B837F',
          light: '#DDF5F3',
        },
        // Locked AI Accent (sparingly)
        ai: {
          
          purple: '#6B5DD3',
          light: '#F0EEFC',
        },
        // Surfaces & Backgrounds
        background: '#F5F8FC',
        surface: '#FFFFFF',
        border: {
          DEFAULT: '#D9E2EC',
          light: '#EDF2F7',
          dark: '#BAC7D5',
        },
        // Typography Colors
        text: {
          primary: '#172B4D',
          secondary: '#526579',
          muted: '#7A8A9A',
        },
        // Semantic Alerts
        success: {
          DEFAULT: '#16855B',
          light: '#E7F6F0',
        },
        warning: {
          DEFAULT: '#D99000',
          light: '#FFF7E6',
        },
        critical: {
          DEFAULT: '#C93636',
          light: '#FDF0F0',
        },
        info: {
          DEFAULT: '#1769AA',
          light: '#E8F1F9',
        },
      },
      borderRadius: {
        btn: '8px',
        card: '12px',
        panel: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(18, 59, 102, 0.05), 0 1px 2px rgba(18, 59, 102, 0.03)',
        'card-hover': '0 4px 12px rgba(18, 59, 102, 0.08), 0 1px 3px rgba(18, 59, 102, 0.04)',
        modal: '0 12px 32px rgba(18, 59, 102, 0.15)',
        dropdown: '0 4px 16px rgba(18, 59, 102, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

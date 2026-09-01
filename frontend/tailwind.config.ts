import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#51a8b1',
          50: '#f0f8f9',
          100: '#d9eef0',
          200: '#b6e0e4',
          300: '#84ccd3',
          400: '#51a8b1', // Brand Primary
          500: '#40949d',
          600: '#347981',
          700: '#3a7d84', // Headings / Strong Brand
          800: '#265459',
          900: '#1b3b3f',
        },
        green: {
          DEFAULT: '#a8cf45',
          50: '#f7fbe9',
          100: '#eff8d0',
          200: '#dfefa6',
          300: '#cbe475',
          400: '#a8cf45', // Brand Accent / Success
          500: '#94bc33',
          600: '#759724',
          700: '#58731f',
          800: '#465b1c',
          900: '#3c4c1c',
        },
        grey: {
          DEFAULT: '#b9c0cb',
          50: '#f8f9fa',
          100: '#f1f3f6',
          200: '#e2e6eb',
          300: '#b9c0cb', // Neutral Support
          400: '#949ea9',
          500: '#6f7b88',
          600: '#4a5462', // Light / Secondary Text
          700: '#333333', // Dark / Primary Text
          800: '#2f4154', // Footer / Dark Panel BG
          900: '#1e293b',
        },
        brand: {
          teal: '#51a8b1',
          tealDark: '#3a7d84',
          tealLight: '#f0f8f9',
          green: '#a8cf45',
          greenLight: '#f7fbe9',
          grey: '#b9c0cb',
          darkText: '#333333',
          lightText: '#4a5462',
          footerBg: '#2f4154',
          footerText: '#d1d8df',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
      }
    }
  },
  plugins: []
};

export default config;

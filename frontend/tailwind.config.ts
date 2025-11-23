import type { Config } from 'tailwindcss'
import { tokens } from './styles/tokens'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        surface: tokens.colors.surface,
        text: tokens.colors.text,
        border: tokens.colors.border,
        status: tokens.colors.status,
      },
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      fontWeight: tokens.typography.fontWeight,
      lineHeight: tokens.typography.lineHeight,
      zIndex: tokens.zIndex,
      transitionDuration: tokens.transitions,
    },
  },
  plugins: [],
}
export default config


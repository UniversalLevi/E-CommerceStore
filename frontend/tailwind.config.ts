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
      fontFamily: {
        sans: [...tokens.typography.fontFamily.sans],
        mono: [...tokens.typography.fontFamily.mono],
      },
      fontSize: tokens.typography.fontSize,
      fontWeight: {
        normal: tokens.typography.fontWeight.normal.toString(),
        medium: tokens.typography.fontWeight.medium.toString(),
        semibold: tokens.typography.fontWeight.semibold.toString(),
        bold: tokens.typography.fontWeight.bold.toString(),
      },
      lineHeight: {
        tight: tokens.typography.lineHeight.tight.toString(),
        normal: tokens.typography.lineHeight.normal.toString(),
        relaxed: tokens.typography.lineHeight.relaxed.toString(),
      },
      zIndex: {
        dropdown: tokens.zIndex.dropdown.toString(),
        sticky: tokens.zIndex.sticky.toString(),
        fixed: tokens.zIndex.fixed.toString(),
        modalBackdrop: tokens.zIndex.modalBackdrop.toString(),
        modal: tokens.zIndex.modal.toString(),
        popover: tokens.zIndex.popover.toString(),
        tooltip: tokens.zIndex.tooltip.toString(),
      },
      transitionDuration: tokens.transitions,
    },
  },
  plugins: [],
}
export default config


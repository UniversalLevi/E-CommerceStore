// Theme tokens for dark theme with custom color palette
export const tokens = {
  colors: {
    // Primary (Cyan - #1AC8ED)
    primary: {
      50: '#e6f7fc',
      100: '#cceff9',
      200: '#99dff3',
      300: '#66cfed',
      400: '#33bfe7',
      500: '#1AC8ED', // Cyan - main primary
      600: '#17b4d5',
      700: '#14a0bd',
      800: '#118ca5',
      900: '#0e788d',
    },
    // Secondary (Muted Teal - #87BBA2)
    secondary: {
      50: '#f0f7f4',
      100: '#d4e8df',
      200: '#b8d9ca',
      300: '#9ccab5',
      400: '#a0c5a8',
      500: '#87BBA2', // Muted Teal - main secondary
      600: '#79a892',
      700: '#6b9582',
      800: '#5d8272',
      900: '#4f6f62',
    },
    // Accent (Blue Slate - #5D737E)
    accent: {
      50: '#f4f6f7',
      100: '#d9e0e3',
      200: '#becacf',
      300: '#a3b4bb',
      400: '#889ea7',
      500: '#5D737E', // Blue Slate - main accent
      600: '#546771',
      700: '#4b5b64',
      800: '#424f57',
      900: '#39434a',
    },
    // Dark surface colors (Black base - #000000)
    surface: {
      base: '#000000', // Black
      elevated: '#0a0a0a',
      raised: '#1a1a1a',
      hover: '#2a2a2a',
    },
    // Text colors (Mint Cream - #F0F7EE)
    text: {
      primary: '#F0F7EE', // Mint Cream - primary text
      secondary: '#d1d9d4',
      tertiary: '#b2baba',
      muted: '#939ba0',
    },
    // Border colors
    border: {
      default: '#5D737E', // Blue Slate
      muted: '#3a4a52',
      focus: '#1AC8ED', // Cyan
    },
    // Status colors
    status: {
      success: '#87BBA2', // Muted Teal
      error: '#ef4444',
      warning: '#1AC8ED', // Cyan
      info: '#5D737E', // Blue Slate
    },
    // Background gradients
    gradient: {
      primary: 'linear-gradient(135deg, #1AC8ED 0%, #17b4d5 100%)',
      surface: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
      accent: 'linear-gradient(135deg, #5D737E 0%, #87BBA2 100%)',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Menlo', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
  transitions: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },
} as const;


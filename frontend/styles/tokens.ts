// Theme tokens for black, grey, and white color palette
export const tokens = {
  colors: {
    // Primary (White - #ffffff)
    primary: {
      50: '#ffffff',
      100: '#f5f5f5',
      200: '#e0e0e0',
      300: '#c0c0c0',
      400: '#a0a0a0',
      500: '#ffffff', // White - main primary
      600: '#e0e0e0',
      700: '#c0c0c0',
      800: '#a0a0a0',
      900: '#808080',
    },
    // Secondary (Light Grey - #e0e0e0)
    secondary: {
      50: '#f5f5f5',
      100: '#e0e0e0',
      200: '#c0c0c0',
      300: '#a0a0a0',
      400: '#808080',
      500: '#e0e0e0', // Light Grey - main secondary
      600: '#c0c0c0',
      700: '#a0a0a0',
      800: '#808080',
      900: '#606060',
    },
    // Accent (Medium Grey - #808080)
    accent: {
      50: '#f5f5f5',
      100: '#e0e0e0',
      200: '#c0c0c0',
      300: '#a0a0a0',
      400: '#808080',
      500: '#808080', // Medium Grey - main accent
      600: '#606060',
      700: '#505050',
      800: '#404040',
      900: '#2a2a2a',
    },
    // Dark surface colors (Black base - #000000)
    surface: {
      base: '#000000', // Black
      elevated: '#0a0a0a',
      raised: '#1a1a1a',
      hover: '#2a2a2a',
    },
    // Text colors (White and Grey scale)
    text: {
      primary: '#ffffff', // White - primary text
      secondary: '#a0a0a0', // Light grey - secondary text
      tertiary: '#808080', // Medium grey - tertiary text
      muted: '#606060', // Dark grey - muted text
    },
    // Border colors
    border: {
      default: '#505050', // Medium grey
      muted: '#404040', // Dark grey
      focus: '#808080', // Light grey
    },
    // Status colors (using grey scale, keeping red for errors)
    status: {
      success: '#808080', // Medium grey
      error: '#ef4444', // Keep red for errors
      warning: '#a0a0a0', // Light grey
      info: '#606060', // Dark grey
    },
    // Background gradients
    gradient: {
      primary: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
      surface: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
      accent: 'linear-gradient(135deg, #808080 0%, #606060 100%)',
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


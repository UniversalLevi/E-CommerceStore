export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  [key: string]: string;
}

export interface ThemeTypography {
  fontFamily: string;
  headingFont: string;
  fontSize: string;
  [key: string]: string;
}

export interface ThemeLayout {
  containerWidth?: string;
  spacing?: string;
  borderRadius?: string;
  [key: string]: any;
}

export interface ThemeCustomization {
  colors?: Partial<ThemeColors>;
  typography?: Partial<ThemeTypography>;
  layout?: ThemeLayout;
  logo?: string;
}

export interface ThemeConfig {
  name: string;
  displayName: string;
  description: string;
  category: 'minimal' | 'modern' | 'luxury' | 'bold' | 'dark' | 'tech' | 'custom';
  previewImage?: string;
  defaultColors: ThemeColors;
  defaultTypography: ThemeTypography;
  customizableProperties: string[];
}

export interface StoreTheme {
  name: string;
  customizations: ThemeCustomization;
}

export interface ThemeContextValue {
  theme: StoreTheme | null;
  themeConfig: ThemeConfig | null;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  logo?: string;
  isLoading: boolean;
}

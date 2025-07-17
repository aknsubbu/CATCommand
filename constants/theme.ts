// CAT Colors Theme System
// A clean, modern design system inspired by feline elegance

export const colors = {
  // Primary brand colors - warm and inviting like a cat's fur
  primary: "#FF7A00", // Main orange - like a tabby's coat
  primaryLight: "#FF9840",
  primaryDark: "#CC4400",

  // Secondary colors - inspired by cat eye colors
  secondary: "#0EA5E9", // Bright blue - like cat eyes
  secondaryLight: "#38BDF8",
  secondaryDark: "#0369A1",

  // Accent colors - playful and energetic
  accent: "#8B5CF6", // Purple - playful
  accentPink: "#EC4899", // Pink - cute
  accentGreen: "#10B981", // Green - fresh
  accentAmber: "#F59E0B", // Amber - attention-grabbing

  // Background colors - neutral and calming
  background: {
    primary: "#FFFFFF",
    secondary: "#F8FAFC",
    tertiary: "#F1F5F9",
    light: "#FFFFFF", // Added this property
    dark: {
      primary: "#0F172A",
      secondary: "#1E293B",
      tertiary: "#334155",
    },
    overlay: "rgba(0, 0, 0, 0.5)",
  },

  // Text colors - high contrast and readable
  text: {
    primary: "#1E293B",
    secondary: "#64748B",
    tertiary: "#94A3B8",
    light: "#FFFFFF",
    muted: "#CBD5E1",
    inverse: "#F8FAFC",
    dark: {
      primary: "#F8FAFC",
      secondary: "#E2E8F0",
      tertiary: "#CBD5E1",
    },
  },

  // Status colors - clear and intuitive
  status: {
    success: "#22C55E",
    successLight: "#DCFCE7",
    successDark: "#15803D",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    warningDark: "#D97706",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    errorDark: "#DC2626",
    info: "#3B82F6",
    infoLight: "#DBEAFE",
    infoDark: "#1D4ED8",
  },

  // Voice interaction states - inspired by cat behaviors
  voice: {
    idle: "#94A3B8", // Calm gray - sleeping cat
    listening: "#EF4444", // Alert red - attentive cat
    processing: "#F59E0B", // Thinking amber - curious cat
    speaking: "#22C55E", // Active green - playful cat
  },

  // UI elements
  border: "#CBD5E1",
  borderLight: "#E2E8F0",
  borderDark: "#475569",

  shadow: "rgba(0, 0, 0, 0.1)",
  shadowLight: "rgba(0, 0, 0, 0.05)",
  shadowDark: "rgba(0, 0, 0, 0.25)",

  // Interactive states
  interactive: {
    hover: "rgba(255, 122, 0, 0.08)",
    focus: "rgba(255, 122, 0, 0.12)",
    active: "rgba(255, 122, 0, 0.16)",
    disabled: "#F1F5F9",
  },
};

// Typography system - clean and readable
export const typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
};

// Spacing system - consistent and harmonious
export const spacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 80,
  "5xl": 96,
};

// Border radius system - modern and friendly
export const borderRadius = {
  none: 0,
  sm: 2,
  base: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  "3xl": 24,
  full: 9999,
};

// Shadow system - subtle depth
export const shadows = {
  xs: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  base: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 12,
  },
};

// Animation system - smooth and delightful
export const animation = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
    slowest: 1000,
  },

  easing: {
    linear: "linear",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  spring: {
    gentle: { tension: 120, friction: 14 },
    wobbly: { tension: 180, friction: 12 },
    stiff: { tension: 210, friction: 20 },
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  "2xl": 1400,
};

// Z-index system - proper layering
export const zIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Component-specific theme tokens
export const components = {
  button: {
    height: {
      sm: 32,
      md: 40,
      lg: 48,
    },
    padding: {
      sm: { x: 12, y: 6 },
      md: { x: 16, y: 8 },
      lg: { x: 20, y: 10 },
    },
  },

  card: {
    padding: spacing.lg,
    radius: borderRadius.lg,
    shadow: shadows.base,
  },

  input: {
    height: 44,
    padding: { x: 12, y: 10 },
    radius: borderRadius.md,
    border: colors.border,
  },
};

// Theme variants
export const themes = {
  light: {
    colors: {
      ...colors,
      background: colors.background,
      text: colors.text,
    },
  },

  dark: {
    colors: {
      ...colors,
      background: colors.background.dark,
      text: colors.text.dark,
    },
  },
};

// Export default theme
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  components,
  themes,
};

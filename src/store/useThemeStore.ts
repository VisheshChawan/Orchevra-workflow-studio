import { create } from 'zustand';

export type ThemePreset = 'developer' | 'classy' | 'enterprise' | 'github' | 'vercel' | 'glass' | 'minimal' | 'cyberpunk' | 'retro';
export type AccentColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'red';
export type NodeStyle = 'rounded' | 'sharp' | 'glass' | 'minimal' | 'modern';
export type CanvasBg = 'grid' | 'dots' | 'gradient' | 'mesh' | 'solid';
export type ThemeMode = 'dark' | 'light' | 'system';
export type FontFamily = 'inter' | 'spaceGrotesk' | 'jetbrainsMono' | 'outfit' | 'geist' | 'satoshi';
export type FontSize = 'comfortable' | 'compact' | 'large';

// Dynamic Theme Engine Properties
export type ShadowStyle = 'subtle' | 'flat' | 'elevated' | 'glow' | 'deep';
export type AnimationSpeed = 'none' | 'cyberTick' | 'smooth' | 'bouncy' | 'spring';
export type LayoutPositioning = 'left-sidebar' | 'right-sidebar';
export type ToolbarPosition = 'top' | 'bottom';
export type BorderRadiusOption = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type SpacingDensity = 'compact' | 'comfortable' | 'spacious';

interface ThemeState {
  preset: ThemePreset;
  accent: AccentColor;
  nodeStyle: NodeStyle;
  canvasBg: CanvasBg;
  devMode: boolean;
  mode: ThemeMode;
  fontFamily: FontFamily;
  fontSize: FontSize;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  
  // Theme Engine Values
  shadowStyle: ShadowStyle;
  animationSpeed: AnimationSpeed;
  layoutPositioning: LayoutPositioning;
  toolbarPosition: ToolbarPosition;
  borderRadiusOption: BorderRadiusOption;
  spacingDensity: SpacingDensity;

  setPreset: (preset: ThemePreset) => void;
  setAccent: (accent: AccentColor) => void;
  setNodeStyle: (style: NodeStyle) => void;
  setCanvasBg: (bg: CanvasBg) => void;
  setDevMode: (devMode: boolean) => void;
  setMode: (mode: ThemeMode) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: FontSize) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;

  setShadowStyle: (shadow: ShadowStyle) => void;
  setAnimationSpeed: (anim: AnimationSpeed) => void;
  setLayoutPositioning: (layout: LayoutPositioning) => void;
  setToolbarPosition: (pos: ToolbarPosition) => void;
  setBorderRadiusOption: (radius: BorderRadiusOption) => void;
  setSpacingDensity: (density: SpacingDensity) => void;
}

const getStored = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(`theme-${key}`);
  return val ? (val as unknown as T) : fallback;
};

const getStoredBool = (key: string, fallback: boolean): boolean => {
  if (typeof window === 'undefined') return fallback;
  const val = localStorage.getItem(`theme-${key}`);
  return val !== null ? val === 'true' : fallback;
};

const setStored = (key: string, val: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`theme-${key}`, val);
  }
};

export const useThemeStore = create<ThemeState>((set) => ({
  preset: getStored<ThemePreset>('preset', 'enterprise'),
  accent: getStored<AccentColor>('accent', 'blue'),
  nodeStyle: getStored<NodeStyle>('nodeStyle', 'rounded'),
  canvasBg: getStored<CanvasBg>('canvasBg', 'dots'),
  devMode: getStoredBool('devMode', false),
  mode: getStored<ThemeMode>('mode', 'dark'),
  fontFamily: getStored<FontFamily>('fontFamily', 'geist'),
  fontSize: getStored<FontSize>('fontSize', 'comfortable'),
  sidebarCollapsed: getStoredBool('sidebarCollapsed', false),
  sidebarWidth: Number(getStored<string>('sidebarWidth', '320')),

  // Theme Engine Values defaults
  shadowStyle: getStored<ShadowStyle>('shadowStyle', 'subtle'),
  animationSpeed: getStored<AnimationSpeed>('animationSpeed', 'smooth'),
  layoutPositioning: getStored<LayoutPositioning>('layoutPositioning', 'left-sidebar'),
  toolbarPosition: getStored<ToolbarPosition>('toolbarPosition', 'top'),
  borderRadiusOption: getStored<BorderRadiusOption>('borderRadiusOption', 'md'),
  spacingDensity: getStored<SpacingDensity>('spacingDensity', 'comfortable'),

  setPreset: (preset) => {
    set({ preset });
    setStored('preset', preset);
  },
  setAccent: (accent) => {
    set({ accent });
    setStored('accent', accent);
  },
  setNodeStyle: (style) => {
    set({ nodeStyle: style });
    setStored('nodeStyle', style);
  },
  setCanvasBg: (bg) => {
    set({ canvasBg: bg });
    setStored('canvasBg', bg);
  },
  setDevMode: (devMode) => {
    set({ devMode });
    setStored('devMode', String(devMode));
  },
  setMode: (mode) => {
    set({ mode });
    setStored('mode', mode);
  },
  setFontFamily: (fontFamily) => {
    set({ fontFamily });
    setStored('fontFamily', fontFamily);
  },
  setFontSize: (fontSize) => {
    set({ fontSize });
    setStored('fontSize', fontSize);
  },
  setSidebarCollapsed: (sidebarCollapsed) => {
    set({ sidebarCollapsed });
    setStored('sidebarCollapsed', String(sidebarCollapsed));
  },
  setSidebarWidth: (sidebarWidth) => {
    set({ sidebarWidth });
    setStored('sidebarWidth', String(sidebarWidth));
  },

  setShadowStyle: (shadowStyle) => {
    set({ shadowStyle });
    setStored('shadowStyle', shadowStyle);
  },
  setAnimationSpeed: (animationSpeed) => {
    set({ animationSpeed });
    setStored('animationSpeed', animationSpeed);
  },
  setLayoutPositioning: (layoutPositioning) => {
    set({ layoutPositioning });
    setStored('layoutPositioning', layoutPositioning);
  },
  setToolbarPosition: (toolbarPosition) => {
    set({ toolbarPosition });
    setStored('toolbarPosition', toolbarPosition);
  },
  setBorderRadiusOption: (borderRadiusOption) => {
    set({ borderRadiusOption });
    setStored('borderRadiusOption', borderRadiusOption);
  },
  setSpacingDensity: (spacingDensity) => {
    set({ spacingDensity });
    setStored('spacingDensity', spacingDensity);
  },
}));

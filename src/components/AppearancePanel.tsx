import React, { useState } from 'react';
import { 
  useThemeStore, 
  ThemePreset, 
  AccentColor, 
  NodeStyle, 
  CanvasBg, 
  ThemeMode, 
  FontFamily, 
  FontSize,
  ShadowStyle,
  AnimationSpeed,
  LayoutPositioning,
  ToolbarPosition,
  BorderRadiusOption,
  SpacingDensity
} from '../store/useThemeStore';
import { 
  Palette, 
  Layers, 
  Box, 
  Columns, 
  CircleCheck, 
  Sliders, 
  Sparkles, 
  Type, 
  Sun, 
  Moon, 
  Laptop, 
  Percent,
  Move,
  Zap,
  LayoutGrid,
  ShieldCheck
} from 'lucide-react';

export const AppearancePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    preset,
    accent,
    nodeStyle,
    canvasBg,
    devMode,
    mode,
    fontFamily,
    fontSize,
    shadowStyle,
    animationSpeed,
    layoutPositioning,
    toolbarPosition,
    borderRadiusOption,
    spacingDensity,
    setPreset,
    setAccent,
    setNodeStyle,
    setCanvasBg,
    setDevMode,
    setMode,
    setFontFamily,
    setFontSize,
    setShadowStyle,
    setAnimationSpeed,
    setLayoutPositioning,
    setToolbarPosition,
    setBorderRadiusOption,
    setSpacingDensity,
  } = useThemeStore();

  const presets: Array<{ id: ThemePreset; name: string; desc: string }> = [
    { id: 'enterprise', name: 'Orchevra Enterprise', desc: 'Premium deep dark slate with high refined depth' },
    { id: 'developer', name: 'Developer Mode', desc: 'Monospace, ultra-fast transitions, and custom diagnostic grids' },
    { id: 'classy', name: 'Classy Editorial', desc: 'Warm stone serif display styles and rich bronze outlines' },
    { id: 'github', name: 'GitHub Slate', desc: 'Developer familiar code layout and compact tabs' },
    { id: 'vercel', name: 'Vercel Monochrome', desc: 'Pure black-and-white flat geometry with no-nonsense density' },
    { id: 'glass', name: 'Satin Glass', desc: 'Sophisticated frosted backdrop panels' },
    { id: 'minimal', name: 'Minimal Outline', desc: 'Wireframe margins, zero shadows, clean borders' },
    { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'High-voltage electric warning tags and immersive neon glow' },
    { id: 'retro', name: 'Retro Terminal', desc: 'Monochromatic green CRT phosphor grids and IBM-era spacing' }
  ];

  const accents: Array<{ id: AccentColor; name: string; colorClass: string }> = [
    { id: 'purple', name: 'Purple', colorClass: 'bg-purple-500' },
    { id: 'blue', name: 'Blue', colorClass: 'bg-blue-500' },
    { id: 'green', name: 'Green', colorClass: 'bg-emerald-500' },
    { id: 'orange', name: 'Orange', colorClass: 'bg-amber-500' },
    { id: 'pink', name: 'Pink', colorClass: 'bg-pink-500' },
    { id: 'red', name: 'Red', colorClass: 'bg-rose-500' },
  ];

  const styles: Array<{ id: NodeStyle; name: string; desc: string }> = [
    { id: 'rounded', name: 'Rounded Bubble', desc: 'Sleek standard 12px margins' },
    { id: 'sharp', name: 'Razor Edge', desc: 'Zero border-radius box' },
    { id: 'glass', name: 'Frosted Glass', desc: 'Transparent glowing backdrop' },
    { id: 'minimal', name: 'Minimal Flat', desc: 'Thin outline-only geometry' },
    { id: 'modern', name: 'SaaS Card', desc: 'Subtle shadow with offset' },
  ];

  const backgrounds: Array<{ id: CanvasBg; name: string }> = [
    { id: 'dots', name: 'Dots Grid' },
    { id: 'grid', name: 'Engineer Graph' },
    { id: 'gradient', name: 'Space Gradient' },
    { id: 'mesh', name: 'Cyber Mesh' },
    { id: 'solid', name: 'Solid Canvas' },
  ];

  const fontFamilies: Array<{ id: FontFamily; name: string }> = [
    { id: 'inter', name: 'Inter Sans' },
    { id: 'spaceGrotesk', name: 'Space Grotesk' },
    { id: 'jetbrainsMono', name: 'JetBrains Mono' },
    { id: 'outfit', name: 'Outfit Display' },
    { id: 'geist', name: 'Geist Monospace' },
    { id: 'satoshi', name: 'Satoshi Geometric' },
  ];

  const fontSizes: Array<{ id: FontSize; name: string }> = [
    { id: 'compact', name: 'Compact (SM)' },
    { id: 'comfortable', name: 'Default (MD)' },
    { id: 'large', name: 'Expansive (LG)' },
  ];

  // Engine Extra Catalogs
  const shadowStyles: Array<{ id: ShadowStyle; name: string; desc: string }> = [
    { id: 'flat', name: 'Flat', desc: 'High-contrast sharp outline' },
    { id: 'subtle', name: 'Subtle', desc: 'Soft SaaS professional look' },
    { id: 'elevated', name: 'Elevated', desc: 'Layered height offsets' },
    { id: 'glow', name: 'Glow', desc: 'Neon ambient container glow' },
    { id: 'deep', name: 'Deep', desc: 'Heavy immersive blurred drops' }
  ];

  const animationSpeeds: Array<{ id: AnimationSpeed; name: string; desc: string }> = [
    { id: 'none', name: 'None', desc: 'Disable motion instantly' },
    { id: 'cyberTick', name: 'Tick', desc: 'Super fast robotic snaps' },
    { id: 'smooth', name: 'Smooth', desc: 'Cohesive easing and transitions' },
    { id: 'spring', name: 'Spring', desc: 'Snappy crisp physics' },
    { id: 'bouncy', name: 'Bouncy', desc: 'Lively spring curves' }
  ];

  const layoutPositionings: Array<{ id: LayoutPositioning; name: string }> = [
    { id: 'left-sidebar', name: 'Left Sidebar' },
    { id: 'right-sidebar', name: 'Right Sidebar' }
  ];

  const toolbarPositions: Array<{ id: ToolbarPosition; name: string }> = [
    { id: 'top', name: 'Top Dock' },
    { id: 'bottom', name: 'Bottom Dock' }
  ];

  const borderRadiusOptions: Array<{ id: BorderRadiusOption; name: string }> = [
    { id: 'none', name: 'Sharp (0px)' },
    { id: 'sm', name: 'Snail (6px)' },
    { id: 'md', name: 'Middle (12px)' },
    { id: 'lg', name: 'Curved (18px)' },
    { id: 'full', name: 'Organic (28px)' }
  ];

  const spacingDensities: Array<{ id: SpacingDensity; name: string }> = [
    { id: 'compact', name: 'Compact' },
    { id: 'comfortable', name: 'Default' },
    { id: 'spacious', name: 'Spacious' }
  ];

  // Adaptive alignment so customize panel slides out on opposite side of active sidebar positioning!
  const panelAnchorClass = layoutPositioning === 'right-sidebar' ? 'left-4 items-start' : 'right-4 items-end';

  return (
    <div className={`absolute top-[84px] z-50 flex flex-col ${panelAnchorClass}`}>
      {/* Floating Customize Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300 shadow-xl ${
          isOpen
            ? 'bg-indigo-600 border-indigo-400 text-white scale-110 shadow-indigo-500/20'
            : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300 hover:scale-105'
        }`}
        title="Customize Engine & Dynamic Themes (Theme Panel)"
      >
        <Palette className="w-5 h-5" />
      </button>

      {/* Floating Options Panel */}
      {isOpen && (
        <div className="mt-2 w-[340px] max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-800/80 bg-slate-950/95 backdrop-blur-xl p-4 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300 scrollbar-themed">
          {/* Header */}
          <div className="border-b border-slate-900 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Theme Engine Settings
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">
              Alter layout alignment, density, shadows, borders, and animations instantly.
            </p>
          </div>

          {/* Preset templates */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-indigo-400" /> Master Preset Mode
            </span>
            <div className="grid grid-cols-1 gap-1 max-h-[120px] overflow-y-auto pr-1">
              {presets.map((p) => {
                const isActive = preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPreset(p.id);
                      // Apply master styles for selected workspace preset
                      if (p.id === 'developer') {
                        setCanvasBg('grid');
                        setNodeStyle('sharp');
                        setShadowStyle('flat');
                        setAnimationSpeed('cyberTick');
                        setBorderRadiusOption('none');
                        setFontFamily('jetbrainsMono');
                        setSpacingDensity('compact');
                      } else if (p.id === 'glass') {
                        setCanvasBg('gradient');
                        setNodeStyle('glass');
                        setShadowStyle('deep');
                        setAnimationSpeed('smooth');
                        setBorderRadiusOption('lg');
                        setFontFamily('spaceGrotesk');
                      } else if (p.id === 'vercel') {
                        setCanvasBg('solid');
                        setNodeStyle('minimal');
                        setShadowStyle('flat');
                        setAnimationSpeed('none');
                        setBorderRadiusOption('none');
                        setFontFamily('geist');
                        setSpacingDensity('compact');
                      } else if (p.id === 'github') {
                        setCanvasBg('grid');
                        setNodeStyle('modern');
                        setShadowStyle('subtle');
                        setAnimationSpeed('spring');
                        setBorderRadiusOption('sm');
                        setFontFamily('inter');
                      } else if (p.id === 'enterprise') {
                        setCanvasBg('dots');
                        setNodeStyle('rounded');
                        setShadowStyle('subtle');
                        setAnimationSpeed('smooth');
                        setBorderRadiusOption('md');
                        setFontFamily('geist');
                        setSpacingDensity('comfortable');
                      } else if (p.id === 'classy') {
                        setCanvasBg('gradient');
                        setNodeStyle('modern');
                        setShadowStyle('elevated');
                        setAnimationSpeed('spring');
                        setBorderRadiusOption('md');
                        setFontFamily('satoshi');
                      } else if (p.id === 'minimal') {
                        setCanvasBg('solid');
                        setNodeStyle('minimal');
                        setShadowStyle('flat');
                        setAnimationSpeed('none');
                        setBorderRadiusOption('none');
                        setFontFamily('inter');
                        setSpacingDensity('compact');
                      } else if (p.id === 'cyberpunk') {
                        setCanvasBg('mesh');
                        setNodeStyle('sharp');
                        setShadowStyle('glow');
                        setAnimationSpeed('bouncy');
                        setBorderRadiusOption('none');
                        setFontFamily('spaceGrotesk');
                        setSpacingDensity('comfortable');
                        setAccent('orange');
                      } else if (p.id === 'retro') {
                        setCanvasBg('grid');
                        setNodeStyle('sharp');
                        setShadowStyle('flat');
                        setAnimationSpeed('cyberTick');
                        setBorderRadiusOption('none');
                        setFontFamily('jetbrainsMono');
                        setSpacingDensity('compact');
                        setAccent('green');
                      }
                    }}
                    className={`w-full text-left p-2 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100 shadow-lg'
                        : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-900/40 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[10.5px]">{p.name}</div>
                      <div className="text-[9px] text-slate-500 italic mt-0.5">{p.desc}</div>
                    </div>
                    {isActive && <CircleCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION : COLOR & CANVAS */}
          <div className="p-2.5 rounded-xl bg-slate-900/20 border border-slate-900/50 flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              🎨 Interface Skin & Colors
            </span>

            {/* Mode selection (dark / light) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase">Light / Dark Tint</span>
              <div className="grid grid-cols-3 gap-1 bg-slate-950/40 p-1 rounded-lg border border-slate-900">
                {(['dark', 'light', 'system'] as ThemeMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                      mode === m
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300 bg-transparent'
                    }`}
                  >
                    {m === 'dark' && <Moon className="w-3 h-3" />}
                    {m === 'light' && <Sun className="w-3 h-3" />}
                    {m === 'system' && <Laptop className="w-3 h-3" />}
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase">Connector Signal Accent</span>
              <div className="grid grid-cols-6 gap-1.5">
                {accents.map((a) => {
                  const isActive = accent === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAccent(a.id)}
                      className={`h-6.5 rounded-lg relative flex items-center justify-center transition-all ${a.colorClass} ${
                        isActive ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105 shadow-xl' : 'opacity-65 hover:opacity-100'
                      }`}
                      title={`${a.name} Accent`}
                    >
                      {isActive && <CircleCheck className="w-3 h-3 text-white stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid style */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase">Canvas Background Grid</span>
              <div className="grid grid-cols-3 gap-1">
                {backgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setCanvasBg(bg.id)}
                    className={`py-1 rounded-lg border text-[9px] text-center font-bold font-sans transition-all ${
                      canvasBg === bg.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900/40 border-slate-900/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {bg.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION : TYPOGRAPHY & SPACING */}
          <div className="p-2.5 rounded-xl bg-slate-900/20 border border-slate-900/50 flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              🔤 Typography & Density
            </span>

            {/* Font Family */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase">Font Family Spec</span>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                className="w-full text-xs text-slate-200 bg-slate-900 border border-slate-850 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
              >
                {fontFamilies.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-950 text-slate-200">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* FontSize / Text Scale */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase">Header Typography Scale</span>
              <div className="grid grid-cols-3 gap-1">
                {fontSizes.map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => setFontSize(sz.id)}
                    className={`py-1 text-[9px] rounded-lg border text-center font-semibold transition-all ${
                      fontSize === sz.id
                        ? 'bg-indigo-600/20 border-indigo-400 text-white'
                        : 'bg-slate-900/40 border-slate-900/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {sz.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing Density */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase">Layout Pad & Margin Density</span>
              <div className="grid grid-cols-3 gap-1">
                {spacingDensities.map((sd) => (
                  <button
                    key={sd.id}
                    onClick={() => setSpacingDensity(sd.id)}
                    className={`py-1 text-[9px] rounded-lg border text-center font-semibold transition-all ${
                      spacingDensity === sd.id
                        ? 'bg-indigo-600/20 border-indigo-400 text-white'
                        : 'bg-slate-900/40 border-slate-900/60 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {sd.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION : NODE GEOMETRY & ENGINE DETAILS */}
          <div className="p-2.5 rounded-xl bg-slate-900/20 border border-slate-900/50 flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              📐 Frame Geometry & Shadows
            </span>

            {/* Custom rounded border radius option */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase">Border Corner Cuts</span>
              <div className="grid grid-cols-5 gap-1">
                {borderRadiusOptions.map((br) => (
                  <button
                    key={br.id}
                    onClick={() => setBorderRadiusOption(br.id)}
                    className={`py-1 px-0.5 rounded-lg border text-[8.5px] text-center font-sans tracking-tight transition-all font-semibold ${
                      borderRadiusOption === br.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-900/40 border-slate-900/60 text-slate-500 hover:text-slate-300'
                    }`}
                    title={br.name}
                  >
                    {br.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Shadows */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase">Elevation Shadows / Glow</span>
              <div className="grid grid-cols-5 gap-1">
                {shadowStyles.map((ss) => (
                  <button
                    key={ss.id}
                    onClick={() => setShadowStyle(ss.id)}
                    className={`py-1 px-0.5 rounded-lg border text-[8.5px] text-center font-sans tracking-tight transition-all font-semibold ${
                      shadowStyle === ss.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/40 border-slate-900/60 text-slate-500 hover:text-slate-300'
                    }`}
                    title={ss.desc}
                  >
                    {ss.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION : ALIGNMENT & COMPONENT POSITIONING */}
          <div className="p-2.5 rounded-xl bg-slate-900/20 border border-slate-900/50 flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              ⚙️ Component Pivots & Anchor Positions
            </span>

            {/* Layout Positioning (Sidebar Left or Right) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Move className="w-3 h-3 text-indigo-400" /> Workspace Sidebar Anchor
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {layoutPositionings.map((lp) => (
                  <button
                    key={lp.id}
                    onClick={() => setLayoutPositioning(lp.id)}
                    className={`py-1.5 rounded-lg border text-[9px] font-bold text-center transition-all ${
                      layoutPositioning === lp.id
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                        : 'bg-slate-900/40 border-slate-900 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {lp.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Toolbar Position (Top / Bottom) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <LayoutGrid className="w-3 h-3 text-indigo-400" /> Header Toolbar Dock Location
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {toolbarPositions.map((tp) => (
                  <button
                    key={tp.id}
                    onClick={() => setToolbarPosition(tp.id)}
                    className={`py-1.5 rounded-lg border text-[9px] font-bold text-center transition-all ${
                      toolbarPosition === tp.id
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                        : 'bg-slate-900/40 border-slate-900 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tp.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION : ANIMATION PRESETS */}
          <div className="p-2.5 rounded-xl bg-slate-900/20 border border-slate-900/50 flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              ⚡ Motion Physics & Transitions
            </span>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-400" /> Spring Easing curves
              </span>
              <div className="grid grid-cols-5 gap-1">
                {animationSpeeds.map((as) => (
                  <button
                    key={as.id}
                    onClick={() => setAnimationSpeed(as.id)}
                    className={`py-1 px-0.5 rounded-lg border text-[8.5px] text-center font-sans tracking-tight transition-all font-semibold ${
                      animationSpeed === as.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-900/40 border-slate-900/60 text-slate-500 hover:text-slate-300'
                    }`}
                    title={as.desc}
                  >
                    {as.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: DIAGNOSTICS */}
          <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-xl border border-slate-900/80">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1 font-sans">
                🛠️ Developer Insights
              </span>
              <span className="text-[8.5px] text-slate-500 font-sans">
                Render Handle IDs and live port identifiers
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={devMode}
                onChange={(e) => setDevMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

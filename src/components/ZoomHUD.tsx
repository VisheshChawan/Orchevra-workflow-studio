import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeStore } from '../store/useThemeStore';

interface ZoomHUDProps {
  zoomPercent: number;
}

export const ZoomHUD: React.FC<ZoomHUDProps> = ({ zoomPercent }) => {
  const { zoomIn, zoomOut, fitView, zoomTo } = useReactFlow();
  const { layoutPositioning } = useThemeStore();

  const handleResetZoom = () => {
    zoomTo(1, { duration: 300 });
  };

  const handleFitView = () => {
    fitView({ duration: 300 });
  };

  // Keep it opposite the sidebar positioning, near the bottom of the canvas
  const alignmentClass = layoutPositioning === 'right-sidebar' ? 'left-4' : 'right-4';

  return (
    <div id="canvas-zoom-hud" className={`absolute bottom-4 ${alignmentClass} z-50 flex items-center gap-2 select-none pointer-events-auto`}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-md"
      >
        {/* Zoom Out Button */}
        <button
          id="btn-zoom-out"
          onClick={() => zoomOut({ duration: 300 })}
          className="p-1 px-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Percent Display & Reset Button */}
        <button
          id="btn-zoom-reset"
          onClick={handleResetZoom}
          className="px-2 py-0.5 hover:bg-slate-900 rounded-lg text-slate-300 hover:text-white transition-colors text-[10.5px] font-mono font-bold tracking-tight min-w-[50px] text-center cursor-pointer"
          title="Reset Zoom to 100% (Ctrl+0)"
        >
          {zoomPercent}%
        </button>

        {/* Zoom In Button */}
        <button
          id="btn-zoom-in"
          onClick={() => zoomIn({ duration: 300 })}
          className="p-1 px-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-slate-800 mx-1 shrink-0" />

        {/* Fit Screen Button */}
        <button
          id="btn-zoom-fit"
          onClick={handleFitView}
          className="p-1 px-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider cursor-pointer"
          title="Fit Workflows to Viewport (Ctrl+1)"
        >
          <Maximize2 className="w-3 h-3 text-indigo-400" />
          <span className="hidden sm:inline text-[9px] text-slate-400">Fit</span>
        </button>
      </motion.div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Settings2, 
  Zap, 
  ZapOff,
  GitPullRequest,
  Activity,
  ArrowRight,
  Info
} from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

export const EdgeInspector: React.FC = () => {
  const { 
    edges, 
    selectedEdgeId, 
    selectEdge, 
    updateEdgeProperties, 
    deleteEdge 
  } = useWorkflowStore();

  // Find currently selected edge in active catalog
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  // Buffer fields for responsive field updates
  const [labelText, setLabelText] = useState('');

  useEffect(() => {
    if (selectedEdge) {
      setLabelText((selectedEdge.label as string) || '');
    } else {
      setLabelText('');
    }
  }, [selectedEdgeId, selectedEdge]);

  if (!selectedEdge) return null;

  // Handle Label update
  const handleLabelChange = (text: string) => {
    setLabelText(text);
    updateEdgeProperties(selectedEdge.id, {
      label: text || undefined,
      labelStyle: { fill: '#cbd5e1', fontWeight: 650, fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85, rx: 6, ry: 6 },
      labelBgPadding: [8, 5],
    });
  };

  // Preset neon colors for top SaaS design grade
  const colorPresets = [
    { name: 'Indigo', value: '#6366f1', border: 'border-indigo-500/50', bg: 'bg-indigo-500' },
    { name: 'Violet', value: '#8b5cf6', border: 'border-violet-500/50', bg: 'bg-violet-500' },
    { name: 'Emerald', value: '#10b981', border: 'border-emerald-500/50', bg: 'bg-emerald-500' },
    { name: 'Rose', value: '#f43f5e', border: 'border-rose-500/50', bg: 'bg-rose-500' },
    { name: 'Amber', value: '#f59e0b', border: 'border-amber-500/50', bg: 'bg-amber-500' },
    { name: 'Cyan', value: '#06b6d4', border: 'border-cyan-500/50', bg: 'bg-cyan-500' },
  ];

  // Current stroke styling
  const currentStyle = (selectedEdge.style as React.CSSProperties) || {};
  const currentStroke = currentStyle.stroke || '#6366f1';
  const currentWidth = Number(currentStyle.strokeWidth) || 2;

  // Handle dynamic routing mutations
  const handleTypeChange = (type: string) => {
    updateEdgeProperties(selectedEdge.id, { type });
  };

  // Handle animation speeds/flows
  const handleToggleAnimation = (enabled: boolean) => {
    updateEdgeProperties(selectedEdge.id, { animated: enabled });
  };

  // Handle custom width adjustment
  const handleWidthChange = (width: number) => {
    updateEdgeProperties(selectedEdge.id, {
      style: {
        ...currentStyle,
        strokeWidth: width,
      }
    });
  };

  // Handle custom color adjustment
  const handleColorChange = (hex: string) => {
    updateEdgeProperties(selectedEdge.id, {
      style: {
        ...currentStyle,
        stroke: hex,
      },
      markerEnd: {
        ...((selectedEdge.markerEnd as any) || {}),
        color: hex,
      }
    });
  };

  return (
    <div 
      id="edge-inspector-panel"
      className="absolute right-4 top-20 w-[320px] rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-lg shadow-2xl z-50 p-5 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-200 text-slate-100"
    >
      {/* Header element */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
            Pipeline Properties
          </h3>
        </div>
        <button 
          onClick={() => selectEdge(null)}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Connectivity Meta Details */}
      <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 flex flex-col gap-2">
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-semibold leading-none flex items-center gap-1">
          <GitPullRequest className="w-3 h-3 text-slate-500" />
          Stream Connection
        </span>
        <div className="flex items-center justify-between mt-1 min-w-0">
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold leading-none">Source Node</span>
            <span className="text-xs text-indigo-300 font-semibold truncate mt-1">
              {selectedEdge.source}
            </span>
            <span className="text-[9px] text-slate-500 font-mono italic truncate">
              {selectedEdge.sourceHandle || 'output'}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 mx-2" />
          <div className="flex flex-col min-w-0 text-right">
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold leading-none">Target Node</span>
            <span className="text-xs text-indigo-300 font-semibold truncate mt-1">
              {selectedEdge.target}
            </span>
            <span className="text-[9px] text-slate-500 font-mono italic truncate">
              {selectedEdge.targetHandle || 'input'}
            </span>
          </div>
        </div>
      </div>

      {/* Field: Pipeline Name Label */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Pipeline Stream Name
        </label>
        <input 
          type="text"
          value={labelText}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="e.g. prompt_tokens_v2, metadata_stream"
          className="w-full px-3 py-2 text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
        />
      </div>

      {/* Field: Route Layout Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Connection Path Type
        </label>
        <select 
          value={selectedEdge.type || 'smoothstep'}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full px-3 py-2 text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 outline-none"
        >
          <option value="smoothstep">Smooth-Step Routing</option>
          <option value="straight">Straight Vector</option>
          <option value="step">Orthogonal Steps</option>
          <option value="default">Bezier Curve</option>
        </select>
      </div>

      {/* Field: Quick Colors preset palette */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Pipeline Colors
          </label>
          <span className="text-[9.5px] text-indigo-400 font-mono uppercase tracking-widest">
            {colorPresets.find(p => p.value === currentStroke)?.name || 'Custom'}
          </span>
        </div>
        <div className="flex gap-2.5 items-center justify-between">
          {colorPresets.map((preset) => (
            <button 
              key={preset.value}
              onClick={() => handleColorChange(preset.value)}
              className={`w-6 h-6 rounded-full ${preset.bg} border-2 relative transition-all duration-150 ${
                currentStroke === preset.value 
                  ? 'border-white scale-110 shadow-[0_0_10px_rgb(255,255,255,0.4)]' 
                  : 'border-transparent hover:scale-105'
              }`}
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* Field: Dash animation status & Flow stream status */}
      <div className="grid grid-cols-2 gap-3 pb-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Flow Particles
          </label>
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 h-8">
            <button 
              type="button"
              onClick={() => handleToggleAnimation(true)}
              className={`flex-1 flex items-center justify-center rounded-md ${
                selectedEdge.animated 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Animate moving dashes along the route"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={() => handleToggleAnimation(false)}
              className={`flex-1 flex items-center justify-center rounded-md ${
                !selectedEdge.animated 
                  ? 'bg-slate-800 text-slate-200' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Static wire description"
            >
              <ZapOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Line Thickness
          </label>
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 h-8">
            {[2, 4, 6].map((width) => (
              <button 
                key={width}
                type="button"
                onClick={() => handleWidthChange(width)}
                className={`flex-1 text-[11px] font-bold rounded-md ${
                  currentWidth === width 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title={`Set strokeWidth: ${width}px`}
              >
                {width}px
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action: Delete Connection */}
      <button 
        type="button"
        onClick={() => deleteEdge(selectedEdge.id)}
        className="w-full mt-2 py-2 border border-slate-800 hover:border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Disconnect Pipeline Connection
      </button>

      {/* Dynamic Info tip */}
      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 text-[10px] text-slate-500 flex items-start gap-1.5 leading-normal">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span>Connectors carry parameters between pipeline steps chronologically. Labeling them provides documentation.</span>
      </div>
    </div>
  );
};

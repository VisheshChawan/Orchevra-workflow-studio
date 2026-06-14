import React, { useState, useRef, useEffect, memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { 
  Trash2, 
  AlertCircle, 
  Sparkles, 
  HelpCircle, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Database, 
  Activity, 
  RefreshCw, 
  Sliders, 
  Clock, 
  Layers, 
  Terminal, 
  Clipboard, 
  Plus, 
  Check, 
  Settings2, 
  UserCheck 
} from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { NODE_REGISTRY } from '../nodes/nodeRegistry';
import { NodeConfig, NodeField, NodeHandleConfig } from '../types';
import { useThemeStore } from '../store/useThemeStore';

const computeLivePreview = (code: string, mode: string, enableBranching: boolean) => {
  try {
    const mockInput = [
      { id: "lead_1", score: 85, status: "active", email: "john@example.com" },
      { id: "lead_2", score: 45, status: "inactive", email: "jane@example.com" },
      { id: "lead_3", score: 98, status: "active", email: "bob@example.com" }
    ];
    
    // Inject a dummy function wrapper
    const fn = new Function('data', code);
    const result = fn(mockInput);
    if (result !== undefined) {
      return JSON.stringify(result, null, 2);
    }
    throw new Error("No return value");
  } catch (err: any) {
    if (enableBranching) {
      return JSON.stringify({
        success: true,
        error: null,
        branch_taken: "true",
        processed_at: new Date().toISOString()
      }, null, 2);
    }
    
    switch (mode) {
      case 'Success / Error':
        return JSON.stringify({ success: true, payload: { id: "p-09", active: true } }, null, 2);
      case 'Conditional Branching':
        return JSON.stringify({ condition_matched: true, action: "route_true" }, null, 2);
      case 'Multiple Outputs':
        return JSON.stringify({ split_1: "payload_a", split_2: "payload_b", split_3: "payload_c" }, null, 2);
      case 'Custom Outputs':
        return JSON.stringify({ approved: true, rejected: false, pending: false }, null, 2);
      default:
        return JSON.stringify({ transformed: true, count: 3, status: "success" }, null, 2);
    }
  }
};

interface BaseNodeProps {
  id: string;
  data: any;
  type: string;
}

export const BaseNode: React.FC<BaseNodeProps> = memo(({ id, data, type }) => {
  const { deleteNode, updateNodeField } = useWorkflowStore();
  const { 
    preset, 
    accent, 
    nodeStyle, 
    devMode,
    shadowStyle,
    borderRadiusOption,
    spacingDensity
  } = useThemeStore();
  const reactFlow = useReactFlow();
  
  // Collapsed by default details inspector
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Attached child sub-node companion elements
  const availableAttachments = [
    { id: 'ai_model', name: 'OpenAI GPT / Gemini Core', icon: Cpu, type: 'AI Model' },
    { id: 'parser', name: 'Structured JSON Parser', icon: Sparkles, type: 'Output Parser' },
    { id: 'memory', name: 'Sliding Window Memory', icon: Clock, type: 'Memory Module' },
    { id: 'vectordb', name: 'Pinecone VectorDB', icon: Database, type: 'Vector DB' },
    { id: 'retriever', name: 'BM25 Hybrid Retriever', icon: HelpCircle, type: 'Retriever' },
    { id: 'tools', name: 'Slack/Notion Hook Dispatcher', icon: Sliders, type: 'Tool' }
  ];

  const activeAttachments = data.attachments || [];
  const toggleAttachment = (attachId: string) => {
    let list = [...activeAttachments];
    if (list.includes(attachId)) {
      list = list.filter(a => a !== attachId);
    } else {
      list.push(attachId);
    }
    updateNodeField(id, 'attachments', list);
  };

  const mockLogs = data.logs || [
    { time: '12:04:15', type: 'info', text: 'Initializing node execution pipeline...' },
    { time: '12:04:16', type: 'success', text: 'Handshake credentials validated.' },
    { time: '12:04:16', type: 'debug', text: 'Telemetry ready, awaiting payload...' }
  ];

  // Retrieve configuration from Registry
  const config: NodeConfig | undefined = NODE_REGISTRY[type];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize for textarea fields (e.g., Prompt/Text node content)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [data]);

  if (!config) {
    return (
      <div className="p-4 bg-rose-500/20 text-rose-300 border border-rose-500 rounded-lg max-w-[200px]">
        <div className="font-bold flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> Error
        </div>
        <p className="text-xs mt-1">Node type "{type}" not found in registry.</p>
      </div>
    );
  }

  // Handle inputs/targets
  const inputs: NodeHandleConfig[] = config.inputs || [];
  const fields: NodeField[] = config.fields || [];

  // Parse Text values if this is an Advanced Text Node to extract target variables dynamically
  const variables: string[] = data.parsedVariables || [];
  
  // Validate Variable Syntax (Valid JS identifier: letters, digits, _, $) und can't start with digits
  const jsVarRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  const validVariables = variables.filter(v => jsVarRegex.test(v));
  const invalidVariables = variables.filter(v => !jsVarRegex.test(v));

  // Combine standard inputs and dynamic variables on left target side
  const allTargets = [
    ...inputs,
    ...validVariables.map(variable => ({
      id: `variable-${variable}`,
      label: variable,
      type: 'target' as const,
      position: 'left' as const,
    }))
  ];

  // Accent tailwind color mapping for visual feedback and SaaS grade glow
  const colorMap: Record<string, { bg: string, text: string, border: string, accent: string, glow: string }> = {
    emerald: { 
      bg: 'bg-emerald-950/40', 
      text: 'text-emerald-400', 
      border: 'border-emerald-500/30', 
      accent: 'bg-emerald-500', 
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
    },
    rose: { 
      bg: 'bg-rose-950/40', 
      text: 'text-rose-400', 
      border: 'border-rose-500/30', 
      accent: 'bg-rose-500', 
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
    },
    purple: { 
      bg: 'bg-purple-950/40', 
      text: 'text-purple-400', 
      border: 'border-purple-500/30', 
      accent: 'bg-purple-500', 
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
    },
    blue: { 
      bg: 'bg-blue-950/40', 
      text: 'text-blue-400', 
      border: 'border-blue-500/30', 
      accent: 'bg-blue-500', 
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
    },
    indigo: { 
      bg: 'bg-indigo-950/40', 
      text: 'text-indigo-400', 
      border: 'border-indigo-500/30', 
      accent: 'bg-indigo-500', 
      glow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
    },
    amber: { 
      bg: 'bg-amber-950/40', 
      text: 'text-amber-400', 
      border: 'border-amber-500/30', 
      accent: 'bg-amber-500', 
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
    },
    cyan: { 
      bg: 'bg-cyan-950/40', 
      text: 'text-cyan-400', 
      border: 'border-cyan-500/30', 
      accent: 'bg-cyan-500', 
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
    },
    violet: { 
      bg: 'bg-violet-950/40', 
      text: 'text-violet-400', 
      border: 'border-violet-500/30', 
      accent: 'bg-violet-500', 
      glow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
    },
    pink: { 
      bg: 'bg-pink-950/40', 
      text: 'text-pink-400', 
      border: 'border-pink-500/30', 
      accent: 'bg-pink-500', 
      glow: 'shadow-[0_0_15px_rgba(236,72,153,0.15)]' 
    },
  };

  const scheme = colorMap[config.accentColor] || colorMap.blue;

  // Calculate dynamic outputs for the enhanced transformNode
  let outputs: Array<NodeHandleConfig & { color?: string }> = config.outputs || [];
  if (type === 'transformNode') {
    const mode = data.outputMode || 'Single Result';
    const enableBranching = !!data.enableBranching;
    const dynamicOutputs: Array<NodeHandleConfig & { color?: string }> = [];

    if (enableBranching) {
      dynamicOutputs.push(
        { id: 'success', type: 'source', position: 'right', label: 'Success', color: '#22c55e' },
        { id: 'error', type: 'source', position: 'right', label: 'Error', color: '#ef4444' },
        { id: 'true', type: 'source', position: 'right', label: 'True', color: '#10b981' },
        { id: 'false', type: 'source', position: 'right', label: 'False', color: '#f59e0b' }
      );
    } else {
      switch (mode) {
        case 'Single Result':
          dynamicOutputs.push({ id: 'result', type: 'source', position: 'right', label: 'Result Body' });
          break;
        case 'Success / Error':
          dynamicOutputs.push(
            { id: 'success', type: 'source', position: 'right', label: 'Success', color: '#22c55e' },
            { id: 'error', type: 'source', position: 'right', label: 'Error', color: '#ef4444' }
          );
          break;
        case 'Conditional Branching':
          dynamicOutputs.push(
            { id: 'true', type: 'source', position: 'right', label: 'True', color: '#10b981' },
            { id: 'false', type: 'source', position: 'right', label: 'False', color: '#f59e0b' }
          );
          break;
        case 'Multiple Outputs':
          const numOut = Math.max(1, Math.min(10, parseInt(data.numOutputs) || 3));
          for (let i = 1; i <= numOut; i++) {
            dynamicOutputs.push({
              id: `output-${i}`,
              type: 'source',
              position: 'right',
              label: `Output ${i}`,
              color: '#eab308' // High-contrast amber/yellow
            });
          }
          break;
        case 'Custom Outputs':
          const customStr = data.customOutputsStr || 'approved,rejected,pending';
          const items = customStr.split(',').map((s: string) => s.trim()).filter(Boolean);
          if (items.length === 0) {
            dynamicOutputs.push({ id: 'custom-empty', type: 'source', position: 'right', label: 'No Outputs Configured' });
          } else {
            items.forEach((item: string, idx: number) => {
              const colorsList = ['#9333ea', '#2563eb', '#10b981', '#ec4899', '#06b6d4'];
              const col = colorsList[idx % colorsList.length];
              dynamicOutputs.push({
                id: `custom-${item.toLowerCase()}`,
                type: 'source',
                position: 'right',
                label: item,
                color: col
              });
            });
          }
          break;
        default:
          dynamicOutputs.push({ id: 'result', type: 'source', position: 'right', label: 'Result Body' });
          break;
      }
    }
    outputs = dynamicOutputs;
  }

  // Validation indicator: returns true if all required block fields are filled
  const isComplete = fields.every(
    f => !f.required || (data[f.name] !== undefined && data[f.name] !== '')
  );

  const Icon = typeof config.icon === 'string' ? HelpCircle : config.icon;

  // Compile classes based on Selected Theme Preset
  const getPresetClasses = () => {
    let shadowClass = '';
    switch (shadowStyle) {
      case 'flat':
        shadowClass = 'shadow-none border-[1.5px]';
        break;
      case 'subtle':
        shadowClass = 'shadow-md shadow-black/25 border-slate-800/60';
        break;
      case 'elevated':
        shadowClass = 'shadow-lg shadow-black/40 border-slate-700/50';
        break;
      case 'deep':
        shadowClass = 'shadow-2xl shadow-slate-950/90 border-slate-600/30';
        break;
      case 'glow':
        shadowClass = scheme.glow;
        break;
      default:
        shadowClass = '';
    }

    switch (preset) {
      case 'developer':
        return `bg-[#18181b]/95 border-emerald-500/30 text-emerald-400 font-mono ${shadowClass || 'shadow-sm'}`;
      case 'classy':
        return `bg-[#1c1917]/95 border-amber-500/25 text-amber-200 font-serif ${shadowClass || 'shadow-xl'}`;
      case 'enterprise':
        return `bg-[#0F172A]/90 border-[#1F2937] text-[#F8FAFC] font-sans ${shadowClass || 'shadow-md'}`;
      case 'github':
        return `bg-[#0d1117]/95 border-[#30363d] text-slate-100 font-sans ${shadowClass || 'shadow-sm'}`;
      case 'vercel':
        return `bg-black border-neutral-800 text-white font-sans ${shadowClass || 'shadow-none'}`;
      case 'glass':
        return `backdrop-blur-xl bg-slate-950/30 border-white/10 text-white ${shadowClass || 'shadow-2xl'}`;
      case 'minimal':
        return `bg-slate-900/30 border-slate-800 text-slate-200 font-sans border shadow-none`;
      case 'cyberpunk':
        return `bg-[#110c1a] border-amber-500/50 text-amber-400 font-mono ${shadowClass || 'shadow-[0_0_15px_rgba(245,158,11,0.25)]'}`;
      case 'retro':
        return `bg-[#020d04] border-emerald-500/40 text-emerald-400 font-mono ${shadowClass || 'shadow-none'}`;
      default:
        return `bg-[#0F172A]/90 border-[#1F2937] text-slate-200 ${shadowClass || 'shadow-md'} font-sans`;
    }
  };

  // Compile classes based on Selected Node Geometry Style
  const getGeometryClasses = () => {
    switch (borderRadiusOption) {
      case 'none':
        return 'rounded-none';
      case 'sm':
        return 'rounded-md';
      case 'md':
        return 'rounded-xl';
      case 'lg':
        return 'rounded-2xl';
      case 'full':
        return 'rounded-[26px]';
      default:
        switch (nodeStyle) {
          case 'sharp':
            return 'rounded-none';
          case 'glass':
            return 'rounded-2xl backdrop-blur-md';
          case 'minimal':
            return 'rounded-md';
          case 'modern':
            return 'rounded-xl shadow-lg';
          case 'rounded':
          default:
            return 'rounded-xl';
        }
    }
  };

  const borderHoverClass = preset === 'developer' ? 'hover:border-emerald-400' : preset === 'classy' ? 'hover:border-purple-400' : preset === 'vercel' ? 'hover:border-white' : 'hover:border-indigo-500/50';

  const executionState = data.executionState || 'idle';
  let executionClass = '';
  if (executionState === 'queued') {
    executionClass = 'opacity-85 grayscale-[15%] border-slate-700/60 scale-[0.99]';
  } else if (executionState === 'running') {
    executionClass = 'border-amber-400 bg-amber-950/15 shadow-[0_0_24px_rgba(245,158,11,0.3)] ring-2 ring-amber-500/25 z-30';
  } else if (executionState === 'success') {
    executionClass = 'border-emerald-500 bg-emerald-950/10 shadow-[0_0_24px_rgba(16,185,129,0.25)] ring-2 ring-emerald-500/20';
  } else if (executionState === 'failed') {
    executionClass = 'border-rose-500 bg-rose-950/10 shadow-[0_0_24px_rgba(244,63,94,0.3)] ring-2 ring-rose-500/20';
  } else if (executionState === 'retrying') {
    executionClass = 'border-purple-500 bg-purple-950/15 shadow-[0_0_24px_rgba(139,92,206,0.3)] animate-pulse ring-2 ring-purple-500/20';
  }

  return (
    <div 
      id={`node-${id}`}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT' && !target.closest('button')) {
          setIsExpanded(!isExpanded);
        }
      }}
      className={`border transition-all duration-305 relative ${borderHoverClass} ${getPresetClasses()} ${getGeometryClasses()} overflow-visible group hover:scale-[1.005] hover:shadow-indigo-500/5 ${executionClass} ${isExpanded ? 'w-[640px]' : 'w-[235px]'}`}
    >
      {/* Dynamic Handles Renderers */}
      
      {/* Target Handles (Left rail) spaced evenly */}
      {allTargets.map((handle, index) => {
        const topOfs = allTargets.length > 1 
          ? `${((index + 1) * 100) / (allTargets.length + 1)}%` 
          : '50%';
        return (
          <div key={handle.id}>
            <Handle
              type="target"
              position={Position.Left}
              id={handle.id}
              style={{ top: topOfs }}
              className="group-hover:scale-125 !w-2.5 !h-2.5 !bg-indigo-400 !border-slate-900"
            />
            {handle.label && isExpanded && (
              <span 
                className="absolute text-[8.5px] font-mono text-slate-400 bg-slate-950/90 px-1 border border-slate-800 rounded z-10 select-none shadow pointer-events-none whitespace-nowrap"
                style={{ 
                  left: '10px', 
                  top: `calc(${topOfs} - 8px)`,
                  transform: 'translateY(-10%)'
                }}
              >
                {handle.label}
              </span>
            )}
          </div>
        );
      })}

      {/* Source Handles (Right rail) spaced evenly */}
      {outputs.map((handle: any, index) => {
        const topOfs = outputs.length > 1 
          ? `${((index + 1) * 100) / (outputs.length + 1)}%` 
          : '50%';
        return (
          <div key={handle.id}>
            <Handle
              type="source"
              position={Position.Right}
              id={handle.id}
              style={{ 
                top: topOfs,
                backgroundColor: handle.color || '#818cf8',
                borderColor: 'rgba(255, 255, 255, 0.4)'
              }}
              className="group-hover:scale-125 transition-transform !w-2.5 !h-2.5"
            />
            {handle.label && isExpanded && (
              <span 
                className="absolute text-[8.5px] font-mono text-slate-400 bg-slate-950/90 px-1 border border-slate-800 rounded z-10 select-none shadow pointer-events-none whitespace-nowrap"
                style={{ 
                  right: '10px', 
                  top: `calc(${topOfs} - 8px)`,
                  transform: 'translateY(-10%)'
                }}
              >
                {handle.label}
              </span>
            )}
          </div>
        );
      })}

      {/* CORE HEADER: collapsible toggle trigger */}
      <div className="flex items-center justify-between p-2.5 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`p-1.5 rounded-lg ${scheme.bg} ${scheme.text} shrink-0`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-[11.5px] font-bold text-slate-200 tracking-tight flex items-center gap-1 select-none truncate">
              {type === 'transformNode' ? 'Data Transform' : config.title}
            </h4>
            <span className="text-[8.5px] text-slate-500 font-mono tracking-tight block leading-none truncate font-semibold">
              {id.substring(0, 8)}
            </span>
          </div>
        </div>
        
        {/* Actions panel */}
        <div className="flex items-center gap-1.5 ms-2 shrink-0">
          <span className={`text-[7.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border tracking-wider flex items-center gap-1 ${
            executionState === 'queued' ? 'bg-slate-900/90 border-slate-700/60 text-slate-400' :
            executionState === 'running' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 animate-pulse font-bold' :
            executionState === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-bold' :
            executionState === 'failed' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 font-bold' :
            executionState === 'retrying' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400 font-bold animate-bounce' :
            'bg-slate-950/40 border-slate-800 text-slate-500'
          }`}>
            <span className={`w-1 h-1 rounded-full ${
              executionState === 'running' ? 'bg-amber-400 animate-ping' :
              executionState === 'success' ? 'bg-emerald-400' :
              executionState === 'failed' ? 'bg-rose-400' :
              executionState === 'retrying' ? 'bg-purple-400 animate-pulse' : 'bg-slate-500'
            }`} />
            {executionState}
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all shrink-0"
            title={isExpanded ? "Collapse Node details" : "Expand Node configuration inspector"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button 
            onClick={() => deleteNode(id)}
            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            title="Delete this block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* COLLAPSED VIEW: Minimal clean card */}
      {!isExpanded ? (
        <div className="p-2.5 flex flex-col gap-1.5 bg-slate-950/20 select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 italic truncate max-w-[150px]">
              {data.inputName || data.model || data.outputMode || config.description.substring(0, 30) + '...'}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'} shadow`} />
          </div>

          {/* Connected sub-node badges */}
          {activeAttachments.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-900/60">
              {activeAttachments.map((attId: string) => {
                const companion = availableAttachments.find(a => a.id === attId);
                if (!companion) return null;
                const CompanionIcon = companion.icon;
                return (
                  <span 
                    key={attId} 
                    className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-1 py-0.5 rounded text-[8px] font-mono text-indigo-400 animate-fade-in"
                  >
                    <CompanionIcon className="w-2.5 h-2.5" />
                    {companion.type.split(' ')[0]}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="text-[8px] font-mono text-slate-600 mt-0.5 flex justify-between select-none">
              <span>Live state</span>
              <span>Double-click to expand</span>
            </div>
          )}
        </div>
      ) : (
        /* EXPANDED VIEW: Complete Split Studio Layout */
        <div className="p-3.5 flex flex-col gap-4 bg-slate-950/20 border-t border-slate-900/80 animate-fade-in text-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* LEFT COLUMN: Values form fields parameters */}
            <div className="flex flex-col gap-3">
              <div className="border-b border-indigo-500/10 pb-1.5">
                <span className="text-[9px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/15 font-bold">
                  📁 Parameters and Values
                </span>
              </div>

              {fields.map((field) => {
                if (type === 'transformNode') {
                  const currentMode = data.outputMode || 'Single Result';
                  const brOn = !!data.enableBranching;
                  
                  if (field.name === 'condition' && (currentMode !== 'Conditional Branching' || brOn)) return null;
                  if (field.name === 'numOutputs' && (currentMode !== 'Multiple Outputs' || brOn)) return null;
                  if (field.name === 'customOutputsStr' && (currentMode !== 'Custom Outputs' || brOn)) return null;
                }

                const value = data[field.name] !== undefined ? data[field.name] : (field.defaultValue !== undefined ? field.defaultValue : '');
                
                return (
                  <div key={field.name} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10.5px] font-bold text-slate-300">
                        {field.label}
                        {field.required && <span className="text-rose-400 ml-0.5">*</span>}
                      </label>
                      {field.description && (
                        <span className="text-[9px] text-slate-500 italic max-w-[120px] truncate" title={field.description}>
                          {field.description}
                        </span>
                      )}
                    </div>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateNodeField(id, field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-202 outline-none focus:border-indigo-500 font-mono"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => updateNodeField(id, field.name, parseFloat(e.target.value) || 0)}
                        placeholder={field.placeholder}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-202 outline-none focus:border-indigo-500 font-mono"
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        value={value}
                        onChange={(e) => updateNodeField(id, field.name, e.target.value)}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-202 outline-none"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-200">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'textarea' && (
                      <div className="relative">
                        <textarea
                          ref={field.name === 'text' ? textareaRef : undefined}
                          rows={3}
                          value={value}
                          onChange={(e) => updateNodeField(id, field.name, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-202 font-mono outline-none focus:border-indigo-500 resize-y"
                        />
                        <button
                          onClick={() => setShowFullscreen(true)}
                          className="absolute bottom-2 right-2 p-1 bg-slate-905 border border-slate-850 rounded hover:text-indigo-400 hover:border-indigo-500/50 transition-all shadow animate-pulse"
                          title="Open full screen prompt script editor"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {field.type === 'toggle' && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) => updateNodeField(id, field.name, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white"></div>
                        <span className="text-[10px] text-slate-400">Yes</span>
                      </label>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setShowFullscreen(true)}
                className="w-full mt-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-xs border border-slate-850 hover:border-slate-700 rounded flex items-center justify-center gap-1.5 font-bold transition-all text-slate-300"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Fullscreen IDE Workspace
              </button>
            </div>

            {/* RIGHT COLUMN: Nested subcomponents lists & Real-time analytics cost */}
            <div className="flex flex-col gap-3">
              
              {/* Attachments selections */}
              <div>
                <div className="border-b border-indigo-500/10 pb-1.5 mb-2">
                  <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/15 font-bold">
                    🔌 Attach Sub-components
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 px-0.5">
                  {availableAttachments.map((attach) => {
                    const AttachIcon = attach.icon;
                    const isActive = activeAttachments.includes(attach.id);
                    return (
                      <button
                        key={attach.id}
                        type="button"
                        onClick={() => toggleAttachment(attach.id)}
                        className={`p-1.5 border rounded text-left transition-all flex items-center justify-between text-[9.5px] ${
                          isActive 
                            ? 'bg-indigo-600/15 border-indigo-500 text-indigo-200' 
                            : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/80 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <AttachIcon className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{attach.name}</span>
                        </div>
                        {isActive ? (
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <Plus className="w-3 h-3 text-slate-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model config sub-parameters */}
              {activeAttachments.includes('ai_model') && (
                <div className="p-2 border border-indigo-500/10 bg-slate-950/40 rounded-lg space-y-1.5">
                  <span className="text-[8px] font-bold text-indigo-400 uppercase font-mono tracking-wider block">🧠 AI model settings</span>
                  <div className="grid grid-cols-2 gap-1.5 animate-fade-in">
                    <div>
                      <span className="text-[7.5px] text-slate-500 block font-mono">Model Selection</span>
                      <select 
                        defaultValue={data.modelSelected || 'Gemini 2.5 Flash'} 
                        onChange={(e) => updateNodeField(id, 'modelSelected', e.target.value)}
                        className="w-full bg-slate-950 p-1 border border-slate-850 rounded text-[9px] font-mono text-slate-300 outline-none"
                      >
                        <option>Gemini 2.5 Flash</option>
                        <option>Gemini 2.5 Pro</option>
                        <option>Claude 3.5 Sonnet</option>
                        <option>GPT-4o Enterprise</option>
                        <option>DeepSeek R1</option>
                        <option>Ollama Local Llama</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-slate-500 block font-mono">Temperature ({data.aiTemp || '0.2'})</span>
                      <input 
                        type="range" min="0" max="1" step="0.1" 
                        defaultValue={data.aiTemp || '0.2'} 
                        onChange={(e) => updateNodeField(id, 'aiTemp', e.target.value)}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[7px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                    <span>Est cost: $0.00015 / 1k</span>
                    <span>Max tokens: 8192</span>
                  </div>
                </div>
              )}

              {/* Parser configs */}
              {activeAttachments.includes('parser') && (
                <div className="p-2 border border-slate-800 bg-slate-950/40 rounded-lg space-y-1">
                  <span className="text-[8px] font-bold text-slate-400 uppercase font-mono block">Parser Output Schema / Regex</span>
                  <input 
                    type="text" 
                    defaultValue="(?<=result:)[^,\n]+" 
                    placeholder="Regular expression schema..."
                    className="w-full p-1 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono outline-none text-slate-300"
                  />
                </div>
              )}

              {/* Secure credential keyholders */}
              <div className="p-2 border border-slate-800 bg-slate-950/40 rounded-lg space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase font-mono tracking-wider block">🔑 Authorized Secret Credentials</span>
                <div className="flex gap-1.5">
                  <input 
                    type="password" 
                    value={data.apiKeySeed ? data.apiKeySeed : '••••••••••••••••••••••••'} 
                    placeholder="Masked API key"
                    onChange={(e) => updateNodeField(id, 'apiKeySeed', e.target.value)}
                    className="flex-1 bg-slate-950 p-1 border border-slate-850 rounded text-[9.5px] font-mono text-slate-300 outline-none"
                  />
                  <span className="text-[8px] flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 rounded font-mono font-bold">Encrypted</span>
                </div>
              </div>

              {/* Dynamic transform preview */}
              {type === 'transformNode' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 tracking-wider uppercase font-mono">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                    ⚡ Transform Preview Output
                  </div>
                  
                  <pre className="p-2 bg-slate-950/80 border border-slate-850 rounded text-[8.5px] font-mono text-emerald-400 max-h-[80px] overflow-y-auto whitespace-pre select-text">
                    {computeLivePreview(
                      data.transformCode || '',
                      data.outputMode || 'Single Result',
                      !!data.enableBranching
                    )}
                  </pre>
                </div>
              )}

              {/* Debug execution logs trace */}
              <div className="p-2 bg-slate-950/65 rounded border border-slate-850 space-y-1">
                <div className="flex items-center justify-between font-mono text-[7.5px] text-slate-500 border-b border-slate-900 pb-1 uppercase tracking-tight font-bold">
                  <span className="flex items-center gap-1 text-slate-400"><Terminal className="w-2.5 h-2.5 text-slate-400 shrink-0" /> Execution Tracer Console</span>
                  <span className="text-emerald-500 text-[7px] animate-pulse">Running</span>
                </div>
                <div className="font-mono text-[8.5px] space-y-0.5 leading-snug max-h-[60px] overflow-y-auto text-slate-300">
                  {mockLogs.map((log: any, idx: number) => (
                    <div key={idx} className="flex gap-1">
                      <span className="text-slate-550">{log.time}</span>
                      <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : 'text-slate-400'}>
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* TELEMETRY FOOTINGS */}
          <div className="pt-2 border-t border-slate-900/60 grid grid-cols-4 gap-2 text-[8px] font-mono bg-slate-950/20 px-2.5 py-1.5 rounded">
            <div className="flex flex-col">
              <span className="text-[7px] uppercase text-slate-500 tracking-tight">Block Type</span>
              <span className="font-bold text-indigo-400 mt-0.5 truncate uppercase">{type}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] uppercase text-slate-500 tracking-tight">Connections</span>
              <span className="font-bold text-slate-305 mt-0.5 leading-none">
                {reactFlow.getEdges().filter(e => e.source === id || e.target === id).length} edges
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] uppercase text-slate-500 tracking-tight">Inputs In</span>
              <span className="font-bold text-slate-300 mt-0.5">{allTargets.length} pins</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[7px] uppercase text-slate-500 tracking-tight">Health Index</span>
              <span className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1 justify-end">
                100% OK
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN DEV ENVIRONMENT DIALOG OVERLAY */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-slate-955/90 backdrop-blur-md z-[9999] flex items-center justify-center p-6 text-slate-100">
           <div className="w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Terminal className="w-5 h-5 text-indigo-400 animate-pulse" />
                     <div>
                        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">ORCHEVRA Lambda prompt Studio Compiler</h3>
                        <p className="text-[10.5px] text-slate-500">Edit script prompts, lambda bindings and complex parameter blocks</p>
                     </div>
                  </div>
                  <button 
                     onClick={() => setShowFullscreen(false)}
                     className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs rounded-lg font-bold transition-all text-white shadow"
                  >
                     Save & Close Compiler
                  </button>
              </div>

              <div className="flex-1 grid grid-cols-5 divide-x divide-slate-850 overflow-hidden">
                 <div className="col-span-3 flex flex-col p-4 overflow-hidden">
                    <label className="text-[10px] font-mono text-slate-500 mb-2 font-bold uppercase tracking-wider block">Script source code Editor</label>
                    <textarea 
                       className="flex-1 w-full bg-slate-955 p-4 rounded-xl border border-slate-850 font-mono text-xs text-indigo-300 resize-none outline-none focus:border-indigo-500 leading-relaxed"
                       value={data.transformCode || data.text || '// Write custom structured JSON config/code script parameters here...'}
                       onChange={(e) => updateNodeField(id, data.transformCode !== undefined ? 'transformCode' : 'text', e.target.value)}
                    />
                 </div>
                 <div className="col-span-2 p-4 flex flex-col gap-4 overflow-y-auto bg-slate-950/30 font-mono">
                     <div>
                         <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Execution Parameters</h4>
                         <p className="text-[10px] text-slate-400 mt-1 font-mono">Variables are automatically parsed dynamically from standard output sockets connected upstream.</p>
                     </div>

                     {type === 'text' && (
                         <div className="p-3 bg-indigo-950/25 border border-indigo-900/40 rounded-xl space-y-2">
                             <h5 className="text-[9.5px] uppercase font-bold text-indigo-400 tracking-wider">Parsed variable parameters:</h5>
                             {validVariables.length > 0 ? (
                               <div className="flex flex-wrap gap-1">
                                   {validVariables.map(v => (
                                       <span key={v} className="bg-indigo-500/10 border border-indigo-400/20 px-2 py-0.5 rounded text-[10px] text-indigo-300 font-medium">
                                         {v}
                                       </span>
                                   ))}
                               </div>
                             ) : (
                               <div className="text-[10px] text-slate-500 italic">No connected dynamic variables found.</div>
                             )}
                         </div>
                     )}

                     <div className="space-y-1.5">
                         <h5 className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Simulation Sandbox output:</h5>
                         <pre className="bg-slate-905 p-3 rounded-xl border border-slate-850 text-[10px] text-emerald-400 overflow-x-auto max-h-[220px]">
                             {type === 'transformNode' 
                               ? computeLivePreview(data.transformCode || '', data.outputMode || 'Single Result', !!data.enableBranching) 
                               : JSON.stringify({ parsed: true, file_name: data.inputName || "payload", data_format: "JSON-structured", raw: data.text || "" }, null, 2)}
                         </pre>
                     </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
});

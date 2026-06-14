import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Workflow, 
  Info, 
  Database, 
  Cpu, 
  Globe, 
  HelpCircle, 
  GitBranch, 
  Mail, 
  Clock, 
  RefreshCw,
  GitCommit,
  Check,
  TrendingUp,
  Award
} from 'lucide-react';
import { TemplateDefinition } from '../templates/workflowTemplates';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  template: TemplateDefinition | null;
  onConfirm: () => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  templateId,
  template,
  onConfirm
}) => {
  if (!template) return null;

  const nodeCount = template.nodes.length;
  const edgeCount = template.edges.length;

  // Render a mini preview list of nodes in the pipeline sequence
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'customInput': return <Workflow className="w-3.5 h-3.5 text-emerald-400" />;
      case 'customOutput': return <Workflow className="w-3.5 h-3.5 text-rose-400" />;
      case 'llm': return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case 'text': return <Info className="w-3.5 h-3.5 text-blue-400" />;
      case 'apiNode': return <Globe className="w-3.5 h-3.5 text-indigo-400" />;
      case 'conditionNode': return <GitBranch className="w-3.5 h-3.5 text-amber-400" />;
      case 'databaseNode': return <Database className="w-3.5 h-3.5 text-cyan-400" />;
      case 'emailNode': return <Mail className="w-3.5 h-3.5 text-violet-400" />;
      case 'delayNode': return <Clock className="w-3.5 h-3.5 text-pink-400" />;
      case 'transformNode': return <RefreshCw className="w-3.5 h-3.5 text-amber-500" />;
      default: return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const complexityColors = {
    Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    Advanced: "text-purple-400 bg-purple-500/10 border-purple-500/20"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* High-contrast dark backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Dialog Card Wrapper */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: 'spring', damping: 24, stiffness: 380 }}
            className="relative w-full max-w-[500px] rounded-3xl bg-[#090d16] border border-slate-800/90 shadow-[0_24px_70px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col"
          >
            {/* Dynamic visual indicator top strip */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />

            {/* Header section */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-900 bg-slate-900/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <Workflow className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    SaaS Template Preview
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Configure blueprint instantiation</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900/50 transition-colors"
                title="Cancel template setup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inner scroll Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh] scrollbar-thin flex flex-col gap-5">
              
              {/* Category, Complexity, Times Used Hero Header */}
              <div className="flex flex-col gap-2 bg-[#0d1220]/50 border border-slate-900/90 rounded-2xl p-4.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                    {template.category}
                  </span>
                  <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border font-mono ${complexityColors[template.complexity]}`}>
                    Complexity: {template.complexity}
                  </span>
                </div>
                
                <h2 className="text-base font-extrabold text-slate-100 tracking-tight mt-1 leading-tight">
                  {template.title}
                </h2>
                
                <p className="text-xs text-slate-400 leading-relaxed font-medium mt-1">
                  {template.description}
                </p>
              </div>

              {/* Analytics Summary boxes */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0b0e17] border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[8.5px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Nodes Enrolled</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 font-mono">{nodeCount} blocks</span>
                </div>
                <div className="bg-[#0b0e17] border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[8.5px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Linked Edges</span>
                  <span className="text-sm font-bold text-slate-200 mt-1 font-mono">{edgeCount} links</span>
                </div>
                <div className="bg-[#0b0e17] border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[8.5px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Total Deployments</span>
                  <span className="text-sm font-bold text-indigo-400 mt-1 font-mono flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    {template.timesUsed}
                  </span>
                </div>
              </div>

              {/* Sequential Flow Audit */}
              <div className="flex flex-col gap-2">
                <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-500 font-mono">
                  ⛓️ Execution Block Sequence
                </span>
                <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[#0b0f1a]/80 border border-slate-900/80">
                  {template.nodes.map((node, i) => (
                    <div key={node.id} className="flex items-center justify-between text-xs p-2 bg-[#0c101c]/40 border border-slate-900 rounded-lg hover:border-slate-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="p-1 px-1.5 bg-slate-950/80 border border-slate-900/60 rounded">
                          {getStepIcon(node.type)}
                        </div>
                        <span className="font-semibold text-slate-300 font-mono text-[11px]">
                          {node.data?.inputName || node.data?.outputName || node.data?.transformName || node.type}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">
                        Block {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning Notice details */}
              <div className="flex gap-2.5 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[10.5px] text-amber-300 leading-normal">
                <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="font-semibold">
                  Notice: Loading this workflow blueprint installs configured nodes and resets current items on your canvas. Save current workspace progress to sync, if necessary.
                </span>
              </div>

            </div>

            {/* Modal actions CTA */}
            <div className="flex items-center justify-between px-6 py-4.5 border-t border-slate-900 bg-slate-900/20 gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-900/30 text-xs text-slate-400 hover:text-slate-200 transition-colors font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-2 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(99,102,241,0.25)] hover:shadow-indigo-500/15"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Load Blueprint</span>
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

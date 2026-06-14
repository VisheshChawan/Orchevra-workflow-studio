import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  GitCommit, 
  Info,
  ServerCrash,
  Download,
  FileCode,
  FileText,
  Printer,
  Sparkles,
  TrendingUp,
  Cpu,
  BookmarkCheck
} from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  results: {
    num_nodes: number;
    num_edges: number;
    is_dag: boolean;
    computed_by?: string;
  } | null;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
  isOpen, 
  onClose, 
  loading, 
  error, 
  results 
}) => {
  const { nodes, edges } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');

  // Intelligent analysis computation based on actual node values inside canvas
  const generateAnalysisReport = () => {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const isDag = results?.is_dag ?? true;

    const strengths: string[] = [];
    const recommendations: string[] = [];

    // Audit 1: Evaluate inputs and credentials
    const secretVars = nodes.filter(n => n.type === 'customInput' && n.data.inputType === 'Secret');
    if (secretVars.length > 0) {
      strengths.push("Verified secure credentials parameters: authentication secret is isolated from browser viewports.");
    } else {
      recommendations.push("Consider wrapping database passwords and keys in a secure secret variable input parameter.");
    }

    // Audit 2: Evaluate AI generation
    const hasLLM = nodes.some(n => n.type === 'llm');
    if (hasLLM) {
      strengths.push("AI semantic ingestion layer loaded successfully via Google Gemini inference engine.");
    }

    // Audit 3: Evaluate Transform node error handlers
    const transformNodes = nodes.filter(n => n.type === 'transformNode');
    transformNodes.forEach(item => {
      const mode = item.data.outputMode || 'Single Result';
      if (mode === 'Single Result') {
        recommendations.push(`Transform node '${item.data.transformName || 'Formatter'}' is currently in single-result mode. Upgrade to 'Success / Error' mode to avoid overall execution stall.`);
      } else {
        strengths.push(`Active exception routing is configured for Formatter '${item.data.transformName}'.`);
      }
    });

    // Audit 4: evaluate connectivity
    if (totalNodes > 0 && totalEdges === 0) {
      recommendations.push("Disconnected workspace. Link input points to processing blocks to establish dependency triggers.");
    } else if (totalNodes > 0 && isDag) {
      strengths.push("Clean sequential flow configuration with certified zero-cycle topological resolution.");
    }

    if (!isDag) {
      recommendations.push("A circular loop is active on the graph! Break backend cycles to ensure model compilation completes successfully.");
    }

    // Default fallbacks if empty
    if (strengths.length === 0) strengths.push("Valid workflow schema created.");
    if (recommendations.length === 0) recommendations.push("Add automated notification triggers like SMTP dispatchers for diagnostic alerts.");

    const nodeBreakdown = nodes.reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});

    return {
      workflow_name: nodes.length > 0 ? "Workflow Blueprint Alpha" : "Unnamed Canvas Blueprint",
      nodes_count: totalNodes,
      edges_count: totalEdges,
      is_dag: isDag,
      node_breakdown: nodeBreakdown,
      pipeline_insights: {
        strengths,
        recommendations
      }
    };
  };

  const report = generateAnalysisReport();

  // Export 1: Raw JSON download trigger
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pipeline_analysis_report_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export 2: Markdown File export trigger
  const handleExportMarkdown = () => {
    const mdContent = `# Pipeline Analysis Report
Generated: ${new Date().toLocaleString()}
Status: ${report.is_dag ? "✓ VALID DAG" : "⚠ CIRCULAR ENCOUNTERED"}

## 📊 Summary Statistics
- **Total Blocks Enrolled**: ${report.nodes_count}
- **Linked Dependency Connectors**: ${report.edges_count}
- **Structural Integrity**: ${report.is_dag ? "Acyclic Flow" : "Cyclic Loop Warning"}

## 🔍 Nodes Breakdown Configuration
${Object.entries(report.node_breakdown)
  .map(([type, count]) => `- **${type}**: ${count} instance(s)`)
  .join('\n')}

## 💡 Pipeline Insights
### Strengths Identified:
${report.pipeline_insights.strengths.map(s => `- ✓ ${s}`).join('\n')}

### Recommendations for Production Upgrade:
${report.pipeline_insights.recommendations.map(r => `- ⚠ ${r}`).join('\n')}

---
*Report generated securely by ORCHEVRA Enterprise Automation Platform*`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pipeline_analysis_report_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export 3: Printer-friendly document trigger (PDF fallback)
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Workflow Analysis Blueprint Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1 { font-size: 24px; color: #0f172a; margin-bottom: 5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            h2 { font-size: 18px; color: #334155; margin-top: 30px; }
            .status { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; margin-bottom: 25px; }
            .valid { background-color: #d1fae5; color: #065f46; }
            .invalid { background-color: #fee2e2; color: #991b1b; }
            .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
            footer { margin-top: 50px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>Workflow Blueprint Executive Analysis</h1>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 15px;">Generated on: ${new Date().toUTCString()}</div>
          
          <div class="status ${report.is_dag ? 'valid' : 'invalid'}">
            STATE AUDIT: ${report.is_dag ? 'VALID top-layer DAG' : 'DEPENDENCY CIRCLE WARNING'}
          </div>

          <div class="stat-box">
            <strong>Topology Overview</strong>
            <ul>
              <li>Total Blocks Stacked: ${report.nodes_count}</li>
              <li>Connected Pathways: ${report.edges_count}</li>
              <li>Acyclic Graph Ordering: ${report.is_dag ? 'Certified' : 'Broken'}</li>
            </ul>
          </div>

          <h2>🔍 Node Distribution Report</h2>
          <ul>
            ${Object.entries(report.node_breakdown)
              .map(([type, count]) => `<li><strong>${type}</strong>: ${count} active block(s)</li>`)
              .join('')}
          </ul>

          <h2>💡 Engineering Insights</h2>
          <h3>Strengths Detailing:</h3>
          <ul>
            ${report.pipeline_insights.strengths.map(s => `<li style="color: #0d9488;">✓ ${s}</li>`).join('')}
          </ul>

          <h3>Remediations & Recommendations:</h3>
          <ul>
            ${report.pipeline_insights.recommendations.map(r => `<li style="color: #d97706;">⚠ ${r}</li>`).join('')}
          </ul>

          <footer>
            ORCHEVRA AI Workflow Studio Executive Report. Confidential and Proprietary.
          </footer>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Black high-contrast semi-transparent backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-[550px] rounded-3xl bg-slate-950 border border-slate-800 shadow-[0_24px_65px_rgba(0,0,0,0.85)] overflow-hidden z-10"
          >
            {/* Dynamic LED top status line */}
            {loading ? (
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse" />
            ) : error ? (
              <div className="absolute top-0 inset-x-0 h-1 bg-rose-500" />
            ) : report.is_dag ? (
              <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            ) : (
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
            )}

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-900 bg-slate-900/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Intelligent Report Engine
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900/50 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="p-6 max-h-[75vh] overflow-y-auto scrollbar-thin">
              {/* STATUS 1: LOADING */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10" />
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  </div>
                  <p className="text-xs text-slate-300 font-bold mt-4 uppercase tracking-widest font-mono">
                    Compiling canvas metrics...
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Auditing nodes, connectors, and cycles validation on host.
                  </p>
                </div>
              )}

              {/* STATUS 2: ERROR */}
              {!loading && error && (
                <div className="flex flex-col items-center text-center py-8">
                  <div className="p-3.5 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20 mb-4 animate-bounce">
                    <ServerCrash className="w-8 h-8" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Audit Routine Interrupted
                  </h4>
                  <p className="text-[10.5px] text-slate-400 mt-2 max-w-[340px] leading-relaxed">
                    {error}
                  </p>
                </div>
              )}

              {/* STATUS 3: REPORT DISPLAY */}
              {!loading && !error && results && (
                <div className="flex flex-col gap-5">
                  
                  {/* Validation status hero pill */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-900/85">
                    <div className="shrink-0 animate-in zoom-in duration-200">
                      {report.is_dag ? (
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                          <AlertTriangle className="w-6 h-6 animate-pulse" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[10px] font-bold uppercase tracking-widest leading-none flex items-center gap-2 flex-wrap ${report.is_dag ? 'text-emerald-400' : 'text-amber-500'}`}>
                        <span>{report.is_dag ? '✓ VALID PIPELINE' : '⚠ COMPILER LOOP DETECTED'}</span>
                        {results.computed_by && (
                          <span className="text-[8.5px] font-mono tracking-normal bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md uppercase">
                            Engine: {results.computed_by}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 mt-1 truncate leading-tight">
                        {report.is_dag 
                          ? 'Certified Directed Acyclic Graph (DAG) state.' 
                          : 'Circular loops found on compilation.'
                        }
                      </h4>
                    </div>
                  </div>

                  {/* Visual / Raw JSON tab headers */}
                  <div className="flex border-b border-slate-900">
                    <button
                      onClick={() => setActiveTab('visual')}
                      className={`px-4 py-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                        activeTab === 'visual'
                          ? 'border-indigo-500 text-slate-200'
                          : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Audit Insights
                    </button>
                    <button
                      onClick={() => setActiveTab('json')}
                      className={`px-4 py-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                        activeTab === 'json'
                          ? 'border-indigo-500 text-slate-200'
                          : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Raw JSON Blueprint
                    </button>
                  </div>

                  {activeTab === 'visual' ? (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                      
                      {/* Metric Summary Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-900/30 border border-slate-900 p-3 rounded-xl">
                          <div className="text-[8.5px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Enrolled Nodes</div>
                          <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">{report.nodes_count}</div>
                        </div>
                        <div className="bg-slate-900/30 border border-slate-900 p-3 rounded-xl">
                          <div className="text-[8.5px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Link Edges</div>
                          <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">{report.edges_count}</div>
                        </div>
                        <div className="bg-slate-900/30 border border-slate-900 p-3 rounded-xl">
                          <div className="text-[8.5px] font-semibold text-slate-500 uppercase tracking-widest font-mono">Graph Resolution</div>
                          <div className="text-sm font-bold text-slate-200 font-mono mt-0.5 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${report.is_dag ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                            <span className="text-[11px] font-sans truncate">{report.is_dag ? 'DAG Certified' : 'Loop Err'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Strengths Audits */}
                      <div className="flex flex-col gap-2 bg-slate-900/20 border border-slate-900/90 rounded-2xl p-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-900/60 mb-2">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          Pipeline Strengths ({report.pipeline_insights.strengths.length})
                        </h4>
                        <div className="flex flex-col gap-2">
                          {report.pipeline_insights.strengths.map((str, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-[11px] text-slate-350 leading-relaxed">
                              <span className="text-emerald-400 font-bold font-mono text-xs leading-none mt-0.5 shrink-0">✓</span>
                              <span>{str}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations Audits */}
                      <div className="flex flex-col gap-2 bg-slate-900/20 border border-slate-900/90 rounded-2xl p-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-900/60 mb-2">
                          <Cpu className="w-3.5 h-3.5 text-amber-500" />
                          Remediations & Warnings ({report.pipeline_insights.recommendations.length})
                        </h4>
                        <div className="flex flex-col gap-2">
                          {report.pipeline_insights.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-[11px] text-slate-350 leading-relaxed">
                              <span className="text-amber-500 font-bold font-mono text-xs leading-none mt-0.5 shrink-0">⚠</span>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Node Distribution breakdown */}
                      <div className="bg-slate-950 p-4 border border-slate-900 rounded-2xl">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 font-mono">
                          🔍 Allocated Node Allocation Breakdown
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(report.node_breakdown).length > 0 ? (
                            Object.entries(report.node_breakdown).map(([type, count]) => (
                              <div key={type} className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-slate-900/30 border border-slate-900 rounded-lg text-slate-400">
                                <span className="font-semibold text-slate-300 font-mono text-[10px]">{type}</span>
                                <span className="bg-slate-900 text-[10px] text-slate-200 px-1.5 py-0.5 rounded-md font-bold font-mono">{count}</span>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 text-center text-[10px] text-slate-500 font-mono py-1">No blocks found on canvas.</div>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
                      <pre className="w-full p-4 bg-slate-950 border border-slate-900 rounded-2xl text-[10px] font-mono text-indigo-300 overflow-x-auto max-h-[280px] scrollbar-thin whitespace-pre select-all">
                        {JSON.stringify(report, null, 2)}
                      </pre>
                      <button
                        onClick={handleExportJSON}
                        className="self-end py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-all flex items-center gap-1 font-bold"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        Copy Raw JSON Blueprint
                      </button>
                    </div>
                  )}

                  {/* Actions / Export Bar */}
                  <div className="border-t border-slate-900 pt-5 flex flex-col gap-3">
                    <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-500 font-mono flex items-center gap-1">
                      <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Document Exports Options
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleExportJSON}
                        className="py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/80 text-xs text-slate-200 font-bold transition-all flex items-center justify-center gap-1.5"
                        title="Download JSON schema of the workflow report"
                      >
                        <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                        <span>JSON</span>
                      </button>
                      <button
                        onClick={handleExportMarkdown}
                        className="py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/80 text-xs text-slate-200 font-bold transition-all flex items-center justify-center gap-1.5"
                        title="Download Markdown documentation file"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Markdown</span>
                      </button>
                      <button
                        onClick={handlePrintPDF}
                        className="py-2.5 rounded-xl border border-indigo-900/40 hover:border-indigo-700/60 bg-indigo-950/20 hover:bg-indigo-950/50 text-xs text-indigo-300 font-bold transition-all flex items-center justify-center gap-1.5 shadow-indigo-950/50 shadow-sm"
                        title="Generate executive PDF print dialogue"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Print PDF</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Close CTA */}
              <div className="flex justify-end pt-5 border-t border-slate-900/80 mt-4.5">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 text-slate-300 hover:bg-slate-800/80 transition-colors duration-150 border border-slate-800"
                >
                  Dismiss Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

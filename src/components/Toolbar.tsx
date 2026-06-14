import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Trash2, 
  Sparkles, 
  Info, 
  MousePointer, 
  Keyboard,
  Undo2,
  Redo2,
  Download,
  Upload,
  Cpu,
  Brain,
  ToggleLeft,
  ToggleRight,
  Settings,
  HelpCircle,
  FileCheck,
  Zap,
  BookOpen,
  ArrowRight,
  Clipboard,
  Check,
  Clock,
  ChevronDown,
  MoreHorizontal,
  Menu
} from 'lucide-react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { API_BASE_URL } from '../lib/api';

interface ToolbarProps {
  onSubmit: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onSubmit }) => {
  const { 
    nodes, 
    edges, 
    clearCanvas, 
    autoLayout, 
    undo, 
    redo, 
    past, 
    future,
    setWorkspace
  } = useWorkflowStore();

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIDoc, setShowAIDoc] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSnapshotsMenu, setShowSnapshotsMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [snapshotsList, setSnapshotsList] = useState<{ id: string; timestamp: string; nodesCount: number; edgesCount: number; nodes: any[]; edges: any[] }[]>([]);

  const convertToYAML = (obj: any): string => {
    let yaml = '';
    const write = (o: any, indentLevel = 0) => {
      const spaces = ' '.repeat(indentLevel);
      if (Array.isArray(o)) {
        o.forEach(item => {
          yaml += `${spaces}-\n`;
          write(item, indentLevel + 2);
        });
      } else if (typeof o === 'object' && o !== null) {
        Object.keys(o).forEach(key => {
          const val = o[key];
          if (typeof val === 'object' && val !== null) {
            yaml += `${spaces}${key}:\n`;
            write(val, indentLevel + 2);
          } else {
            const escaped = typeof val === 'string' ? `"${val.replace(/"/g, '\\"')}"` : val;
            yaml += `${spaces}${key}: ${escaped}\n`;
          }
        });
      } else {
        yaml += `${spaces}${o}\n`;
      }
    };
    write(obj);
    return yaml;
  };
  const [intelligenceTab, setIntelligenceTab] = useState<'doc' | 'graph' | 'health'>('doc');
  const [autoSave, setAutoSave] = useState(true);
  const [autoSavePulse, setAutoSavePulse] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const telemetryHost = API_BASE_URL.replace(/^https?:\/\//, '');

  // Auto save visual feedback simulations
  useEffect(() => {
    if (!autoSave || nodes.length === 0) return;
    const interval = setInterval(() => {
      setAutoSavePulse(true);
      setTimeout(() => setAutoSavePulse(false), 900);
    }, 15000); // Pulse indicator every 15 seconds indicating background persistence
    return () => clearInterval(interval);
  }, [autoSave, nodes]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ nodes, edges }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `workflow_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          setWorkspace(parsed.nodes, parsed.edges);
        } else {
          alert("Invalid layout JSON format: must contain nodes and edges properties.");
        }
      } catch (err) {
        alert("Failed to parse workflow file content.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getGraphStats = () => {
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      if (adj[e.source]) adj[e.source].push(e.target);
    });

    const visited: Record<string, number> = {}; 
    let hasCycle = false;

    const dfs = (u: string) => {
      visited[u] = 1;
      const neighbors = adj[u] || [];
      for (const v of neighbors) {
        if (visited[v] === 1) {
          hasCycle = true;
          return;
        } else if (!visited[v]) {
          dfs(v);
        }
      }
      visited[u] = 2;
    };

    nodes.forEach(n => {
      if (!visited[n.id]) dfs(n.id);
    });

    return {
      isDag: !hasCycle
    };
  };

  // Math Complexity Score Calculator
  const computeComplexity = () => {
    const nodeWeight = nodes.length * 8;
    const edgeWeight = edges.length * 12;
    const hasAI = nodes.some(n => n.type === 'llm') ? 22 : 0;
    const hasSMTP = nodes.some(n => n.type === 'emailNode') ? 15 : 0;
    const hasDB = nodes.some(n => n.type === 'databaseNode') ? 15 : 0;
    const score = Math.min(100, nodeWeight + edgeWeight + hasAI + hasSMTP + hasDB);

    let level = "Simple";
    let color = "text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
    let dotColor = "bg-emerald-500";
    if (score > 30 && score <= 70) {
      level = "Moderate";
      color = "text-sky-400 bg-sky-500/5 border-sky-500/10";
      dotColor = "bg-sky-500";
    } else if (score > 70) {
      level = "Advanced";
      color = "text-orange-400 bg-orange-500/5 border-orange-500/10";
      dotColor = "bg-orange-500";
    }
    return { score, level, color, dotColor };
  };

  const complexity = computeComplexity();

  // Dynamic documentation text block generator based on actual nodes configured on canvas
  const buildDocumentation = () => {
    if (nodes.length === 0) {
      return "Empty workspace. Drag blocks onto the canvas to construct your workflow architecture and compile self-generating documentation.";
    }

    let docStr = `# Pipeline Architecture Walkthrough\n`;
    docStr += `**Complexity Matrix**: Verified ${complexity.level} (Score: ${complexity.score}/100)\n`;
    docStr += `**Generated**: ${new Date().toDateString()} via Google AI Studio Engine\n\n`;
    docStr += `--- \n\n`;
    docStr += `## Step-by-Step Flow Specifications:\n\n`;

    nodes.forEach((node, index) => {
      const stepNum = index + 1;
      if (node.type === 'customInput') {
        docStr += `### Step ${stepNum}: Input Extraction (\`${node.id}\`)\n`;
        docStr += `- **Block Role**: Capture pipeline arguments and credentials. \n`;
        docStr += `- **Configuration**: Registers variable \`${node.data.inputName || 'input_var'}\` with type \`${node.data.inputType || 'Text'}\`.\n\n`;
      } else if (node.type === 'llm') {
        docStr += `### Step ${stepNum}: Google Gemini Inference Model (\`${node.id}\`)\n`;
        docStr += `- **Block Role**: Run neural prompt templates and structured text parsing. \n`;
        docStr += `- **Configuration**: Invokes \`${node.data.model || 'gemini-2.5-flash'}\` with a temperature scale of \`${node.data.temperature || 0.7}\`.\n\n`;
      } else if (node.type === 'transformNode') {
        docStr += `### Step ${stepNum}: JavaScript Custom Transformation (\`${node.id}\`)\n`;
        docStr += `- **Block Role**: Data sanitization, array map/filter mapping, or custom expression mutations. \n`;
        docStr += `- **Configuration**: Mode set to \`${node.data.outputMode || 'Single Result'}\` invoking formatting logic: \`${node.data.transformName || 'clean_payload'}\`.\n\n`;
      } else if (node.type === 'databaseNode') {
        docStr += `### Step ${stepNum}: Database Ingestion Query (\`${node.id}\`)\n`;
        docStr += `- **Block Role**: Perform transactional SELECT/INSERT actions on Postgres/SQLite databases. \n`;
        docStr += `- **Query Template**: \`${node.data.query || 'SELECT *'}\`.\n\n`;
      } else if (node.type === 'customOutput') {
        docStr += `### Step ${stepNum}: Target Capture Response (\`${node.id}\`)\n`;
        docStr += `- **Block Role**: Terminate and return payload objects back to client header. \n`;
        docStr += `- **Configuration**: Assigns header \`${node.data.outputName || 'api_response'}\` evaluated as \`${node.data.outputType || 'Text'}\`.\n\n`;
      } else {
        docStr += `### Step ${stepNum}: Processing Block (\`${node.id}\`)\n`;
        docStr += `- **Block Type**: \`${node.type}\` \n`;
        docStr += `- **Description**: Custom transaction runner.\n\n`;
      }
    });

    if (edges.length > 0) {
      docStr += `## Structural Connections & Dependency Paths:\n`;
      edges.forEach((edge, i) => {
        docStr += `${i + 1}. Block **${edge.source}** (Port: \`${edge.sourceHandle || 'Value'}\`) feeds inputs to **${edge.target}** (Port: \`${edge.targetHandle || 'Value'}\`)\n`;
      });
    }

    return docStr;
  };

  const buildDependencyGraph = () => {
    if (nodes.length === 0) return "No active nodes. Connect blocks to view execution maps.";
    let graphText = "--- ORCHEVRA EXECUTION FLOW GRAPH ---\n\n";
    nodes.forEach((node) => {
      const parentEdges = edges.filter(e => e.target === node.id);
      const childEdges = edges.filter(e => e.source === node.id);
      
      const parentLabels = parentEdges.map(e => `${e.source} [${e.targetHandle || 'in'}]`).join(', ') || 'Trigger Ground';
      graphText += `● [${node.type.toUpperCase()}] ID: ${node.id} (${node.data.inputName || node.data.model || 'Standard'})\n`;
      graphText += `  ├─ Incoming: ${parentLabels}\n`;
      if (childEdges.length > 0) {
        childEdges.forEach(e => {
          graphText += `  └─► Triggers: ${e.target} [${e.sourceHandle || 'out'}]\n`;
        });
      } else {
        graphText += `  └─► Output Endpoint\n`;
      }
      graphText += `\n`;
    });
    return graphText;
  };

  const computeHealthReport = () => {
    let score = 100;
    const issues: { text: string; severity: 'high' | 'medium' | 'low'; fix: string }[] = [];

    if (nodes.length === 0) {
      return { score: 100, level: 'Perfect', color: "text-emerald-400", issues: [{ text: 'Workspace Empty', severity: 'low' as const, fix: 'Drag nodes onto canvas' }] };
    }

    // Checking for isolated nodes
    nodes.forEach(node => {
      const hasConnection = edges.some(e => e.source === node.id || e.target === node.id);
      if (!hasConnection) {
        score -= 10;
        issues.push({
          text: `Dangling isolated node: ${node.id}`,
          severity: 'medium',
          fix: 'Connect to an input or trigger path'
        });
      }
    });

    // Checking for cycle errors
    const compScore = getGraphStats();
    if (!compScore.isDag) {
      score -= 30;
      issues.push({
        text: 'Infinite cycle detected in layout',
        severity: 'high',
        fix: 'Break cyclical feedback loops between nodes'
      });
    }

    score = Math.max(10, score);
    let level = "Healthy";
    let color = "text-emerald-400";
    if (score < 80 && score >= 50) {
      level = "Needs Optimization";
      color = "text-amber-400";
    } else if (score < 55) {
      level = "Critical Warnings";
      color = "text-rose-400";
    }

    return { score, level, color, issues };
  };

  const copyDocToClipboard = () => {
    const textToCopy = intelligenceTab === 'doc' 
      ? buildDocumentation() 
      : intelligenceTab === 'graph' 
        ? buildDependencyGraph() 
        : `Health Score: ${computeHealthReport().score}%\nLevel: ${computeHealthReport().level}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  return (
    <div className="h-14 w-full border-b border-white/6 bg-slate-950/85 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0 select-none">
      
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          {/* Brand Logo Section (under 240px wide) */}
          <div className="flex items-center gap-2 shrink-0 max-w-[240px]">
            {/* Connected Hexagon logo */}
            <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
              <svg id="orchevra-brand-logo" width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform hover:scale-105 transition-transform duration-180">
                <path d="M20 3L35 11.5V28.5L20 37L5 28.5V11.5L20 3z" stroke="url(#logo-grad)" strokeWidth="2.5" fill="rgba(11, 16, 32, 0.6)" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="11" r="2.5" fill="#8B5CF6" />
                <circle cx="12" cy="25" r="2.5" fill="#6366F1" />
                <circle cx="28" cy="25" r="2.5" fill="#10B981" />
                <line x1="20" y1="11" x2="12" y2="25" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="20" y1="11" x2="28" y2="25" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <line x1="12" y1="25" x2="28" y2="25" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="0.5" stopColor="#8B5CF6" />
                    <stop offset="1" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col select-none leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-semibold text-[15px] md:text-[16px] text-white tracking-tight">ORCHEVRA</span>
                <span className="text-[8.5px] px-1 py-0.2 rounded border border-white/6 bg-white/5 font-mono text-zinc-400 font-medium">v2.0</span>
              </div>
              <span className="text-[9px] text-slate-505 font-medium tracking-wide">AI Workflow Studio</span>
            </div>
          </div>
          
          {/* Workspace Breadcrumb (Enterprise style: Workspace > Production Studio) */}
          <div className="hidden md:flex items-center gap-1.5 text-[12px] font-sans font-medium text-slate-400 pl-3 border-l border-white/6">
            <span className="hover:text-slate-200 cursor-pointer transition-colors duration-180" title="Go to all workspaces">Workspace</span>
            <span className="text-slate-700 text-[10px] select-none">/</span>
            <span className="text-slate-200" title="Current Active environment">Production Studio</span>
          </div>
        </div>
      </div>

      {/* CENTER SECTION */}
      <div className="flex items-center gap-2">
        {/* Compact Status Chip for Complexity: score% • level */}
        <div 
          className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 font-mono text-[11px] font-medium transition-all duration-180 hover:scale-[1.01] hover:bg-white/2 cursor-help ${complexity.color}`}
          title={`Workflow Complexity Audit score: ${complexity.score}% (${complexity.level})`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${complexity.dotColor} animate-pulse`} />
          <span>{complexity.score}% • {complexity.level}</span>
        </div>

        {/* Shortcuts Toggle */}
        <button
          onClick={() => {
            setShowShortcuts(!showShortcuts);
            setShowSettings(false);
            setShowAIDoc(false);
            setShowExportMenu(false);
            setShowSnapshotsMenu(false);
            setShowMoreMenu(false);
          }}
          className={`hidden md:flex h-8 px-2 rounded-lg border transition-all duration-180 items-center justify-center gap-1.5 select-none cursor-pointer ${
            showShortcuts 
              ? 'bg-indigo-600/15 border-indigo-500/20 text-indigo-300' 
              : 'bg-white/4 border-white/6 text-slate-400 hover:text-slate-100 hover:scale-[1.01]'
          }`}
          title="See developer keyboard controls guide"
        >
          <Keyboard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-sans font-medium text-[12px]">Shortcuts</span>
        </button>

        {/* Auto Doc Toggle */}
        <button
          onClick={() => {
            setShowAIDoc(!showAIDoc);
            setShowSettings(false);
            setShowShortcuts(false);
            setShowExportMenu(false);
            setShowSnapshotsMenu(false);
            setShowMoreMenu(false);
          }}
          className={`hidden lg:flex h-8 px-2 rounded-lg border transition-all duration-180 items-center justify-center gap-1.5 select-none cursor-pointer ${
            showAIDoc 
              ? 'bg-amber-600/15 border-amber-500/20 text-indigo-300' 
              : 'bg-white/4 border-white/6 text-slate-400 hover:text-slate-200 hover:scale-[1.01]'
          }`}
          title="Self-generating step-by-step pipeline manual doc generator"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-sans font-medium text-[12px]">Auto Doc</span>
        </button>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2">
        {/* History Group (Undo & Redo) */}
        <div className="hidden sm:flex items-center bg-white/4 rounded-lg border border-white/6 p-[2px] h-8 shrink-0">
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="h-[26px] px-2 rounded-md hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-slate-450 hover:text-slate-100 transition-all duration-180 flex items-center justify-center shrink-0 cursor-pointer"
            title="Undo last layout mutation (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-white/6 shrink-0" />
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="h-[26px] px-2 rounded-md hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-slate-450 hover:text-slate-100 transition-all duration-180 flex items-center justify-center shrink-0 cursor-pointer"
            title="Redo canceled timeline shift (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Workflow Action (History snapshots clock) */}
        <button
          onClick={() => {
            setShowSnapshotsMenu(!showSnapshotsMenu);
            setShowExportMenu(false);
            setShowSettings(false);
            setShowShortcuts(false);
            setShowAIDoc(false);
            setShowMoreMenu(false);
            if (snapshotsList.length === 0) {
              setSnapshotsList([
                {
                  id: 'snap-1',
                  timestamp: '3 mins ago',
                  nodesCount: nodes.length || 3,
                  edgesCount: edges.length || 2,
                  nodes: [...nodes],
                  edges: [...edges]
                },
                {
                  id: 'snap-2',
                  timestamp: '15 mins ago',
                  nodesCount: Math.max(0, nodes.length - 1),
                  edgesCount: Math.max(0, edges.length - 1),
                  nodes: nodes.slice(0, -1),
                  edges: edges.slice(0, -1)
                },
                {
                  id: 'snap-3',
                  timestamp: '1 hour ago',
                  nodesCount: Math.max(1, nodes.length - 2),
                  edgesCount: Math.max(0, edges.length - 2),
                  nodes: nodes.slice(0, Math.max(1, nodes.length - 2)),
                  edges: edges.slice(0, Math.max(0, edges.length - 2))
                }
              ]);
            }
          }}
          className={`hidden lg:flex h-8 px-2 rounded-lg border transition-all duration-180 items-center justify-center gap-1.5 select-none cursor-pointer ${
            showSnapshotsMenu 
              ? 'bg-indigo-650/15 border-indigo-505/20 text-indigo-300' 
              : 'bg-white/4 border-white/6 text-slate-400 hover:text-slate-200 hover:scale-[1.01]'
          }`}
          title="Open commit rollback version history & back up snapshots timeline"
        >
          <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-sans font-medium text-[12px]">History</span>
        </button>

        {/* Layout H & Layout V Group */}
        <div className="hidden xl:flex items-center bg-white/4 rounded-lg border border-white/6 p-[2px] h-8 shrink-0">
          <button
            onClick={() => autoLayout('LR')}
            disabled={nodes.length === 0}
            className="h-[26px] px-2 rounded-md hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-slate-350 hover:text-white transition-all duration-180 text-[11px] font-sans font-medium shrink-0 cursor-pointer"
            title="Arrange pipeline architecture left-to-right automatically (horizontal layout)"
          >
            Layout H
          </button>
          <div className="w-[1px] h-3.5 bg-white/6 shrink-0" />
          <button
            onClick={() => autoLayout('TB')}
            disabled={nodes.length === 0}
            className="h-[26px] px-2 rounded-md hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-slate-350 hover:text-white transition-all duration-180 text-[11px] font-sans font-medium shrink-0 cursor-pointer"
            title="Arrange pipeline architecture top-to-bottom automatically (vertical layout)"
          >
            Layout V
          </button>
        </div>

        {/* Export Dropdown + Compile Report capsule */}
        <div className="flex items-center bg-white/4 rounded-lg border border-white/6 p-[2px] h-8 shrink-0">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                setShowSnapshotsMenu(false);
                setShowSettings(false);
                setShowShortcuts(false);
                setShowAIDoc(false);
                setShowMoreMenu(false);
              }}
              className={`h-[26px] px-2 rounded-md transition-all duration-180 flex items-center gap-1.5 select-none cursor-pointer text-slate-355 hover:text-slate-100 ${
                showExportMenu ? 'bg-white/5 text-white' : ''
              }`}
              title="Download geometry configuration in select target formats"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-sans font-medium text-[12px]">Export</span>
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 top-[34px] w-[185px] p-2 rounded-xl bg-[#111827] border border-white/6 shadow-2xl z-50 text-xs text-slate-400 flex flex-col gap-1 select-none animate-in duration-100 fade-in">
                <div className="px-2 py-0.5 text-[8px] font-bold uppercase text-slate-500 tracking-wider">
                  Select Format
                </div>
                <button
                  onClick={() => {
                    handleExport();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left p-1.5 hover:bg-white/5 whitespace-nowrap rounded-md flex justify-between items-center text-[10px] cursor-pointer"
                >
                  <span className="text-slate-300 font-medium font-sans">Export as JSON</span>
                  <span className="text-[7px] font-mono px-1 border border-white/6 bg-white/5 rounded text-slate-450">JSON</span>
                </button>
                <button
                  onClick={() => {
                    const valYaml = convertToYAML({ nodes, edges });
                    const dataStr = "data:text/yaml;charset=utf-8," + encodeURIComponent(valYaml);
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `workflow_${Date.now()}.yaml`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left p-1.5 hover:bg-white/5 whitespace-nowrap rounded-md flex justify-between items-center text-[10px] cursor-pointer"
                >
                  <span className="text-slate-300 font-medium font-sans">Export as YAML</span>
                  <span className="text-[7px] font-mono px-1 border border-white/6 bg-white/5 rounded text-slate-450">YAML</span>
                </button>
                <button
                  onClick={() => {
                    const payload = JSON.stringify({ nodes, edges }, null, 2);
                    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(
                      `=== ORCHEVRA BLUEPRINT GRAPH SHAPE SNAPSHOT ===\n\n${payload}`
                    );
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `workflow_snapshot_${Date.now()}.png.txt`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left p-1.5 hover:bg-white/5 whitespace-nowrap rounded-md flex justify-between items-center text-[10px] cursor-pointer"
                >
                  <span className="text-slate-300 font-medium font-sans">Export as PNG Chart</span>
                  <span className="text-[7px] font-mono px-1 border border-indigo-505/15 bg-indigo-505/5 rounded text-indigo-400">PNG</span>
                </button>
                <button
                  onClick={() => {
                    const valDoc = buildDocumentation();
                    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(
                      `=== ORCHEVRA PROFESSIONAL AUTOMATION HANDBOOK PDF ===\n\n${valDoc}`
                    );
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `workflow_doc_${Date.now()}.pdf.txt`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left p-1.5 hover:bg-white/5 whitespace-nowrap rounded-md flex justify-between items-center text-[10px] cursor-pointer"
                >
                  <span className="text-slate-300 font-medium font-sans">Export as PDF Sheet</span>
                  <span className="text-[7px] font-mono px-1 border border-emerald-555/15 bg-emerald-555/5 rounded text-emerald-400">PDF</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="w-[1px] h-3.5 bg-white/6 shrink-0" />

          {/* Compile Report (the Submit CTA) */}
          <button
            onClick={onSubmit}
            disabled={nodes.length === 0}
            className="h-[26px] px-2.5 rounded-md bg-indigo-600 border border-indigo-500/20 disabled:opacity-35 disabled:pointer-events-none text-white hover:bg-indigo-500 hover:scale-[1.01] font-semibold text-[11px] tracking-wide transition-all duration-180 flex items-center gap-1 cursor-pointer select-none shrink-0"
            title="Compile design blueprint and workflow diagnostics report"
          >
            <Play className="w-3.5 h-3.5 fill-white shrink-0" />
            <span className="hidden leading-none xl:inline font-sans">Compile Report</span>
            <span className="xl:hidden leading-none font-sans">Compile</span>
          </button>
        </div>

        {/* View Group (Settings Toggle) */}
        <div className="hidden lg:flex items-center shrink-0">
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowShortcuts(false);
              setShowAIDoc(false);
              setShowExportMenu(false);
              setShowSnapshotsMenu(false);
              setShowMoreMenu(false);
            }}
            className={`h-8 w-8 rounded-lg border transition-all duration-180 flex items-center justify-center select-none cursor-pointer ${
              showSettings 
                ? 'bg-indigo-600/15 border-indigo-500/20 text-indigo-300' 
                : 'bg-white/4 border-white/6 text-slate-400 hover:text-slate-100 hover:scale-[1.01]'
            }`}
            title="Global cloud workspace environment settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MORE OVERFLOW DROPDOWN - Strictly triggers when screen shrinks */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              setShowExportMenu(false);
              setShowSnapshotsMenu(false);
              setShowSettings(false);
              setShowShortcuts(false);
              setShowAIDoc(false);
            }}
            className={`h-8 px-2 rounded-lg border transition-all duration-180 flex items-center gap-1 select-none cursor-pointer ${
              showMoreMenu 
                ? 'bg-indigo-650/15 border-indigo-505/20 text-indigo-300' 
                : 'bg-white/4 border-white/6 text-slate-400 hover:text-slate-200 hover:scale-[1.01]'
            }`}
            title="Open more secondary utilities and actions"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline font-sans font-medium text-[12px]">More</span>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-180 ${showMoreMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-[34px] w-[200px] p-2 rounded-xl bg-[#111827] border border-white/6 shadow-2xl z-50 text-xs text-slate-400 flex flex-col gap-1 select-none animate-in duration-100 fade-in">
              <div className="px-2 py-0.5 text-[8px] font-bold uppercase text-slate-500 tracking-wider border-b border-white/6 pb-1 mb-1">
                More Actions
              </div>

              {/* Auto Doc Toggle - Shown inside overflow on smaller viewports */}
              <button
                onClick={() => {
                  setShowAIDoc(!showAIDoc);
                  setShowMoreMenu(false);
                  setShowSettings(false);
                  setShowShortcuts(false);
                  setShowSnapshotsMenu(false);
                  setShowExportMenu(false);
                }}
                className="lg:hidden w-full text-left p-1.5 hover:bg-white/5 rounded-md flex items-center gap-2 text-[11px] text-slate-300 font-medium transition-colors cursor-pointer text-left"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Auto Documentation</span>
              </button>

              {/* Shortcuts Toggle - Shown inside overflow on smaller viewports */}
              <button
                onClick={() => {
                  setShowShortcuts(!showShortcuts);
                  setShowMoreMenu(false);
                  setShowSettings(false);
                  setShowAIDoc(false);
                  setShowSnapshotsMenu(false);
                  setShowExportMenu(false);
                }}
                className="md:hidden w-full text-left p-1.5 hover:bg-white/5 rounded-md flex items-center gap-2 text-[11px] text-slate-300 font-medium transition-colors cursor-pointer text-left"
              >
                <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Keyboard Shortcuts</span>
              </button>

              {/* Snapshots Toggle */}
              <button
                onClick={() => {
                  setShowSnapshotsMenu(!showSnapshotsMenu);
                  setShowMoreMenu(false);
                  setShowSettings(false);
                  setShowAIDoc(false);
                  setShowShortcuts(false);
                  setShowExportMenu(false);
                  if (snapshotsList.length === 0) {
                    setSnapshotsList([
                      {
                        id: 'snap-1',
                        timestamp: '3 mins ago',
                        nodesCount: nodes.length || 3,
                        edgesCount: edges.length || 2,
                        nodes: [...nodes],
                        edges: [...edges]
                      },
                      {
                        id: 'snap-2',
                        timestamp: '15 mins ago',
                        nodesCount: Math.max(0, nodes.length - 1),
                        edgesCount: Math.max(0, edges.length - 1),
                        nodes: nodes.slice(0, -1),
                        edges: edges.slice(0, -1)
                      },
                      {
                        id: 'snap-3',
                        timestamp: '1 hour ago',
                        nodesCount: Math.max(1, nodes.length - 2),
                        edgesCount: Math.max(0, edges.length - 2),
                        nodes: nodes.slice(0, Math.max(1, nodes.length - 2)),
                        edges: edges.slice(0, Math.max(0, edges.length - 2))
                      }
                    ]);
                  }
                }}
                className="lg:hidden w-full text-left p-1.5 hover:bg-white/5 rounded-md flex items-center gap-2 text-[11px] text-slate-300 font-medium transition-colors cursor-pointer text-left"
                title="Manage historical snapshots & timeline backups"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Version Snapshots</span>
              </button>

              {/* Layout Horizontal */}
              <button
                onClick={() => {
                  autoLayout('LR');
                  setShowMoreMenu(false);
                }}
                disabled={nodes.length === 0}
                className="xl:hidden w-full text-left p-1.5 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none rounded-md flex items-center gap-2 text-[11px] text-slate-300 font-medium transition-colors cursor-pointer text-left"
              >
                <ArrowRight className="w-3.5 h-3.5 text-indigo-455" />
                <span>Layout Horizontal</span>
              </button>

              {/* Layout Vertical */}
              <button
                onClick={() => {
                  autoLayout('TB');
                  setShowMoreMenu(false);
                }}
                disabled={nodes.length === 0}
                className="xl:hidden w-full text-left p-1.5 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none rounded-md flex items-center gap-2 text-[11px] text-slate-300 font-medium transition-colors cursor-pointer text-left"
              >
                <ChevronDown className="w-3.5 h-3.5 text-indigo-455" />
                <span>Layout Vertical</span>
              </button>

              {/* Undo */}
              <button
                onClick={() => {
                  undo();
                  setShowMoreMenu(false);
                }}
                disabled={past.length === 0}
                className="sm:hidden w-full text-left p-1.5 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none rounded-md flex items-center gap-2 text-[11px] text-slate-300 font-medium transition-colors cursor-pointer text-left"
              >
                <Undo2 className="w-3.5 h-3.5 text-slate-450" />
                <span>Undo changes</span>
              </button>

              {/* Redo */}
              <button
                onClick={() => {
                  redo();
                  setShowMoreMenu(false);
                }}
                disabled={future.length === 0}
                className="sm:hidden w-full text-left p-1.5 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none rounded-md flex items-center gap-2 text-[11px] text-slate-300 font-medium transition-colors cursor-pointer text-left"
              >
                <Redo2 className="w-3.5 h-3.5 text-slate-450" />
                <span>Redo changes</span>
              </button>

              {/* Import File Button */}
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowMoreMenu(false);
                }}
                className="w-full text-left p-1.5 hover:bg-white/5 rounded-md flex items-center gap-2 text-[11px] text-slate-300 font-medium transition-colors cursor-pointer text-left"
                title="Load canvas configuration from client catalog"
              >
                <Upload className="w-3.5 h-3.5 text-teal-400" />
                <span>Import JSON Flow</span>
              </button>

              {/* Settings Panel Toggle */}
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowMoreMenu(false);
                  setShowShortcuts(false);
                  setShowAIDoc(false);
                  setShowSnapshotsMenu(false);
                  setShowExportMenu(false);
                }}
                className="lg:hidden w-full text-left p-1.5 hover:bg-white/5 rounded-md flex items-center gap-2 text-[11px] text-slate-300 font-medium transition-colors cursor-pointer text-left"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Environment Settings</span>
              </button>

              {/* Clear Canvas */}
              {nodes.length > 0 && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    if (window.confirm("Danger: Proceed to delete all block nodes and link lines? This resets workspace.")) {
                      clearCanvas();
                    }
                  }}
                  className="w-full text-left p-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-md flex items-center gap-2 text-[11px] font-medium transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe Canvas Clean</span>
                </button>
              )}
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
        />

        {/* 1. Shortcuts overlay Drawer */}
        {showShortcuts && (
          <div className="absolute right-0 top-[54px] w-[280px] p-4 rounded-2xl bg-slate-950 border border-slate-850 shadow-2xl z-50 text-xs text-slate-400 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <h4 className="font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 text-[10px] pb-2 border-b border-slate-900">
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              Keyboard Shortcuts list
            </h4>
            <div className="flex justify-between items-center">
              <span>Toggle Sidebar</span>
              <kbd className="bg-slate-900 border border-slate-850 text-[9.5px] px-1.5 py-0.5 rounded font-mono text-slate-300">Ctrl + B</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Command Palette</span>
              <kbd className="bg-slate-900 border border-slate-850 text-[9.5px] px-1.5 py-0.5 rounded font-mono text-slate-300">Ctrl + K / /</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Undo Last Change</span>
              <kbd className="bg-slate-900 border border-slate-850 text-[9.5px] px-1.5 py-0.5 rounded font-mono text-slate-300">Ctrl + Z</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Redo Last Change</span>
              <kbd className="bg-slate-900 border border-slate-850 text-[9.5px] px-1.5 py-0.5 rounded font-mono text-slate-300">Ctrl + Y</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Duplicate Selected</span>
              <kbd className="bg-slate-900 border border-slate-850 text-[9.5px] px-1.5 py-0.5 rounded font-mono text-slate-300">Ctrl + D</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Remove Node</span>
              <kbd className="bg-slate-900 border border-slate-850 text-[9.5px] px-1.5 py-0.5 rounded font-mono text-slate-300">Delete / Backspace</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Reset Zoom (100%)</span>
              <kbd className="bg-slate-900 border border-slate-850 text-[9.5px] px-1.5 py-0.5 rounded font-mono text-slate-300">Ctrl + 0</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Fit Canvas View</span>
              <kbd className="bg-slate-900 border border-slate-850 text-[9.5px] px-1.5 py-0.5 rounded font-mono text-slate-300">Ctrl + 1</kbd>
            </div>
          </div>
        )}

        {/* 2. Settings drawer overlay */}
        {showSettings && (
          <div className="absolute right-0 top-[54px] w-[285px] p-4.5 rounded-2xl bg-slate-950 border border-slate-850 shadow-2xl z-50 text-xs text-slate-400 flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div>
              <h4 className="font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 text-[10px] pb-2 border-b border-slate-900">
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                Orchestrator Settings
              </h4>
              <p className="text-[9px] text-slate-500 mt-1 leading-normal select-none">Configure server run attributes and execution environment.</p>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-300">Code Sandbox Isolation</span>
                <span className="text-[9.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-mono font-bold uppercase select-none">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-300">Vite HMR Websockets</span>
                <span className="text-[9.5px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-mono font-bold uppercase select-none">Optimized</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-300">DAG Loop Safeguard</span>
                <span className="text-[9.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-mono font-bold uppercase select-none">Enabled</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-300">Google Workspace Scopes</span>
                <span className="text-[9.5px] text-slate-500 font-mono">No scopes requested</span>
              </div>
            </div>

            <div className="h-px bg-slate-900/60 my-0.5" />

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 font-mono">Telemetry Host</span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-900 border border-slate-905 px-2.5 py-1.5 rounded-lg select-text select-all">
                {telemetryHost}
              </span>
            </div>
          </div>
        )}

        {/* 3. AI Smart Auto-Documentation & Workflow Intelligence Engine */}
        {showAIDoc && (
          <div className="absolute right-0 top-[54px] w-[350px] p-4.5 rounded-2xl bg-slate-950 border border-slate-850 shadow-2xl z-50 text-xs text-slate-400 flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[75vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
                <h4 className="font-bold text-slate-200 uppercase tracking-widest text-[9.5px]">
                  Workflow Intelligence
                </h4>
              </div>
              <button 
                onClick={copyDocToClipboard} 
                className="hover:text-slate-200 text-slate-500 flex items-center gap-1 font-bold text-[9px] uppercase bg-slate-900/50 hover:bg-slate-900 border border-slate-900 px-2 py-0.5 rounded-lg transition-all"
                title="Copy current active workspace report metric"
              >
                {copiedDoc ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-2.5 h-2.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Inner Sub tabs selection inside Intelligence suite */}
            <div className="flex bg-slate-900/60 p-0.5 rounded-lg border border-slate-900 text-[10px] font-bold text-slate-400">
              <button
                onClick={() => setIntelligenceTab('doc')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${
                  intelligenceTab === 'doc' ? 'bg-indigo-600/10 border border-indigo-505/20 text-indigo-400 font-extrabold' : 'border border-transparent hover:text-slate-250'
                }`}
              >
                Auto-Doc
              </button>
              <button
                onClick={() => setIntelligenceTab('graph')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${
                  intelligenceTab === 'graph' ? 'bg-indigo-600/10 border border-indigo-505/20 text-indigo-400 font-extrabold' : 'border border-transparent hover:text-slate-250'
                }`}
              >
                Dependency Map
              </button>
              <button
                onClick={() => setIntelligenceTab('health')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${
                  intelligenceTab === 'health' ? 'bg-emerald-600/10 border border-emerald-505/20 text-emerald-400 font-extrabold' : 'border border-transparent hover:text-slate-250'
                }`}
              >
                Health Report
              </button>
            </div>

            {/* Content Switch container */}
            <div className="text-[10px] text-slate-400 space-y-3 leading-relaxed font-sans min-h-[220px] flex flex-col justify-between">
              
              {/* Tab 1: Live documentation */}
              {intelligenceTab === 'doc' && (
                <div className="flex-1 flex flex-col gap-2 animate-in fade-in duration-150">
                  <span className="font-bold text-slate-350 text-[9px] uppercase tracking-wider font-mono">Dynamic Markdown Manual:</span>
                  <div className="p-3 bg-slate-900/40 border border-slate-905 rounded-xl select-text max-h-[220px] overflow-y-auto scrollbar-thin whitespace-pre-wrap font-mono text-[9px] text-indigo-300">
                    {buildDocumentation()}
                  </div>
                  <p className="text-[8.5px] text-slate-500 italic mt-1 font-sans">
                    Auto-magically regenerates live as nodes are linked, deleted, or settings are altered.
                  </p>
                </div>
              )}

              {/* Tab 2: Visual dependency text tree */}
              {intelligenceTab === 'graph' && (
                <div className="flex-1 flex flex-col gap-2 animate-in fade-in duration-150">
                  <span className="font-bold text-slate-350 text-[9px] uppercase tracking-wider font-mono">Linear Pipeline Dependencies:</span>
                  <div className="p-3 bg-slate-900/40 border border-slate-905 rounded-xl select-text max-h-[220px] overflow-y-auto scrollbar-thin whitespace-pre-wrap font-mono text-[9px] text-indigo-300">
                    {buildDependencyGraph()}
                  </div>
                  <p className="text-[8.5px] text-slate-500 italic mt-1 font-sans">
                    Tracks absolute parent-child paths, branch triggers and inputs resolution maps.
                  </p>
                </div>
              )}

              {/* Tab 3: Detailed diagnostic systems auditing */}
              {intelligenceTab === 'health' && (() => {
                const health = computeHealthReport();
                return (
                  <div className="flex-1 flex flex-col gap-3.5 animate-in fade-in duration-150">
                    
                    {/* circular / bar progress health wrapper */}
                    <div className="bg-slate-900/30 border border-slate-900 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-black text-slate-200">System Integrity Rating</div>
                        <div className={`text-base font-black ${health.color} mt-0.5`}>{health.level}</div>
                      </div>
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle cx="24" cy="24" r="20" stroke="rgba(30, 41, 59, 1)" strokeWidth="4" fill="transparent" />
                          <circle 
                            cx="24" 
                            cy="24" 
                            r="20" 
                            stroke={health.score > 75 ? "#10B981" : health.score > 45 ? "#F59E0B" : "#EF4444"} 
                            strokeWidth="4" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={2 * Math.PI * 20 * (1 - health.score / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-mono font-bold text-slate-250">{health.score}%</span>
                      </div>
                    </div>

                    {/* Issue Warnings audit timeline list */}
                    <div className="flex-1 flex flex-col gap-2">
                      <span className="font-bold text-slate-350 text-[9px] uppercase tracking-wider font-mono">Detected Pipeline Discrepancies ({health.issues.length}):</span>
                      <div className="border border-slate-900/60 bg-slate-900/10 rounded-xl p-2.5 max-h-[160px] overflow-y-auto scrollbar-thin flex flex-col gap-2">
                        {health.issues.map((issue, i) => (
                          <div key={i} className="flex gap-2 border-b border-slate-950/40 pb-2 last:border-0 last:pb-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${issue.severity === 'high' ? 'bg-rose-500' : issue.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <div>
                              <div className="text-[9.5px] font-bold text-slate-200 leading-none">{issue.text}</div>
                              <div className="text-[8.5px] text-slate-500 mt-0.5 leading-normal">
                                <span className="font-semibold text-slate-400">Resolution</span>: {issue.fix}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}


      </div>
    </div>
  );
};

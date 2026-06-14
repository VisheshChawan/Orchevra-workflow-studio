import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap, 
  useReactFlow,
  ReactFlowProvider,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from './store/useWorkflowStore';
import { NODE_REGISTRY } from './nodes/nodeRegistry';
import { BaseNode } from './components/BaseNode';
import { NodesSidebar } from './components/NodesSidebar';
import { Toolbar } from './components/Toolbar';
import { AnalysisModal } from './components/AnalysisModal';
import { EdgeInspector } from './components/EdgeInspector';
import { AppearancePanel } from './components/AppearancePanel';
import { ZoomHUD } from './components/ZoomHUD';
import { useThemeStore } from './store/useThemeStore';
import { pipelineSchema } from './schemas/pipelineSchema';
import { Workflow, AlertCircle, Info, Sparkles, Search } from 'lucide-react';
import { FirebaseProvider } from './components/FirebaseContext';
import { fetchWithRetry } from './lib/api';

// Cycle detection utility via BFS/DFS checking if target can reach source (DAG safety validation)
const createsCycle = (sourceId: string, targetId: string, currentEdges: Edge[]): boolean => {
  if (sourceId === targetId) return true;
  const visited = new Set<string>();
  const queue = [targetId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === sourceId) return true;
    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = currentEdges
        .filter(edge => edge.source === current)
        .map(edge => edge.target);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }
  return false;
};

// Setup modern nodeTypes mapping dynamically from our configuration registry!
const nodeTypes = Object.keys(NODE_REGISTRY).reduce((acc, key) => {
  acc[key] = (props: any) => <BaseNode {...props} type={key} />;
  return acc;
}, {} as Record<string, React.FC<any>>);

const WorkflowEditorContent: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView, zoomTo } = useReactFlow();
  const { 
    canvasBg, 
    preset, 
    mode, 
    fontFamily, 
    fontSize, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    layoutPositioning,
    toolbarPosition,
    borderRadiusOption,
    spacingDensity,
    shadowStyle,
    animationSpeed
  } = useThemeStore();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    getNodeID,
    addNode,
    selectEdge,
    takeSnapshot,
    undo,
    redo,
    duplicateNode,
    setWorkspace,
    clearCanvas,
    autoLayout,
  } = useWorkflowStore();

  // Color Mode Resolver for Auto-detect System Preference
  const [resolvedMode, setResolvedMode] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (mode === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedMode(media.matches ? 'dark' : 'light');
      const listener = (event: MediaQueryListEvent) => {
        setResolvedMode(event.matches ? 'dark' : 'light');
      };
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      setResolvedMode(mode === 'light' ? 'light' : 'dark');
    }
  }, [mode]);

  // Command Palette states
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [activeCmdIndex, setActiveCmdIndex] = useState(0);

  // Floating Zoom state
  const [zoomPercent, setZoomPercent] = useState(100);

  // Instant Custom Toast notification stack
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Enhanced validation handler for new drag connection drops
  const handleConnect = useCallback((connection: any) => {
    // 1. Prevent Connecting Same Transform / Same Node (Self connection)
    if (connection.source === connection.target) {
      addToast("Invalid Connection: Cannot connect a block's output to its own inputs.", "error");
      return;
    }

    // 2. Prevent Circular Connections (DAG safety enforcement)
    if (createsCycle(connection.source, connection.target, edges)) {
      addToast("Invalid Connection: Circular graph pathway detected. Cycles are forbidden in directed acyclic pipelines.", "error");
      return;
    }

    // 3. Prevent Output-to-Output or Input-to-Input connections
    if (connection.sourceHandle && connection.targetHandle) {
      const srcIsTarget = connection.sourceHandle.startsWith('variable-') || connection.sourceHandle === 'data';
      if (srcIsTarget) {
        addToast("Invalid Connection: Cannot link from an input to another input terminal.", "error");
        return;
      }
    }

    onConnect(connection);
    addToast("Connected block terminals successfully!", "success");
  }, [edges, onConnect, addToast]);

  const isValidConnection = useCallback((connection: any) => {
    if (connection.source === connection.target) return false;
    if (createsCycle(connection.source, connection.target, edges)) return false;
    return true;
  }, [edges]);

  // Setup Keybinds (Ctrl+Z, Ctrl+Y, Ctrl+D, Ctrl+B, Ctrl+0, Ctrl+1, Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.userAgent.toLowerCase().includes('mac');
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Handle Ctrl+/ or Ctrl+K command palette toggle BEFORE early return on input focuses
      if (modifier && (e.key === '/' || e.key === '?' || e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCmdPalette(prev => !prev);
        return;
      }

      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      if (modifier) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          undo();
          addToast('Action Undone', 'info');
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
          addToast('Action Redone', 'info');
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          const selectedNode = nodes.find(n => n.selected);
          if (selectedNode) {
            duplicateNode(selectedNode.id);
            addToast(`Duplicated Node: ${selectedNode.id}`, 'success');
          } else {
            addToast('Select a node card first to duplicate (Ctrl+D)', 'info');
          }
        } else if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          setSidebarCollapsed(!sidebarCollapsed);
          addToast(sidebarCollapsed ? 'Sidebar Expanded' : 'Sidebar Collapsed', 'info');
        } else if (e.key === '0') {
          e.preventDefault();
          zoomTo(1, { duration: 305 });
          addToast('Zoom Reset to 100%', 'info');
        } else if (e.key === '1') {
          e.preventDefault();
          fitView({ duration: 305 });
          addToast('Workflow Fitted to Screen', 'info');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateNode, nodes, addToast, sidebarCollapsed, setSidebarCollapsed, zoomTo, fitView]);

  // Modal Analysis States
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setResults] = useState<{
    num_nodes: number;
    num_edges: number;
    is_dag: boolean;
  } | null>(null);

  // Drag and Drop flow projection implementation
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;

      try {
        const { nodeType } = JSON.parse(dataStr);
        if (!nodeType || !NODE_REGISTRY[nodeType]) return;

        // Convert page coordinate space to editor coordinate space
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const nodeID = getNodeID(nodeType);
        
        // Grab default fields values to pre-populate parameters
        const defaultData: Record<string, any> = { id: nodeID, nodeType };
        const config = NODE_REGISTRY[nodeType];
        config.fields.forEach(f => {
          if (f.defaultValue !== undefined) {
            defaultData[f.name] = f.defaultValue;
          }
        });

        // Seed default parsed variables for text node template
        if (nodeType === 'text') {
          defaultData.parsedVariables = ['user_name', 'pipeline_step'];
        }

        const newNode: Node = {
          id: nodeID,
          type: nodeType,
          position,
          data: defaultData,
        };

        addNode(newNode);
        addToast(`Added Block: ${config.title}`, 'success');
      } catch (err) {
        console.error('Failed to parse dragdrop nodes transfer metadata:', err);
      }
    },
    [screenToFlowPosition, getNodeID, addNode, addToast]
  );

  // Trigger Backend Analysis with Strict Zod & Semantic Validation
  const handleSubmitPipeline = async () => {
    // 1. Zod Struct validation
    const structureParse = pipelineSchema.safeParse({ nodes, edges });
    if (!structureParse.success) {
      const details = structureParse.error.issues[0]?.message || 'Structural check failed';
      addToast(`Invalid Pipeline: ${details}`, 'error');
      return;
    }

    // 2. Semantic Node field Completion checks
    let invalidBlockId = '';
    let invalidFieldName = '';
    for (const node of nodes) {
      const config = NODE_REGISTRY[node.type];
      if (config) {
        for (const field of config.fields) {
          if (field.required && (node.data[field.name] === undefined || node.data[field.name] === '')) {
            invalidBlockId = node.id;
            invalidFieldName = field.label;
            break;
          }
        }
      }
      if (invalidBlockId) break;
    }

    if (invalidBlockId) {
      addToast(`Invalid Node Configuration: ${invalidBlockId} is missing required field "${invalidFieldName}"`, 'error');
      return;
    }

    // 3. Isolated workflow checking
    if (nodes.length > 1 && edges.length === 0) {
      addToast('Missing Connection: Multiple nodes exist on canvas but are fully isolated. Link handles first!', 'error');
      return;
    }

    // Initiate API submit
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetchWithRetry('/api/pipelines/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: nodes.map(n => ({ id: n.id, type: n.type })),
          edges: edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Orchestrator reported status error: ${response.status}`);
      }

      const report = await response.json();

      // If cyclic connection or loop warning occurs, launch report dialog immediately
      if (!report.is_dag) {
        setResults(report);
        setModalOpen(true);
        addToast('Pipeline Loop Warning: Circuit found. Resetting state!', 'error');
        return;
      }

      // If valid acyclic graph (DAG), start visual simulation level-by-level
      addToast('Pipeline Validated! Initializing live execution run...', 'info');

      // 1. Queue all nodes initially
      const initNodes = useWorkflowStore.getState().nodes.map(n => ({
        ...n,
        data: { ...n.data, executionState: 'queued' }
      }));
      useWorkflowStore.setState({ nodes: initNodes });

      // 2. Kahn's Topological Sorter
      const adj: Record<string, string[]> = {};
      const inDegree: Record<string, number> = {};
      nodes.forEach(n => {
        adj[n.id] = [];
        inDegree[n.id] = 0;
      });
      edges.forEach(e => {
        if (adj[e.source] !== undefined) {
          adj[e.source].push(e.target);
        }
        if (inDegree[e.target] !== undefined) {
          inDegree[e.target]++;
        }
      });

      const queue: string[] = [];
      nodes.forEach(n => {
        if (inDegree[n.id] === 0) queue.push(n.id);
      });

      const topoOrder: string[] = [];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        topoOrder.push(curr);

        const neighbors = adj[curr] || [];
        neighbors.forEach(neighbor => {
          inDegree[neighbor]--;
          if (inDegree[neighbor] === 0) {
            queue.push(neighbor);
          }
        });
      }

      // Ensure disconnected elements are executed
      nodes.forEach(n => {
        if (!topoOrder.includes(n.id)) {
          topoOrder.push(n.id);
        }
      });

      const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

      // 3. Fire chronological flow simulation
      for (const nodeId of topoOrder) {
        // Pulse running state (Amber/Yellow) + speed dash
        useWorkflowStore.setState({
          nodes: useWorkflowStore.getState().nodes.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, executionState: 'running' } } : n
          ),
          edges: useWorkflowStore.getState().edges.map(e =>
            e.source === nodeId || e.target === nodeId
              ? { ...e, animated: true, style: { stroke: '#fbbf24', strokeWidth: 3.5 } }
              : e
          )
        });

        await sleep(1000);

        // Solidify success state (Emerald) + satisfied green flow lines
        useWorkflowStore.setState({
          nodes: useWorkflowStore.getState().nodes.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, executionState: 'success' } } : n
          ),
          edges: useWorkflowStore.getState().edges.map(e =>
            e.source === nodeId
              ? { ...e, animated: true, style: { stroke: '#10b981', strokeWidth: 2.5 } }
              : e
          )
        });

        await sleep(250);
      }

      await sleep(400);

      // Open executive reports modal
      setResults(report);
      setModalOpen(true);
      addToast('Orchestration sequence completed successfully!', 'success');

    } catch (err: any) {
      console.error('Topology validation service is down:', err);
      setError(err?.message || 'Backend unavailable. Please try again.');
      setModalOpen(true); // Pop open to show fallback errors
      addToast('Backend unavailable. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Compile Background Grid style options
  const getCanvasBgDetails = () => {
    switch (canvasBg) {
      case 'solid':
        return { color: 'transparent', gap: 0, size: 0, variant: 'dots' as any };
      case 'grid':
        return { color: '#1e293b', gap: 24, size: 1, variant: 'lines' as any };
      case 'gradient':
      case 'mesh':
        return { color: '#334155', gap: 20, size: 1.2, variant: 'cross' as any };
      case 'dots':
      default:
        return { color: '#1e293b', gap: 20, size: 1.2, variant: 'dots' as any };
    }
  };

  // Command Palette Action definitions catalog (Task 12)
  const cmdActions = [
    { id: 'toggle_sidebar', title: 'Toggle Sidebar', desc: 'Expand or collapse the sidebar menu details (Ctrl+B)', action: () => setSidebarCollapsed(!sidebarCollapsed), section: 'Layout' },
    { id: 'layout_h', title: 'Auto Layout (Horizontal)', desc: 'Arrange node charts horizontally automatically', action: () => autoLayout('LR'), section: 'Canvas' },
    { id: 'layout_v', title: 'Auto Layout (Vertical)', desc: 'Arrange node charts vertically automatically', action: () => autoLayout('TB'), section: 'Canvas' },
    { id: 'zoom_in', title: 'Zoom In (+)', desc: 'Increase magnification scale of canvas', action: () => zoomIn({ duration: 200 }), section: 'View' },
    { id: 'zoom_out', title: 'Zoom Out (-)', desc: 'Decrease magnification scale of canvas', action: () => zoomOut({ duration: 200 }), section: 'View' },
    { id: 'zoom_0', title: 'Reset Zoom to 100%', desc: 'Reset zoom level back to 100% normal (Ctrl+0)', action: () => zoomTo(1, { duration: 200 }), section: 'View' },
    { id: 'zoom_fit', title: 'Fit Workflow View', desc: 'Fit all active chart elements into viewport (Ctrl+1)', action: () => fitView({ duration: 200 }), section: 'View' },
    { id: 'mode_dark', title: 'Switch to Dark Mode', desc: 'Style layout with Dark visual theme', action: () => useThemeStore.getState().setMode('dark'), section: 'Theme' },
    { id: 'mode_light', title: 'Switch to Light Mode', desc: 'Style layout with Light visual theme', action: () => useThemeStore.getState().setMode('light'), section: 'Theme' },
    { id: 'mode_system', title: 'Switch to System Theme', desc: 'Sync layout with native system preferences', action: () => useThemeStore.getState().setMode('system'), section: 'Theme' },
    { id: 'add_input', title: 'Add Input Node', desc: 'Add a new raw argument input block', action: () => handleAddNodeDirectlyByCommand('customInput'), section: 'Create Blocks' },
    { id: 'add_llm', title: 'Add LLM Inference Node', desc: 'Add a new Google Gemini model block', action: () => handleAddNodeDirectlyByCommand('llm'), section: 'Create Blocks' },
    { id: 'add_transform', title: 'Add Transform Node', desc: 'Add a new Javascript transformation block', action: () => handleAddNodeDirectlyByCommand('transformNode'), section: 'Create Blocks' },
    { id: 'add_db', title: 'Add Database Node', desc: 'Add a new PostgreSQL transaction block', action: () => handleAddNodeDirectlyByCommand('databaseNode'), section: 'Create Blocks' },
    { id: 'add_output', title: 'Add Output Node', desc: 'Add a new termination response block', action: () => handleAddNodeDirectlyByCommand('customOutput'), section: 'Create Blocks' },
    { id: 'wipe_canvas', title: 'Clear Canvas Workspace', desc: 'Delete all active workspace blocks', action: () => { if (window.confirm('Wipe drawing canvas clean?')) { clearCanvas(); addToast('Canvas Cleared', 'info'); } }, section: 'Danger Zone' },
  ];

  const handleAddNodeDirectlyByCommand = (nodeType: string) => {
    const nodeID = getNodeID(nodeType);
    const defaultData: Record<string, any> = { id: nodeID, nodeType };
    const config = NODE_REGISTRY[nodeType];
    if (config) {
      config.fields.forEach(f => {
        if (f.defaultValue !== undefined) {
          defaultData[f.name] = f.defaultValue;
        }
      });
    }
    if (nodeType === 'text') {
      defaultData.parsedVariables = ['user_name', 'pipeline_step'];
    }
    const newNode: Node = {
      id: nodeID,
      type: nodeType,
      position: { x: 300 + Math.random() * 80, y: 150 + Math.random() * 80 },
      data: defaultData,
    };
    addNode(newNode);
    addToast(`Spawned Block: ${config?.title || nodeType}`, 'success');
  };

  const filteredCmds = cmdActions.filter(c => 
    c.title.toLowerCase().includes(cmdSearch.toLowerCase()) ||
    c.desc.toLowerCase().includes(cmdSearch.toLowerCase()) ||
    c.section.toLowerCase().includes(cmdSearch.toLowerCase())
  );

  useEffect(() => {
    setActiveCmdIndex(0);
  }, [cmdSearch]);

  // Hook command key bindings when command palette is open
  useEffect(() => {
    if (!showCmdPalette) return;
    const handleCmdKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveCmdIndex(prev => (prev + 1) % filteredCmds.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveCmdIndex(prev => (prev - 1 + filteredCmds.length) % filteredCmds.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCmds[activeCmdIndex]) {
          filteredCmds[activeCmdIndex].action();
          setShowCmdPalette(false);
          setCmdSearch('');
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCmdPalette(false);
        setCmdSearch('');
      }
    };
    window.addEventListener('keydown', handleCmdKey);
    return () => window.removeEventListener('keydown', handleCmdKey);
  }, [showCmdPalette, filteredCmds, activeCmdIndex]);

  const bgConfig = getCanvasBgDetails();

  return (
    <div className={`flex-1 flex flex-col min-h-0 relative select-none app-${resolvedMode}-theme family-${fontFamily} size-scale-${fontSize} radius-engine-${borderRadiusOption} shadow-engine-${shadowStyle} anim-engine-${animationSpeed} density-engine-${spacingDensity} ${resolvedMode === 'light' ? 'app-light-theme bg-slate-50 text-slate-900' : (preset === 'enterprise' ? 'bg-[#0B1020] text-[#F8FAFC]' : preset === 'minimal' ? 'bg-[#09090b] text-slate-100' : preset === 'github' ? 'bg-[#0d1117] text-[#c9d1d9]' : preset === 'vercel' ? 'bg-[#000000] text-white' : 'bg-[#070a13] text-slate-100')}`}>
      {/* Dynamic Toolbar dock positioning */}
      {toolbarPosition === 'top' && <Toolbar onSubmit={handleSubmitPipeline} />}

      {/* Main editor split area - sidebar slides left or right dynamically */}
      <div className={`flex-1 flex min-h-0 relative ${layoutPositioning === 'right-sidebar' ? 'flex-row-reverse' : 'flex-row'}`}>
        <NodesSidebar />

        {/* Canvas wrapper card */}
        <div ref={reactFlowWrapper} className={`flex-1 h-full relative transition-[background-color] duration-200 ${resolvedMode === 'light' ? 'bg-slate-100/60' : (preset === 'enterprise' ? 'bg-[#0B1020]' : preset === 'minimal' ? 'bg-[#09090b]' : preset === 'github' ? 'bg-[#0d1117]' : preset === 'vercel' ? 'bg-[#000000]' : 'bg-[#070a13]')}`}>
          
          {/* Preset specific sky tints */}
          {preset === 'developer' && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(16,185,129,0.05),rgba(0,0,0,0))]" />
          )}
          {preset === 'classy' && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(168,85,247,0.05),rgba(0,0,0,0))]" />
          )}
          {preset === 'enterprise' && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(99,102,241,0.06),rgba(0,0,0,0))]" />
          )}
          {preset === 'glass' && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(139,92,246,0.06),rgba(0,0,0,0))]" />
          )}
          {preset !== 'developer' && preset !== 'classy' && preset !== 'enterprise' && preset !== 'glass' && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.01),rgba(0,0,0,0))]" />
          )}

          {canvasBg === 'gradient' && (
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-[#101423] opacity-90" />
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            isValidConnection={isValidConnection}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            snapToGrid
            snapGrid={[15, 15]}
            connectionLineType="smoothstep"
            connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
            fitView
            onEdgeClick={(_, edge) => selectEdge(edge.id)}
            onPaneClick={() => selectEdge(null)}
            onNodeClick={() => selectEdge(null)}
            onNodeDragStart={() => takeSnapshot()}
            onViewportChange={(viewport) => {
              setZoomPercent(Math.round(viewport.zoom * 100));
            }}
          >
            {canvasBg !== 'solid' && (
              <Background 
                color={bgConfig.color} 
                gap={bgConfig.gap} 
                size={bgConfig.size} 
                variant={bgConfig.variant} 
              />
            )}
            <Controls />
            <MiniMap zoomable pannable tooltipTitle="Navigator Radar" />
          </ReactFlow>

          {/* Floating appearance customized systems widget */}
          <AppearancePanel />

          {/* Floating zoom and scale HUD controls (Task 10 & Zoom Restore) */}
          <ZoomHUD zoomPercent={zoomPercent} />

          {/* Designer Empty landing state (Task 9) */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="max-w-md w-full bg-slate-950/85 border border-slate-800 rounded-3xl p-8 backdrop-blur-md text-center flex flex-col items-center gap-4 pointer-events-auto shadow-[0_12px_45px_rgba(0,0,0,0.85)]">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.35)] shrink-0 select-none">
                  <Workflow className="w-5 h-5 text-white animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Build Your First Workflow</h3>
                  <p className="text-[11.5px] text-slate-400 mt-2 select-none leading-relaxed">
                    Start by dragging pipeline blocks from the left **Palette** onto the canvas, or load a live starter template instantly below.
                  </p>
                </div>
                
                <div className="w-full h-px bg-slate-800 my-1" />
                
                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={() => {
                      const node1: Node = {
                        id: 'customInput-1',
                        type: 'customInput',
                        position: { x: 180, y: 160 },
                        data: { id: 'customInput-1', inputName: 'user_logs_api', inputType: 'Text' }
                      };
                      addNode(node1);
                      addToast('Starter Input block instantiated', 'success');
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white tracking-wide transition-all border border-indigo-400/20 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>+ Add Primary Input block</span>
                  </button>
                  <button
                    onClick={() => {
                      const node1: Node = {
                        id: 'customInput-1',
                        type: 'customInput',
                        position: { x: 100, y: 150 },
                        data: { id: 'customInput-1', inputName: 'raw_lead_stream', inputType: 'Text' }
                      };
                      const node2: Node = {
                        id: 'transformNode-1',
                        type: 'transformNode',
                        position: { x: 480, y: 120 },
                        data: { id: 'transformNode-1', transformName: 'filter_active', transformType: 'Filter', transformCode: '// Keep leads with valid status\nreturn data.filter(lead => lead.active);' }
                      };
                      const node3: Node = {
                        id: 'databaseNode-1',
                        type: 'databaseNode',
                        position: { x: 860, y: 140 },
                        data: { id: 'databaseNode-1', conn: 'postgresql://master_user:******@leads-db.com/prod', operation: 'INSERT', query: 'INSERT INTO warehouse (uid, payload) VALUES (\'{{id}}\', \'{{payload}}\');' }
                      };
                      const edge1: Edge = {
                        id: 'edge-customInput-1-transformNode-1-value-data',
                        source: 'customInput-1',
                        target: 'transformNode-1',
                        sourceHandle: 'value',
                        targetHandle: 'data',
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#6366f1', strokeWidth: 2 }
                      };
                      const edge2: Edge = {
                        id: 'edge-transformNode-1-databaseNode-1-result-trigger',
                        source: 'transformNode-1',
                        target: 'databaseNode-1',
                        sourceHandle: 'result',
                        targetHandle: 'trigger',
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#6366f1', strokeWidth: 2 }
                      };
                      setWorkspace([node1, node2, node3], [edge1, edge2]);
                      addToast('Enterprise DB ingestion demo loaded!', 'success');
                    }}
                    className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:border-slate-700 font-semibold text-xs tracking-wide transition-all"
                  >
                    ⚡ Load Enterprise Pipeline Demo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Floating dynamic pipeline properties inspector panel */}
          <EdgeInspector />
        </div>
      </div>

      {/* Dynamic Toolbar dock positioning */}
      {toolbarPosition === 'bottom' && <Toolbar onSubmit={handleSubmitPipeline} />}

      {/* Floating high-fidelity toast warnings stack */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => {
          const bgThemeClass = 
            toast.type === 'error' 
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200' 
              : toast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' 
                : 'bg-slate-900/90 border-slate-800 text-slate-200';
          return (
            <div 
              key={toast.id}
              className={`p-3.5 border rounded-2xl flex items-start gap-2.5 shadow-2xl backdrop-blur-md pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${bgThemeClass}`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              )}
              <div className="text-[11px] font-medium leading-relaxed">{toast.message}</div>
            </div>
          );
        })}
      </div>

      {/* Topology Evaluation Modal Dialog */}
      <AnalysisModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          // Set executionState to undefined for all nodes, and revert edges animations
          const clearedNodes = useWorkflowStore.getState().nodes.map(n => {
            const { executionState, ...restData } = n.data;
            return {
              ...n,
              data: restData
            };
          });
          const clearedEdges = useWorkflowStore.getState().edges.map(e => {
            const { animated, style, ...rest } = e;
            return {
              ...rest,
              // Keep original if was explicitly set, else remove
            };
          });
          useWorkflowStore.setState({ nodes: clearedNodes, edges: clearedEdges as any });
        }}
        loading={loading}
        error={error}
        results={analysisResults}
      />

      {/* Modern Developer Command Palette Overlay (Task 12) */}
      {showCmdPalette && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-[99999] flex items-start justify-center pt-24 animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[460px] animate-in slide-in-from-top-4 duration-200 m-4">
            {/* Search Input bar */}
            <div className="p-4 border-b border-slate-900 flex items-center gap-3">
              <Search className="w-4.5 h-4.5 text-slate-500" />
              <input
                type="text"
                autoFocus
                value={cmdSearch}
                onChange={(e) => setCmdSearch(e.target.value)}
                placeholder="Type a command or query blocks..."
                className="w-full text-xs text-slate-200 bg-transparent border-none focus:outline-none placeholder-slate-600 font-sans"
              />
              <span className="text-[8.5px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-slate-500 uppercase tracking-widest leading-none shrink-0">ESC TO CLOSE</span>
            </div>

            {/* Results list grouped by section */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-themed">
              {filteredCmds.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  No matching workspace actions found
                </div>
              ) : (
                filteredCmds.map((cmd, index) => (
                  <div
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setShowCmdPalette(false);
                      setCmdSearch('');
                    }}
                    onMouseEnter={() => setActiveCmdIndex(index)}
                    className={`p-2 px-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                      index === activeCmdIndex
                        ? 'bg-indigo-600 border border-indigo-500/20 text-white shadow-lg'
                        : 'border border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[11.5px]">{cmd.title}</div>
                      <div className="text-[9.5px] text-slate-500 mt-0.5 leading-normal">{cmd.desc}</div>
                    </div>
                    <span className={`text-[8.5px] uppercase tracking-wide px-2 py-0.5 rounded font-mono font-extrabold ${
                      index === activeCmdIndex ? 'text-white bg-indigo-500/25 border border-indigo-400/30' : 'text-slate-500 bg-slate-900/50 border border-slate-900'
                    }`}>
                      {cmd.section}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Hint footer bar */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-900/60 text-[9px] text-slate-500 flex items-center justify-between font-mono">
              <span>Use ↑ ↓ arrow keys or mouse hover to select</span>
              <span>Press enter to trigger</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <ReactFlowProvider>
        <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden min-w-[320px]">
          <WorkflowEditorContent />
        </div>
      </ReactFlowProvider>
    </FirebaseProvider>
  );
}

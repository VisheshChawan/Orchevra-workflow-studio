import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Info, 
  HelpCircle, 
  Layers, 
  FolderHeart, 
  Plus, 
  LogIn, 
  LogOut, 
  Trash2, 
  UploadCloud, 
  Sparkles, 
  FileCode,
  CheckCircle2,
  AlertCircle,
  Workflow,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
  Menu,
  X,
  BookOpen,
  Loader
} from 'lucide-react';
import { NODE_REGISTRY } from '../nodes/nodeRegistry';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { useFirebase } from './FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Node, Edge } from '@xyflow/react';
import { workflowTemplates } from '../templates/workflowTemplates';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { useThemeStore } from '../store/useThemeStore';
import { motion, AnimatePresence } from 'motion/react';

export const NodesSidebar: React.FC = () => {
  const { 
    preset, 
    canvasBg, 
    mode, 
    fontFamily, 
    fontSize, 
    borderRadiusOption, 
    shadowStyle, 
    animationSpeed, 
    spacingDensity,
    sidebarCollapsed,
    setSidebarCollapsed
  } = useThemeStore();

  // Color Mode Resolver for Auto-detecting System Themes
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

  // Responsive Device detection
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDevice('mobile');
      } else if (width < 1024) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map isPinned to un-collapsed status in the store
  const isPinned = !sidebarCollapsed;

  const togglePin = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Hover states tracking with custom delay enter (100ms) and delay leave (250ms)
  const [isHovered, setIsHovered] = useState(false);
  const [enterTimer, setEnterTimer] = useState<NodeJS.Timeout | null>(null);
  const [leaveTimer, setLeaveTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (device !== 'desktop') return;
    if (leaveTimer) clearTimeout(leaveTimer);
    const timer = setTimeout(() => {
      setIsHovered(true);
    }, 100);
    setEnterTimer(timer);
  };

  const handleMouseLeave = () => {
    if (device !== 'desktop') return;
    if (enterTimer) clearTimeout(enterTimer);
    const timer = setTimeout(() => {
      setIsHovered(false);
    }, 250);
    setLeaveTimer(timer);
  };

  // Mobile drawer open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Expanded determination checks
  // Desktop -> Hover or Pin
  // Tablet -> Toggle/Pin button
  // Mobile -> Slide-out drawer
  const isExpanded = device === 'mobile' 
    ? isMobileOpen 
    : (device === 'tablet' ? isPinned : (isPinned || isHovered));

  // Clean-up hooks on unmount
  useEffect(() => {
    return () => {
      if (enterTimer) clearTimeout(enterTimer);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [enterTimer, leaveTimer]);

  // Sidebar parameters & controls
  const [activeViewTab, setActiveViewTab] = useState<'palette' | 'pipelines' | 'ai'>('palette');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [marketplaceScope, setMarketplaceScope] = useState<'all' | 'official' | 'community'>('all');
  const [installingNodeName, setInstallingNodeName] = useState<string | null>(null);

  const communityMarketplaceNodes = [
    {
      type: 'twil_agent',
      title: 'Twilio Broadcast SMS',
      description: 'Trigger enterprise SMS alerts, customer phone validation, and WhatsApp threads worldwide.',
      category: 'Automation',
      accentColor: 'rose',
      downloads: '18.4k',
      rating: '4.8',
      author: 'Twilio DevTeam',
    },
    {
      type: 'slack_advanced',
      title: 'Slack Assistant Pro',
      description: 'Dynamic team announcements, custom channel pollings, and multi-agent pipeline summaries.',
      category: 'Automation',
      accentColor: 'indigo',
      downloads: '42.9k',
      rating: '4.9',
      author: 'Slack Inc.',
    },
    {
      type: 'deepl_lang',
      title: 'DeepL Translate Lens',
      description: 'Accurate neural auto-translations and localized terminology bindings for pipeline data.',
      category: 'Utility',
      accentColor: 'cyan',
      downloads: '9.2k',
      rating: '4.7',
      author: 'DeepL Gmbh',
    },
    {
      type: 'postgresql_query',
      title: 'PostgreSQL Relational client',
      description: 'Direct SQL query executions, atomic transactions, and automated migration runner gates.',
      category: 'Database',
      accentColor: 'blue',
      downloads: '58.2k',
      rating: '4.9',
      author: 'Postgres SQL Inc',
    },
    {
      type: 'supabase_mesh',
      title: 'Supabase Realtime Webhook',
      description: 'Listen to immediate user database changes, auth events, and bucket file actions.',
      category: 'Database',
      accentColor: 'emerald',
      downloads: '31.5k',
      rating: '4.8',
      author: 'Supabase Inc',
    }
  ];

  const handleInstallCommunityNode = (nodeName: string, mockType: string) => {
    setInstallingNodeName(nodeName);
    setTimeout(() => {
      setInstallingNodeName(null);
      let mappedType = 'apiNode';
      if (mockType === 'postgresql_query' || mockType === 'supabase_mesh') {
        mappedType = 'databaseNode';
      } else if (mockType === 'deepl_lang') {
        mappedType = 'transformNode';
      } else if (mockType === 'slack_advanced' || mockType === 'twil_agent') {
        mappedType = 'apiNode';
      }
      handleAddNodeDirectly(mappedType);
    }, 950);
  };

  // Templates & previews
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<string>('All');
  
  // Save form elements
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDesc, setNewPipelineDesc] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [selectionIndex, setSelectionIndex] = useState(-1);

  // AI Copilot states
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [clearBeforeGen, setClearBeforeGen] = useState(true);

  // Cloud Workflows library sync
  const [dbPipelines, setDbPipelines] = useState<any[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  
  // Workspace references
  const { getNodeID, addNode, nodes, edges, setWorkspace, autoLayout, clearCanvas } = useWorkflowStore();
  const { user, signIn, signOut, authError, clearAuthError } = useFirebase();

  // Reset keyboard selected item
  useEffect(() => {
    setSelectionIndex(-1);
  }, [searchQuery, activeCategory]);

  // Graph topology stats Calculator
  const getGraphStats = () => {
    const numNodes = nodes.length;
    const numEdges = edges.length;
    
    let isDag = true;
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => { adj[n.id] = []; });
    edges.forEach(e => {
      if (adj[e.source]) adj[e.source].push(e.target);
    });
    
    const visitState: Record<string, number> = {}; 
    nodes.forEach(n => { visitState[n.id] = 0; });
    
    const hasCycle = (u: string): boolean => {
      visitState[u] = 1;
      for (const v of adj[u] || []) {
        if (visitState[v] === 1) return true;
        if (visitState[v] === 0 && hasCycle(v)) return true;
      }
      visitState[u] = 2;
      return false;
    };
    
    for (const n of nodes) {
      if (visitState[n.id] === 0) {
        if (hasCycle(n.id)) {
          isDag = false;
          break;
        }
      }
    }

    let connectedComponents = 0;
    const undirectedAdj: Record<string, string[]> = {};
    nodes.forEach(n => { undirectedAdj[n.id] = []; });
    edges.forEach(e => {
      if (undirectedAdj[e.source]) undirectedAdj[e.source].push(e.target);
      if (undirectedAdj[e.target]) undirectedAdj[e.target].push(e.source);
    });
    
    const visitedUndirected = new Set<string>();
    const exploreUndirected = (u: string) => {
      const q = [u];
      visitedUndirected.add(u);
      while (q.length > 0) {
        const curr = q.shift()!;
        for (const neighbor of undirectedAdj[curr] || []) {
          if (!visitedUndirected.has(neighbor)) {
            visitedUndirected.add(neighbor);
            q.push(neighbor);
          }
        }
      }
    };
    
    nodes.forEach(n => {
      if (!visitedUndirected.has(n.id)) {
        connectedComponents++;
        exploreUndirected(n.id);
      }
    });

    return {
      numNodes,
      numEdges,
      isDag,
      connectedComponents
    };
  };

  const stats = getGraphStats();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredNodes.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectionIndex((prev) => (prev + 1) % filteredNodes.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectionIndex((prev) => (prev - 1 + filteredNodes.length) % filteredNodes.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = selectionIndex >= 0 ? selectionIndex : 0;
      const [type] = filteredNodes[idx];
      handleAddNodeDirectly(type);
    }
  };

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return <span>{text}</span>;
    const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-amber-500/30 text-amber-200 rounded px-0.5 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Real-time Firestore sync
  useEffect(() => {
    if (!user) {
      setDbPipelines([]);
      return;
    }

    setLoadingPipelines(true);
    const collectionPath = `users/${user.uid}/pipelines`;
    
    const unsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'pipelines'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ docId: doc.id, ...doc.data() });
        });
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setDbPipelines(list);
        setLoadingPipelines(false);
      },
      (error) => {
        setLoadingPipelines(false);
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAddNodeDirectly = (nodeType: string) => {
    const nodeID = getNodeID(nodeType);
    const defaultData: Record<string, any> = { id: nodeID, nodeType };
    NODE_REGISTRY[nodeType]?.fields.forEach(f => {
      if (f.defaultValue !== undefined) {
        defaultData[f.name] = f.defaultValue;
      }
    });

    if (nodeType === 'text') {
      defaultData.parsedVariables = ['user_name', 'pipeline_step'];
    }

    const newNode: Node = {
      id: nodeID,
      type: nodeType,
      position: { x: 300 + Math.random() * 60, y: 150 + Math.random() * 60 },
      data: defaultData,
    };
    
    addNode(newNode);
  };

  const handleSavePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newPipelineName.trim()) return;

    setSaveStatus('saving');
    const pipelineId = `pipeline-${Date.now()}`;
    const targetPath = `users/${user.uid}/pipelines/${pipelineId}`;

    const pipelineData = {
      id: pipelineId,
      name: newPipelineName.trim(),
      description: newPipelineDesc.trim(),
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
        type: e.type || 'smoothstep',
        animated: !!e.animated,
        style: e.style || {}
      })),
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'pipelines', pipelineId), pipelineData);
      setSaveStatus('success');
      setNewPipelineName('');
      setNewPipelineDesc('');
      setTimeout(() => {
        setSaveStatus('idle');
        setShowSaveForm(false);
      }, 1800);
    } catch (err) {
      console.error('Error writing pipeline:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      handleFirestoreError(err, OperationType.WRITE, targetPath);
    }
  };

  const handleDeletePipeline = async (docId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) return;
    if (!window.confirm("Verify: Absolutely delete this saved workflow? This action is irreversible.")) return;

    const targetPath = `users/${user.uid}/pipelines/${docId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'pipelines', docId));
    } catch (err) {
      console.error('Delete pipeline failure:', err);
      handleFirestoreError(err, OperationType.DELETE, targetPath);
    }
  };

  const handleLoadPipeline = (pipeline: any) => {
    setWorkspace(pipeline.nodes || [], pipeline.edges || []);
  };

  const handleGenerateWorkflowWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setGenError('');
    try {
      const response = await fetch('/api/gemini/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate workflow.');
      }
      const data = await response.json();
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('Response is missing visual nodes structure.');
      }

      if (clearBeforeGen) {
        clearCanvas();
      }

      // Convert generated node definitions into clean workflow model nodes.
      const loadedNodes = data.nodes.map((node: any) => ({
        id: node.id,
        type: node.type || 'customInput',
        position: node.position || { x: 100, y: 100 },
        data: {
          ...node.data,
          nodeType: node.type || 'customInput',
          id: node.id
        }
      }));

      const loadedEdges = (data.edges || []).map((edge: any) => ({
        id: edge.id || `edge-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || 'response' || 'value',
        targetHandle: edge.targetHandle || 'prompt' || 'value'
      }));

      // Update workspace with the loaded nodes and edges
      setWorkspace(loadedNodes, loadedEdges);

      // Trigger automatic aesthetic spring layout!
      setTimeout(() => {
        autoLayout();
      }, 100);

      // Reset prompt and indicate success!
      setAiPrompt('');
    } catch (err: any) {
      console.error('AI Flow Synergize Error:', err);
      setGenError(err.message || 'Operation timed out. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getNodeCategory = (type: string, config: any): string => {
    if (type === 'customInput') return 'Input';
    if (type === 'customOutput') return 'Output';
    if (type === 'databaseNode') return 'Database';
    if (type === 'llm') return 'AI';
    if (type === 'apiNode' || type === 'emailNode') return 'Automation';
    if (type === 'text' || type === 'delayNode') return 'Utility';
    if (type === 'transformNode' || type === 'conditionNode') return 'Process';
    return config.category || 'Utility';
  };

  const categories = ['All', 'Input', 'Output', 'Process', 'Database', 'AI', 'Automation', 'Utility'];

  const getCategoryCount = (category: string): number => {
    if (category === 'All') return Object.keys(NODE_REGISTRY).length;
    return Object.entries(NODE_REGISTRY).filter(([type, config]) => getNodeCategory(type, config) === category).length;
  };

  const filteredNodes = Object.entries(NODE_REGISTRY).filter(([type, config]) => {
    const nodeCat = getNodeCategory(type, config);
    const matchesCategory = activeCategory === 'All' || nodeCat === activeCategory;
    const matchesSearch = config.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          config.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          nodeCat.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {device === 'mobile' && isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[45] animate-fade-in"
        />
      )}

      {/* Floating Hamburger Toggle Button for Mobile Screen */}
      {device === 'mobile' && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-[70px] left-4 z-50 p-2.5 rounded-xl border flex items-center justify-center cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95 bg-slate-900 border-slate-800 text-slate-150"
          title="Toggle Architecture Sidebar"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      )}

      {/* Primary Animated Sidebar Container */}
      <motion.div
        id="workflow-designer-sidebar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={{ 
          width: device === 'mobile' ? (isMobileOpen ? 320 : 0) : isExpanded ? 320 : 72,
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 26,
        }}
        className={`h-full flex flex-col select-none relative z-40 transition-colors duration-200 ${
          device === 'mobile' 
            ? 'fixed inset-y-0 left-0 shadow-2xl z-50 border-r border-slate-850' 
            : 'border-r bg-slate-950/80 backdrop-blur-md'
        } ${
          resolvedMode === 'light' 
            ? 'bg-white border-slate-200 text-slate-900' 
            : 'bg-[#080c15]/95 border-slate-805 text-slate-100 shadow-[0_0_15px_rgba(0,0,0,0.55)]'
        } ${device === 'mobile' && !isMobileOpen ? 'pointer-events-none' : 'pointer-events-auto'}`}
      >
        {/* SIDEBAR HEADER BLOCK */}
        <div className={`p-4 border-b flex items-center shrink-0 justify-between gap-1 transition-colors duration-200 ${
          resolvedMode === 'light' ? 'border-slate-100' : 'border-slate-800/60'
        } ${!isExpanded ? 'flex-col items-center py-5' : ''}`}>
          {isExpanded ? (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="flex items-center gap-2 min-w-0"
            >
              <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                <svg id="sidebar-logo-grad-icon" width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 3L35 11.5V28.5L20 37L5 28.5V11.5L20 3z" stroke="url(#logo-grad-side)" strokeWidth="3" fill="rgba(11, 16, 32, 0.4)"/>
                  <circle cx="20" cy="11" r="3.5" fill="#8B5CF6" />
                  <circle cx="12" cy="25" r="3.5" fill="#6366F1" />
                  <circle cx="28" cy="25" r="3.5" fill="#10B981" />
                  <defs>
                    <linearGradient id="logo-grad-side" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366F1" stopOpacity="0.8"/>
                      <stop offset="0.5" stopColor="#8B5CF6" />
                      <stop offset="1" stopColor="#10B981" stopOpacity="0.8"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-[11px] tracking-widest uppercase font-sans truncate text-white">ORCHEVRA</h3>
                <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider block leading-none mt-0.5">AI WORKFLOW STUDIO</span>
              </div>
            </motion.div>
          ) : (
            <div 
              className="relative w-8 h-8 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all"
              onClick={() => {
                if (device === 'tablet') {
                  togglePin();
                } else {
                  setSidebarCollapsed(false);
                }
              }}
              title="Expand workspace controls"
            >
              <svg id="sidebar-logo-grad-icon-collapsed" width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 3L35 11.5V28.5L20 37L5 28.5V11.5L20 3z" stroke="url(#logo-grad-side-coll)" strokeWidth="3" fill="rgba(11, 16, 32, 0.4)"/>
                <circle cx="20" cy="11" r="3.5" fill="#8B5CF6" />
                <circle cx="12" cy="25" r="3.5" fill="#6366F1" />
                <circle cx="28" cy="25" r="3.5" fill="#10B981" />
                <defs>
                  <linearGradient id="logo-grad-side-coll" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="0.5" stopColor="#8B5CF6" />
                    <stop offset="1" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}

          {/* Action buttons inside expanded header */}
          {isExpanded && (
            <div className="flex items-center gap-1 shrink-0">
              {/* Tablet Toggle Collapse */}
              {device === 'tablet' && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    resolvedMode === 'light' 
                      ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                      : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                  title="Collapse Details Pane"
                  aria-label="Collapse Details"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Desktop pin toggle */}
              {device === 'desktop' && (
                <button
                  onClick={togglePin}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    isPinned 
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-400 font-bold' 
                      : resolvedMode === 'light'
                        ? 'border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                        : 'border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-white'
                  }`}
                  title={isPinned ? "Unpin Sidebar" : "Pin Sidebar (Keep open)"}
                  aria-label={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
                >
                  {isPinned ? <Pin className="w-3.5 h-3.5 fill-indigo-400/20" /> : <PinOff className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Mobile Drawer closing trigger */}
              {device === 'mobile' && (
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* VIEW TYPE TAB SELECTORS */}
        <div className={`flex border-b shrink-0 transition-colors duration-200 ${
          resolvedMode === 'light' ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-900/20 border-slate-800/60'
        } ${!isExpanded ? 'flex-col items-center py-4 gap-3 border-b-0' : 'h-[44px]'}`}>
          {isExpanded ? (
            <>
              <button
                onClick={() => setActiveViewTab('palette')}
                className={`flex-1 flex items-center justify-center gap-1 text-[9.5px] font-bold uppercase tracking-wider transition-all border-b-2 focus:outline-none focus:bg-slate-900/5 ${
                  activeViewTab === 'palette'
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Marketplace
              </button>
              <button
                onClick={() => setActiveViewTab('pipelines')}
                className={`flex-1 flex items-center justify-center gap-1 text-[9.5px] font-bold uppercase tracking-wider transition-all border-b-2 relative focus:outline-none focus:bg-slate-900/5 ${
                  activeViewTab === 'pipelines'
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderHeart className="w-3.5 h-3.5" />
                Workflows
                {user && dbPipelines.length > 0 && (
                  <span className="absolute right-1 top-3.5 w-3 h-3 rounded-full bg-indigo-600 text-[7px] font-extrabold text-white flex items-center justify-center">
                    {dbPipelines.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveViewTab('ai')}
                className={`flex-1 flex items-center justify-center gap-1 text-[9.5px] font-bold uppercase tracking-wider transition-all border-b-2 focus:outline-none focus:bg-slate-900/5 ${
                  activeViewTab === 'ai'
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/10'
                    : 'border-transparent text-slate-400 hover:text-slate-250 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                AI Copilot
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 shrink-0 w-full items-center">
              <button
                onClick={() => setActiveViewTab('palette')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group/tab focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  activeViewTab === 'palette'
                    ? 'bg-indigo-600 border border-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/10 border-transparent'
                }`}
                aria-label="Switch to Palette tab"
              >
                <Layers className="w-5 h-5" />
                <div className="absolute left-[54px] top-1/2 -translate-y-1/2 invisible opacity-0 group-hover/tab:visible group-hover/tab:opacity-100 transition-all duration-150 z-[9999] pointer-events-none px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10.5px] font-bold text-white whitespace-nowrap shadow-xl">
                  Palette Catalogue
                </div>
              </button>
              <button
                onClick={() => setActiveViewTab('pipelines')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group/tab focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  activeViewTab === 'pipelines'
                    ? 'bg-indigo-600 border border-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/10 border-transparent'
                }`}
                aria-label="Switch to Workflows tab"
              >
                <FolderHeart className="w-5 h-5" />
                <div className="absolute left-[54px] top-1/2 -translate-y-1/2 invisible opacity-0 group-hover/tab:visible group-hover/tab:opacity-100 transition-all duration-150 z-[9999] pointer-events-none px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10.5px] font-bold text-white whitespace-nowrap shadow-xl">
                  Saved Workflows
                </div>
              </button>
              <button
                onClick={() => setActiveViewTab('ai')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group/tab focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  activeViewTab === 'ai'
                    ? 'bg-indigo-600 border border-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/10 border-transparent'
                }`}
                aria-label="Switch to AI Copilot tab"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div className="absolute left-[54px] top-1/2 -translate-y-1/2 invisible opacity-0 group-hover/tab:visible group-hover/tab:opacity-100 transition-all duration-150 z-[9999] pointer-events-none px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10.5px] font-bold text-white whitespace-nowrap shadow-xl">
                  AI Workflow Copilot
                </div>
              </button>
            </div>
          )}
        </div>

        {/* VIEWPORT PANEL CONTENT AREA */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none flex flex-col">
          {isExpanded ? (
            <motion.div
              key="expanded-viewport"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              {activeViewTab === 'palette' ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  
                  {/* Pipeline Diagnostics Stats Box */}
                  <div className={`border-b shrink-0 transition-colors duration-200 ${
                    resolvedMode === 'light' ? 'border-slate-100 bg-slate-50/20' : 'border-slate-900/50 bg-slate-900/10'
                  }`}>
                    <button 
                      onClick={() => setShowStats(!showStats)}
                      className="w-full px-4 py-2 flex items-center justify-between text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider font-mono bg-slate-950/30"
                    >
                      <span className="flex items-center gap-1.5 font-mono">
                        <Workflow className="w-3.5 h-3.5 text-indigo-400" />
                        Pipeline Diagnostics
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono capitalize">
                        {showStats ? 'Hide' : 'Show'}
                      </span>
                    </button>
                    
                    {showStats && (
                      <div className="px-4 pb-3 pt-1 grid grid-cols-2 gap-1.5 text-slate-400 bg-slate-950/25">
                        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-lg">
                          <div className="text-[8.5px] font-mono text-slate-500 uppercase tracking-tight">Blocks</div>
                          <div className="text-xs font-semibold text-white font-mono mt-0.5">{stats.numNodes}</div>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-lg">
                          <div className="text-[8.5px] font-mono text-slate-500 uppercase tracking-tight">Pipelines</div>
                          <div className="text-xs font-semibold text-white font-mono mt-0.5">{stats.numEdges}</div>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-lg">
                          <div className="text-[8.5px] font-mono text-slate-500 uppercase tracking-tight">Islands</div>
                          <div className="text-xs font-semibold text-white font-mono mt-0.5">{stats.connectedComponents}</div>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-850 p-2 rounded-lg flex flex-col justify-between">
                          <div className="text-[8.5px] font-mono text-slate-500 uppercase tracking-tight">Condition</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${stats.isDag ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            <span className={`text-[9.5px] font-bold ${stats.isDag ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {stats.isDag ? 'Strict DAG' : 'Cyclic (Err)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search filter input */}
                  <div className="px-4 py-3 border-b border-slate-800/40 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Core & SaaS Marketplace..."
                        className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg focus:outline-none transition-all font-sans border focus:ring-1 focus:ring-indigo-500/20 ${
                          resolvedMode === 'light' 
                            ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' 
                            : 'bg-[#121724] border-slate-800 text-slate-100 focus:bg-[#0f1420]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Marketplace segmented scope controls */}
                  <div className="px-4 py-1.5 flex border-b border-slate-800/20 text-[9.5px] font-bold text-slate-400 bg-slate-950/20">
                    <button
                      onClick={() => setMarketplaceScope('all')}
                      className={`flex-1 py-1 text-center transition-all border-b-2 text-[8px] tracking-wide uppercase ${
                        marketplaceScope === 'all' 
                          ? 'border-indigo-500 text-indigo-400 font-extrabold' 
                          : 'border-transparent hover:text-slate-200'
                      }`}
                    >
                      All ({filteredNodes.length + communityMarketplaceNodes.length})
                    </button>
                    <button
                      onClick={() => setMarketplaceScope('official')}
                      className={`flex-1 py-1 text-center transition-all border-b-2 text-[8px] tracking-wide uppercase ${
                        marketplaceScope === 'official' 
                          ? 'border-indigo-500 text-indigo-400 font-black' 
                          : 'border-transparent hover:text-slate-200'
                      }`}
                    >
                      Core ({filteredNodes.length})
                    </button>
                    <button
                      onClick={() => setMarketplaceScope('community')}
                      className={`flex-1 py-1 text-center transition-all border-b-2 text-[8px] tracking-wide uppercase ${
                        marketplaceScope === 'community' 
                          ? 'border-emerald-500 text-emerald-400 font-black' 
                          : 'border-transparent hover:text-slate-200'
                      }`}
                    >
                      Marketplace ({communityMarketplaceNodes.length})
                    </button>
                  </div>

                  {/* Category selector Horizontal list */}
                  <div className="px-4 pt-2.5 pb-3 border-b border-slate-800/20 shrink-0 overflow-x-auto flex gap-1 scrollbar-none-x">
                    {categories.map((cat) => {
                      const count = getCategoryCount(cat);
                      const isActive = activeCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-2 py-0.5 rounded px-2 py-1 text-[10px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 border ${
                            isActive
                              ? resolvedMode === 'light'
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                : 'bg-indigo-600/20 border-indigo-505/30 text-indigo-400 font-black'
                              : 'text-slate-500 hover:text-slate-350 bg-slate-900/5 hover:bg-slate-900/15 border-transparent'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[8.5px] px-1 rounded-sm font-mono ${
                            isActive ? 'bg-indigo-500/25 text-indigo-300' : 'bg-slate-900 text-slate-500'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Nodes blocks catalog scroll box */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 scrollbar-thin">
                    
                    {/* 1. OFFICIAL/CORE REGISTRY NODES */}
                    {(marketplaceScope === 'all' || marketplaceScope === 'official') && (
                      <div className="flex flex-col gap-2">
                        {filteredNodes.length > 0 && marketplaceScope === 'all' && (
                          <span className="text-[8px] uppercase tracking-widest font-bold text-indigo-400 font-mono mb-1">
                            Installed Core Blocks
                          </span>
                        )}
                        
                        {filteredNodes.map(([type, config], idx) => {
                          const Icon = typeof config.icon === 'string' ? HelpCircle : config.icon;
                          
                          const tagColors: Record<string, string> = {
                            emerald: 'text-emerald-400 border-emerald-500/15 bg-emerald-500/5',
                            rose: 'text-rose-400 border-rose-500/15 bg-rose-500/5',
                            purple: 'text-purple-400 border-purple-500/15 bg-purple-500/5',
                            blue: 'text-blue-400 border-blue-500/15 bg-blue-500/5',
                            indigo: 'text-indigo-400 border-indigo-500/15 bg-indigo-500/5',
                            amber: 'text-amber-400 border-amber-500/15 bg-amber-500/5',
                            cyan: 'text-cyan-400 border-cyan-500/15 bg-cyan-500/5',
                            violet: 'text-violet-400 border-violet-500/15 bg-violet-500/5',
                            pink: 'text-pink-400 border-pink-500/15 bg-pink-500/5',
                          };
                          
                          const colorClass = tagColors[config.accentColor] || tagColors.blue;
                          const isSelected = idx === selectionIndex;

                          return (
                            <div
                              key={type}
                              className={`group relative cursor-grab rounded-xl border p-2.5 select-none transition-all duration-200 ${
                                isSelected 
                                  ? 'border-indigo-500 bg-slate-900/50 ring-1 ring-indigo-500/20 scale-[1.01]' 
                                  : resolvedMode === 'light'
                                    ? 'border-slate-200/80 bg-slate-50/20 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                                    : 'border-slate-850 bg-slate-900/20 hover:border-slate-750 hover:bg-slate-900/40 text-slate-200'
                              } active:cursor-grabbing hover:shadow-lg`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, type)}
                              onClick={() => handleAddNodeDirectly(type)}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`p-2 rounded-lg border ${colorClass} shrink-0`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <h4 className="text-xs font-bold truncate group-hover:text-indigo-300 transition-colors">
                                      {highlightText(config.title, searchQuery)}
                                    </h4>
                                    <span className="text-[8px] font-mono px-1 rounded-full text-indigo-400 bg-indigo-500/5 border border-indigo-400/20 font-bold">
                                      Official
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                                    {highlightText(config.description, searchQuery)}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5 text-[8.5px] font-mono text-slate-500">
                                    <span>by Orchevra</span>
                                    <span>•</span>
                                    <span className="text-emerald-500">★ 5.0 Core</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. THIRD-PARTY MARKETPLACE COMMUNITY EXTENSIONS */}
                    {(marketplaceScope === 'all' || marketplaceScope === 'community') && (
                      <div className="flex flex-col gap-2 mt-2">
                        {marketplaceScope === 'all' && (
                          <span className="text-[8px] uppercase tracking-widest font-bold text-emerald-400 font-mono mb-1 border-t border-slate-850/80 pt-3">
                            Cloud Extension Marketplace
                          </span>
                        )}

                        {communityMarketplaceNodes
                          .filter(node => {
                            const catMatches = activeCategory === 'All' || node.category === activeCategory;
                            const searchMatches = node.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                  node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                  node.category.toLowerCase().includes(searchQuery.toLowerCase());
                            return catMatches && searchMatches;
                          })
                          .map((node) => {
                            const isInstalling = installingNodeName === node.title;
                            return (
                              <div
                                key={node.title}
                                className="group relative rounded-xl border border-slate-850 bg-slate-900/10 hover:border-slate-800 p-2.5 select-none transition-all duration-200 hover:shadow-lg text-slate-200 cursor-pointer"
                                onClick={() => handleInstallCommunityNode(node.title, node.type)}
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className={`p-2 rounded-lg border border-slate-800 bg-slate-950/60 shrink-0 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all`}>
                                    <Plus className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <h4 className="text-xs font-bold truncate text-slate-300 group-hover:text-emerald-400 transition-colors">
                                        {node.title}
                                      </h4>
                                      <span className="text-[8px] font-mono px-1 rounded-full text-emerald-400 bg-emerald-500/5 border border-emerald-400/20 font-bold shrink-0">
                                        Enterprise
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                                      {node.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-950/40 text-[8.5px] font-mono text-slate-500">
                                      <div className="flex items-center gap-1.5">
                                        <span>{node.author}</span>
                                        <span>•</span>
                                        <span>★ {node.rating} ({node.downloads})</span>
                                      </div>
                                      <span className="text-[8.5px] font-bold text-emerald-400">
                                        {isInstalling ? 'Installing...' : 'Install Block'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {filteredNodes.length === 0 && (marketplaceScope === 'official' || (marketplaceScope === 'all' && communityMarketplaceNodes.length === 0)) && (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-600">
                        <Info className="w-8 h-8 mb-2 stroke-1" />
                        <p className="text-xs">No active node block matches your filters.</p>
                      </div>
                    )}
                  </div>
                </div>

              ) : activeViewTab === 'pipelines' ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 gap-4 scrollbar-thin">
                  {/* USER PORTAL REACTION CARD */}
                  {!user ? (
                    <div className="p-3.5 rounded-xl border border-dashed border-indigo-500/25 bg-indigo-500/5 flex flex-col gap-3">
                      <div className="flex items-start gap-2">
                        <LogIn className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Firebase Cloud Storage</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                            Authenticate to save your custom canvases, organize layouts and load pipelines instantly across devices.
                          </p>
                        </div>
                      </div>
                      {authError && (
                        <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-[9.5px] text-rose-300 animate-in fade-in slide-in-from-top-1">
                          <span className="flex-1 leading-normal">{authError}</span>
                          <button 
                            type="button"
                            onClick={clearAuthError}
                            className="hover:text-white font-bold leading-none"
                            title="Dismiss"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <button
                        onClick={signIn}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-50 text-white hover:text-indigo-600 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        Sign In with Google
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/80 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 font-bold text-indigo-400 flex items-center justify-center text-[10px] shrink-0 font-mono">
                            {user.displayName?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-200 truncate leading-none">
                              {user.displayName || 'Developer'}
                            </h4>
                            <span className="text-[9px] text-slate-500 truncate block mt-0.5">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={signOut}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-505/5 transition-all"
                          title="Sign Out"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {!showSaveForm ? (
                        <button
                          onClick={() => setShowSaveForm(true)}
                          disabled={nodes.length === 0}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:pointer-events-none text-slate-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Save Canvas Run
                        </button>
                      ) : (
                        <form onSubmit={handleSavePipeline} className="p-3 rounded-lg bg-slate-950 border border-slate-850 flex flex-col gap-2 animate-in slide-in-from-top-1">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            New Blueprint Details
                          </div>
                          <div>
                            <input
                              type="text"
                              required
                              value={newPipelineName}
                              onChange={(e) => setNewPipelineName(e.target.value)}
                              placeholder="Pipeline Name"
                              className="w-full px-2 py-1.5 text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <textarea
                              value={newPipelineDesc}
                              onChange={(e) => setNewPipelineDesc(e.target.value)}
                              placeholder="Description..."
                              rows={2}
                              className="w-full px-2 py-1.5 text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded focus:outline-none focus:border-indigo-500 resize-none"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowSaveForm(false)}
                              className="flex-1 py-1.5 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 text-xs transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={saveStatus === 'saving'}
                              className="flex-1 py-1.5 rounded bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold flex items-center justify-center gap-1"
                            >
                              {saveStatus === 'saving' ? (
                                <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                              ) : saveStatus === 'success' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                              ) : saveStatus === 'error' ? (
                                <AlertCircle className="w-3 h-3 text-rose-300" />
                              ) : (
                                <UploadCloud className="w-3 h-3" />
                              )}
                              <span>Save</span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Firestore saved layouts listing */}
                  {user && (
                    <div className="flex flex-col gap-2">
                      <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest pl-1 leading-none mt-1">
                        Cloud Pipelines ({dbPipelines.length})
                      </div>

                      {loadingPipelines ? (
                        <div className="flex flex-col items-center py-4">
                          <div className="w-4 h-4 rounded-full border border-indigo-500/30 border-t-indigo-500 animate-spin" />
                        </div>
                      ) : dbPipelines.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {dbPipelines.map((pipeline) => (
                            <div
                              key={pipeline.docId}
                              onClick={() => handleLoadPipeline(pipeline)}
                              className="group cursor-pointer p-3 bg-slate-900/30 border border-slate-800/80 rounded-xl hover:border-slate-600 hover:bg-slate-900/60 transition-all flex flex-col gap-1.5"
                              title="Load pipeline"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">
                                  {pipeline.name}
                                </h4>
                                <button
                                  onClick={(e) => handleDeletePipeline(pipeline.docId, e)}
                                  className="p-1 rounded text-slate-500 hover:text-rose-450 hover:bg-rose-500/10 transition-colors shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              {pipeline.description && (
                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug">
                                  {pipeline.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono border-t border-slate-900/60 pt-1.5">
                                <span>Nodes: {pipeline.nodes?.length || 0}</span>
                                <span>{new Date(pipeline.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-5 px-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-600 flex flex-col items-center">
                          <UploadCloud className="w-5 h-5 mb-1.5 text-slate-600 stroke-1" />
                          <p className="text-[10px] leading-normal">Your cloud storage library is empty.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SaaS workflow Blueprints */}
                  <div className="flex flex-col gap-3 mt-3 border-t border-slate-800/60 pt-3">
                    <div className="flex items-center justify-between pl-1">
                      <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
                        SaaS Blueprints
                      </div>
                      <span className="text-[8.5px] bg-slate-900 border border-slate-800 text-slate-500 font-mono px-1.5 py-0.5 rounded-md">
                        {Object.keys(workflowTemplates).length} Blueprint
                      </span>
                    </div>

                    {/* Template Categories Tabs */}
                    <div className="px-1 py-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 w-full">
                      {['All', 'AI', 'Automation', 'Database', 'Marketing', 'Support'].map((cat) => {
                        const targetFilterCat = cat === 'Support' ? 'Customer Support' : cat;
                        const isActive = templateCategory === targetFilterCat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setTemplateCategory(targetFilterCat)}
                            className={`px-2 py-0.5.5 rounded px-2 py-0.5 rounded-md whitespace-nowrap text-[8.5px] font-extrabold tracking-wider uppercase transition-colors border ${
                              isActive 
                                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' 
                                : 'text-slate-500 bg-transparent border-transparent hover:text-slate-350 hover:bg-slate-900/10'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Blueprint lists */}
                    <div className="flex flex-col gap-2.5">
                      {Object.entries(workflowTemplates)
                        .filter(([_, tpl]) => templateCategory === 'All' || tpl.category === templateCategory)
                        .map(([id, tpl]) => {
                          const complexityColors = {
                            Easy: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5",
                            Medium: "text-amber-400 border-amber-500/10 bg-amber-500/5",
                            Advanced: "text-purple-400 border-purple-500/10 bg-purple-500/5"
                          };
                          
                          return (
                            <div
                              key={id}
                              onClick={() => {
                                setSelectedTemplateId(id);
                                setShowTemplatePreview(true);
                              }}
                              className="group cursor-pointer p-3 rounded-xl border bg-slate-950/30 border-slate-900 hover:border-slate-800 hover:bg-slate-900/30 transition-all duration-200 flex flex-col gap-1.5 relative overflow-hidden select-none"
                              title="View template details"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-[8.5px] font-black tracking-widest text-[#94a3b8]/75 uppercase">
                                  {tpl.category}
                                </span>
                                <span className={`text-[8px] px-1 py-0.2.5 rounded border font-bold font-mono ${complexityColors[tpl.complexity]}`}>
                                  {tpl.complexity}
                                </span>
                              </div>

                              <h4 className="text-[11.5px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                                {tpl.title}
                              </h4>
                              
                              <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                                {tpl.description}
                              </p>

                              <div className="flex items-center justify-between text-[8px] text-slate-500 font-bold tracking-wider pt-2 border-t border-slate-900/60 font-mono mt-1">
                                <span>Imported {tpl.timesUsed}x</span>
                                <span className="text-slate-400/60 uppercase">{tpl.lastUsed}</span>
                              </div>

                              <div className="flex items-center justify-end text-[8.5px] text-indigo-400 group-hover:text-amber-400 font-extrabold tracking-wider transition-colors pt-1 gap-1 uppercase">
                                <span>Browse blueprint</span>
                                <span className="font-mono text-[9px] group-hover:translate-x-0.5 transition-transform">→</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 gap-4 scrollbar-thin">
                  {/* AI Copilot Rich Header */}
                  <div className="p-4 rounded-xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-900/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">AI Workflow Copilot</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      Describe your direct integration and processing vision. Gemini AI will automatically instantiate, wire, and auto-layout the optimal system blocks.
                    </p>
                  </div>

                  {/* Prompt Textarea */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Describe automation flow</label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., Build a workflow that parses a lead CSV, writes a custom greeting email using an LLM, sends the email, and logs a slack notification."
                      disabled={generating}
                      className="w-full h-28 p-3 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col gap-3">
                    {/* Clear canvas check */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={clearBeforeGen}
                        onChange={(e) => setClearBeforeGen(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Clear workspace before building</span>
                    </label>

                    {/* Submit / Generate button */}
                    <button
                      onClick={handleGenerateWorkflowWithAI}
                      disabled={generating || !aiPrompt.trim()}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        generating || !aiPrompt.trim()
                          ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600 border border-indigo-400 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:scale-[0.99] active:scale-95'
                      }`}
                    >
                      {generating ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Architecting flow...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Generate & Auto-wire</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Loading status steps details */}
                  {generating && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-slate-950/40 border border-slate-900 rounded-lg flex flex-col gap-2 font-mono text-[9px]"
                    >
                      <div className="flex items-center gap-2 text-indigo-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                        <span>Evaluating network DAG components...</span>
                      </div>
                      <div className="text-slate-500 leading-normal">
                        Gemini is planning the nodes sequence, generating code transformers, positioning anchors, and connecting input-output handles.
                      </div>
                    </motion.div>
                  )}

                  {/* Error Notification */}
                  {genError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] rounded-lg leading-normal flex flex-col gap-1"
                    >
                      <span className="font-bold">Generation Error:</span>
                      <span>{genError}</span>
                    </motion.div>
                  )}

                  {/* Prompt Library Presets */}
                  <div className="flex flex-col gap-2.5 mt-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                      <FolderHeart className="w-3.5 h-3.5" />
                      Sample prompt blueprints
                    </label>
                    <div className="flex flex-col gap-2">
                      {[
                        {
                          title: "CSV Smart Classifier & Alerts",
                          prompt: "Create a flow that uploads a CSV, parses it, passes records through an LLM to categorize customer sentiment into Positive/Negative, and sends a Slack alert if sentiment is Negative."
                        },
                        {
                          title: "Database Synchronizer & Email",
                          prompt: "Implement a flow that runs a Postgres SQL query to select recently registered users, converts them to text sheets, calls an external webhook API to register them on Salesforce, and triggers an email notification."
                        },
                        {
                          title: "OpenAI-Gemini Loop with Delay",
                          prompt: "Design a workflow starting with user inputs, feeding into an AI Agent node with web search tools, adding a 10 second delay, and writing the final answer to an JSON endpoint webhook."
                        }
                      ].map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => setAiPrompt(preset.prompt)}
                          className="w-full text-left p-2.5 rounded-lg border border-slate-900 bg-slate-950/20 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group focus:outline-none"
                        >
                          <div className="text-[10px] font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">
                            {preset.title}
                          </div>
                          <p className="text-[9px] text-slate-500 mt-1 line-clamp-2 truncate leading-normal">
                            {preset.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* COLLAPSED VIEWS VERTICAL LIST OF ICONS WITH TOOLTIPS */
            <div className="flex-1 flex flex-col items-center gap-3 px-1.5 py-4 scrollbar-none">
              {activeViewTab === 'palette' ? (
                <div className="flex flex-col items-center gap-3.5 w-full">
                  {Object.entries(NODE_REGISTRY).map(([type, config]) => {
                    const Icon = typeof config.icon === 'string' ? HelpCircle : config.icon;
                    
                    const tagColors: Record<string, string> = {
                      emerald: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-400',
                      rose: 'text-rose-400 border-rose-500/25 bg-rose-500/5 hover:border-rose-400',
                      purple: 'text-purple-400 border-purple-500/25 bg-purple-500/5 hover:border-purple-400',
                      blue: 'text-blue-400 border-blue-500/25 bg-blue-500/5 hover:border-blue-400',
                      indigo: 'text-indigo-400 border-indigo-500/25 bg-indigo-500/5 hover:border-indigo-400',
                      amber: 'text-amber-400 border-amber-500/25 bg-amber-500/5 hover:border-amber-400',
                      cyan: 'text-cyan-400 border-cyan-500/25 bg-cyan-500/5 hover:border-cyan-400',
                      violet: 'text-violet-400 border-violet-500/25 bg-violet-500/5 hover:border-violet-400',
                      pink: 'text-pink-400 border-pink-500/25 bg-pink-500/5 hover:border-pink-400',
                    };
                    const colorClass = tagColors[config.accentColor] || tagColors.blue;

                    return (
                      <div
                        key={type}
                        className={`group/node relative cursor-grab w-10 h-10 rounded-xl border flex items-center justify-center p-1 border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 active:cursor-grabbing transition-all shrink-0 ${colorClass}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, type)}
                        onClick={() => handleAddNodeDirectly(type)}
                      >
                        <Icon className="w-5 h-5 pointer-events-none" />
                        
                        {/* Custom Tooltip */}
                        <div className={`absolute left-[54px] top-1/2 -translate-y-1/2 invisible opacity-0 group-hover/node:visible group-hover/node:opacity-100 transition-all duration-200 z-[99999] pointer-events-none w-56 p-3 rounded-2xl shadow-2xl backdrop-blur-md border ${
                          resolvedMode === 'light' 
                            ? 'bg-white border-slate-200 text-slate-800' 
                            : 'bg-slate-950 border-slate-850 text-slate-200'
                        }`}>
                          <div className="font-bold text-xs pb-1 border-b mb-1 flex items-center justify-between border-slate-800">
                            <span>{config.title}</span>
                            <span className="text-[7px] px-1 py-0.5 bg-slate-900 text-slate-400 border border-slate-805 rounded">Add</span>
                          </div>
                          <div className="text-[8.5px] font-mono text-indigo-400 uppercase font-extrabold">{config.category}</div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-snug font-medium">{config.description}</p>
                          <div className="text-[8px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-900">Click to append • Drag to place</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3.5 w-full">
                  {Object.entries(workflowTemplates).map(([id, tpl]) => (
                    <div
                      key={id}
                      onClick={() => {
                        setSelectedTemplateId(id);
                        setShowTemplatePreview(true);
                      }}
                      className="group/node relative w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 flex items-center justify-center text-amber-400 cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                      
                      {/* Tooltip */}
                      <div className={`absolute left-[54px] top-1/2 -translate-y-1/2 invisible opacity-0 group-hover/node:visible group-hover/node:opacity-100 transition-all duration-200 z-[99999] pointer-events-none w-56 p-3 rounded-2xl shadow-2xl backdrop-blur-md border ${
                        resolvedMode === 'light' 
                          ? 'bg-white border-slate-200 text-slate-800' 
                          : 'bg-slate-950 border-slate-850 text-slate-200'
                      }`}>
                        <span className="text-[8.5px] font-black tracking-widest text-slate-500 uppercase">{tpl.category}</span>
                        <div className="font-bold text-xs text-amber-300 mt-0.5 leading-snug">{tpl.title}</div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-3">{tpl.description}</p>
                        <div className="text-[8px] text-slate-500 font-mono mt-2 pt-1.5 border-t border-slate-900">Click to preview blueprint</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR FOOTER BLOCK */}
        <div className={`p-4 border-t text-[10px] text-slate-600 flex items-center shrink-0 justify-between gap-1 transition-colors duration-200 ${
          resolvedMode === 'light' ? 'border-slate-100 bg-slate-50/20' : 'border-slate-800/80 bg-slate-950/45'
        } ${!isExpanded ? 'flex-col py-5' : ''}`}>
          {isExpanded ? (
            <>
              <span>Orchestrator IDE</span>
              <span className="font-mono text-indigo-500/70">v1.2.5</span>
            </>
          ) : (
            <span className="font-mono font-bold tracking-wider text-[8px] text-indigo-500/50">IDE</span>
          )}
        </div>
      </motion.div>

      {/* Template Preview Portal Modal */}
      <TemplatePreviewModal 
        isOpen={showTemplatePreview}
        onClose={() => {
          setShowTemplatePreview(false);
          setSelectedTemplateId(null);
        }}
        templateId={selectedTemplateId || ''}
        template={selectedTemplateId ? workflowTemplates[selectedTemplateId] : null}
        onConfirm={() => {
          if (selectedTemplateId) {
            const targetTpl = workflowTemplates[selectedTemplateId];
            setWorkspace(targetTpl.nodes as Node[], targetTpl.edges as Edge[]);
          }
        }}
      />
    </>
  );
};

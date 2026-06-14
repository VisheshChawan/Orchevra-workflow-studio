import { create } from 'zustand';
import dagre from 'dagre';
import { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges, 
  MarkerType, 
  Connection, 
  Edge, 
  Node,
  NodeChange,
  EdgeChange
} from '@xyflow/react';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  nodeIDs: Record<string, number>;
  past: Array<{ nodes: Node[]; edges: Edge[] }>;
  future: Array<{ nodes: Node[]; edges: Edge[] }>;
  selectedEdgeId: string | null;
  getNodeID: (type: string) => string;
  addNode: (node: Node) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  updateNodeField: (nodeId: string, fieldName: string, fieldValue: any) => void;
  deleteNode: (nodeId: string) => void;
  clearCanvas: () => void;
  autoLayout: (direction?: 'TB' | 'LR') => void;
  duplicateNode: (nodeId: string) => void;
  setWorkspace: (nodes: Node[], edges: Edge[]) => void;
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  selectEdge: (edgeId: string | null) => void;
  updateEdgeProperties: (edgeId: string, properties: Partial<Edge>) => void;
  deleteEdge: (edgeId: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  nodeIDs: {},
  past: [],
  future: [],
  selectedEdgeId: null,
  
  takeSnapshot: () => {
    const { nodes, edges, past } = get();
    // Safety depth limit of 30 snapshots to keep visual builder high-performance
    const snapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    set({
      past: [...past, snapshot].slice(-30),
      future: [],
    });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    const currentSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    const newFuture = [currentSnapshot, ...future].slice(0, 30);

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: newFuture,
      selectedEdgeId: null, // Clear active selection panel during state jumps
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    const currentSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    const newPast = [...past, currentSnapshot].slice(-30);

    set({
      nodes: next.nodes,
      edges: next.edges,
      past: newPast,
      future: newFuture,
      selectedEdgeId: null, // Clear active selection panel during state jumps
    });
  },

  selectEdge: (edgeId) => {
    set({ selectedEdgeId: edgeId });
  },

  updateEdgeProperties: (edgeId, properties) => {
    // Commit old state to past stack before modifying properties
    get().takeSnapshot();
    const { edges } = get();
    
    set({
      edges: edges.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            ...properties,
          };
        }
        return edge;
      }),
    });
  },

  deleteEdge: (edgeId) => {
    get().takeSnapshot();
    const { edges, selectedEdgeId } = get();
    set({
      edges: edges.filter((edge) => edge.id !== edgeId),
      selectedEdgeId: selectedEdgeId === edgeId ? null : selectedEdgeId,
    });
  },
  
  setWorkspace: (nodes, edges) => {
    get().takeSnapshot();
    // Recalculate max IDs for each node type to avoid conflicts when appending new nodes
    const nextIDs: Record<string, number> = {};
    nodes.forEach(node => {
      const parts = node.id.split('-');
      if (parts.length >= 2) {
        const type = parts.slice(0, -1).join('-');
        const idVal = parseInt(parts[parts.length - 1], 10) || 0;
        nextIDs[type] = Math.max(nextIDs[type] || 0, idVal);
      }
    });

    set({ nodes, edges, nodeIDs: nextIDs });
  },
  
  getNodeID: (type) => {
    const currentIDs = { ...get().nodeIDs };
    if (currentIDs[type] === undefined) {
      currentIDs[type] = 0;
    }
    currentIDs[type] += 1;
    set({ nodeIDs: currentIDs });
    return `${type}-${currentIDs[type]}`;
  },
  
  addNode: (node) => {
    get().takeSnapshot();
    set({
      nodes: [...get().nodes, node],
    });
  },
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  onEdgesChange: (changes) => {
    // Check if a user deletion event is happening through native editor keys
    const deletedAny = changes.some(c => c.type === 'remove');
    if (deletedAny) {
      get().takeSnapshot();
    }
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  onConnect: (connection) => {
    get().takeSnapshot();
    // Add path markers, custom theme styles, with running dash animation
    const newEdge: Edge = {
      ...connection,
      id: `edge-${connection.source}-${connection.target}-${connection.sourceHandle}-${connection.targetHandle}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 }, // Slate / indigo color
      markerEnd: {
        type: MarkerType.Arrow,
        width: 14,
        height: 14,
        color: '#6366f1',
      },
    };
    
    set({
      edges: addEdge(newEdge, get().edges),
    });
  },
  
  updateNodeField: (nodeId, fieldName, fieldValue) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const updatedData = { ...node.data, [fieldName]: fieldValue };
          
          // Special hook: if this is Text Template changing, parse and store the dynamic variables
          // so the handles can re-render immediately
          if (node.type === 'text' && fieldName === 'text') {
            const regex = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;
            const variables: string[] = [];
            let match;
            while ((match = regex.exec(fieldValue)) !== null) {
              if (!variables.includes(match[1])) {
                variables.push(match[1]);
              }
            }
            updatedData.parsedVariables = variables;
          }
          
          return {
            ...node,
            data: updatedData,
          };
        }
        return node;
      }),
    });
  },

  deleteNode: (nodeId) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      // Clean up connected edges
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });
  },

  clearCanvas: () => {
    get().takeSnapshot();
    set({
      nodes: [],
      edges: [],
      selectedEdgeId: null,
    });
  },

  autoLayout: (direction = 'LR') => {
    get().takeSnapshot();
    const { nodes, edges } = get();
    if (nodes.length === 0) return;

    // Use dagre to determine layout nodes positions
    const g = new dagre.graphlib.Graph();
    g.setGraph({ 
      rankdir: direction, 
      nodesep: direction === 'LR' ? 80 : 120, 
      ranksep: direction === 'LR' ? 140 : 100 
    });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      // Dimensions of nodes
      g.setNode(node.id, { width: 300, height: 260 });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const positionedNodes = nodes.map((node) => {
      const nodeInfo = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeInfo.x - 150,
          y: nodeInfo.y - 130,
        },
      };
    });

    set({ nodes: positionedNodes });
  },

  duplicateNode: (nodeId) => {
    const node = get().nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    get().takeSnapshot();
    
    const nextId = get().getNodeID(node.type);
    
    // Position offset to clearly denote a duplicate node
    const newNode: Node = {
      ...node,
      id: nextId,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      },
      data: {
        ...node.data,
        id: nextId
      },
      selected: false
    };

    set({
      nodes: [...get().nodes, newNode]
    });
  }
}));


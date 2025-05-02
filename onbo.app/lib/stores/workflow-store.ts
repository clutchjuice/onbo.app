import { create } from 'zustand';
import { 
  Edge, 
  Node, 
  Connection, 
  addEdge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect, 
  applyNodeChanges, 
  applyEdgeChanges,
  NodeChange,
  EdgeChange
} from 'reactflow';

// Initial state object
const initialState = {
  nodes: [],
  edges: [],
  showStepPicker: false,
  insertIndex: null,
  selectedNodeId: null,
  hasUnsavedChanges: false,
};

interface State {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  showStepPicker: boolean;
  insertIndex: number | null;
  selectedNodeId: string | null;
  setShowStepPicker: (show: boolean) => void;
  setInsertIndex: (index: number | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  markChangesSaved: () => void;
  initializeWorkflow: (nodes: Node[], edges: Edge[]) => void;
  reset: () => void;
}

export const useWorkflowStore = create<State>((set, get) => ({
  ...initialState,
  onNodesChange: (changes) => {
    const newNodes = applyNodeChanges(changes, get().nodes);
    // Only mark as unsaved if there are non-selection changes
    const hasNonSelectionChanges = changes.some(change => 
      change.type !== 'select' && change.type !== 'position'
    );
    if (hasNonSelectionChanges) {
      set({
        nodes: newNodes,
        hasUnsavedChanges: true
      });
    } else {
      set({ nodes: newNodes });
    }
  },
  onEdgesChange: (changes) => {
    const newEdges = applyEdgeChanges(changes, get().edges);
    const hasChanges = !edgesEqual(newEdges, get().edges);
    if (hasChanges) {
      set({
        edges: newEdges,
        hasUnsavedChanges: true
      });
    } else {
      set({ edges: newEdges });
    }
  },
  onConnect: (connection) => {
    const newEdges = addEdge(connection, get().edges);
    set({
      edges: newEdges,
      hasUnsavedChanges: true
    });
  },
  setShowStepPicker: (show) => set({ showStepPicker: show }),
  setInsertIndex: (index) => set({ insertIndex: index }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
  markChangesSaved: () => set({ hasUnsavedChanges: false }),
  initializeWorkflow: (nodes, edges) => {
    set({ 
      ...initialState,
      nodes, 
      edges,
    });
  },
  reset: () => set(initialState),
  updateNodeData: (nodeId, data) => {
    const currentNode = get().nodes.find(node => node.id === nodeId);
    const newNodes = get().nodes.map(node =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node
    );
    
    // Only mark as unsaved if the data actually changed
    const nodeChanged = !isEqual(currentNode?.data, newNodes.find(n => n.id === nodeId)?.data);
    if (nodeChanged) {
      set({
        nodes: newNodes,
        hasUnsavedChanges: true
      });
    } else {
      set({ nodes: newNodes });
    }
  },
}));

// Helper functions to compare nodes and edges
function nodesEqual(a: Node[], b: Node[]): boolean {
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function edgesEqual(a: Edge[], b: Edge[]): boolean {
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

// Deep equality check for objects
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => isEqual(a[key], b[key]));
} 
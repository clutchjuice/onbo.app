import { create } from 'zustand';
import { Edge, Node, Connection, addEdge, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges } from 'reactflow';

type State = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  showStepPicker: boolean;
  insertIndex: number | null;
  setShowStepPicker: (show: boolean) => void;
  setInsertIndex: (index: number | null) => void;
};

export const useWorkflowStore = create<State>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  showStepPicker: false,
  insertIndex: null,
  setShowStepPicker: (show) => set({ showStepPicker: show }),
  setInsertIndex: (index) => set({ insertIndex: index }),
})); 
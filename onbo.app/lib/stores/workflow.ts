import { Node, Edge } from 'reactflow';

export interface State {
  nodes: Node[];
  edges: Edge[];
  showStepPicker: boolean;
  insertIndex: number;
} 
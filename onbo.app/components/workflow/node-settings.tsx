import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { SchedulingSettings } from './node-settings/scheduling-settings';

export function NodeSettings() {
  const { nodes, selectedNodeId, updateNodeData } = useWorkflowStore();
  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  if (!selectedNode) {
    return null;
  }

  const handleNodeDataChange = (data: any) => {
    updateNodeData(selectedNode.id, data);
  };

  switch (selectedNode.type) {
    case 'scheduling':
      return (
        <SchedulingSettings
          data={selectedNode.data}
          onChange={handleNodeDataChange}
        />
      );
    default:
      return null;
  }
} 
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { SchedulingSettings } from './node-settings/scheduling-settings';
import { TextSettings } from './node-settings/text-settings';
import { VideoSettings } from './node-settings/video-settings';
import { FormSettings } from './node-settings/form-settings';
import { ContractSettings } from './node-settings/contract-settings';
import { DocumentSettings } from './node-settings/document-settings';
import { PaymentSettings } from './node-settings/payment-settings';

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
    case 'text':
      return (
        <TextSettings
          data={selectedNode.data}
          onChange={handleNodeDataChange}
        />
      );
    case 'video':
      return (
        <VideoSettings
          data={selectedNode.data}
          onChange={handleNodeDataChange}
        />
      );
    case 'form':
      return (
        <FormSettings
          data={selectedNode.data}
          onChange={handleNodeDataChange}
        />
      );
    case 'contract_esign':
      return (
        <ContractSettings
          data={selectedNode.data}
          onChange={handleNodeDataChange}
        />
      );
    case 'scheduling':
      return (
        <SchedulingSettings
          data={selectedNode.data}
          onChange={handleNodeDataChange}
        />
      );
    case 'document_embed':
      return (
        <DocumentSettings
          data={selectedNode.data}
          onChange={handleNodeDataChange}
        />
      );
    case 'payment':
      return (
        <PaymentSettings
          data={selectedNode.data}
          onChange={handleNodeDataChange}
        />
      );
    default:
      return (
        <div className="p-4 text-sm text-muted-foreground">
          No settings available for this step type.
        </div>
      );
  }
} 
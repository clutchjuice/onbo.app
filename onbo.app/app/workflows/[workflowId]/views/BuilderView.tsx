import React from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import { EmptyWorkflowState } from '../EmptyWorkflowState';
import { NodeSettings } from '@/components/workflow/node-settings';

export function BuilderView({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  edgeTypes,
  flowRef,
  handleNodeClick,
  setSelectedNodeId,
  selectedNode,
  handleAddClick
}: any) {
  return (
    <>
      <div className="flex-1 relative">
        {nodes.length === 0 ? (
          <EmptyWorkflowState />
        ) : (
          <ReactFlow
            onInit={instance => {
              flowRef.current = instance;
              instance.fitView({ padding: 0.2, includeHiddenNodes: true });
            }}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={handleNodeClick}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
            className="bg-background"
            defaultEdgeOptions={{
              type: 'custom',
              animated: false,
              style: { strokeWidth: 2 }
            }}
            nodesDraggable={false}
            preventScrolling={true}
            connectOnClick={false}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        )}
      </div>
      {selectedNode && (
        <div className="w-[350px] border-l bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="font-semibold text-lg">{selectedNode.data?.title || 'Step Settings'}</div>
            <button onClick={() => setSelectedNodeId(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <NodeSettings />
          </div>
        </div>
      )}
    </>
  );
} 
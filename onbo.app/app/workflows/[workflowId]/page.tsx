'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowInstance,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Pencil, Save, Upload, Plus } from 'lucide-react';
import Link from 'next/link';
import { nodeTypes } from '@/components/workflow/node-types';
import { edgeTypes } from '@/components/workflow/edge-types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/lib/utils';
import { StepPicker } from '@/app/components/workflow/step-picker';
import { PlusButton } from '@/components/workflow/plus-button';

function EmptyWorkflowState() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <PlusButton 
          size="lg"
          onClick={() => {
            const workflow = useWorkflowStore.getState();
            const newNode = {
              id: crypto.randomUUID(),
              type: 'action',
              position: { x: 0, y: 0 },
              data: { label: 'New Action' }
            };
            useWorkflowStore.setState({
              nodes: [...(workflow.nodes || []), newNode]
            });
          }}
        />
        <p className="mt-4 text-sm text-muted-foreground">
          Click to add your first step
        </p>
      </div>
    </div>
  );
}

export default function WorkflowBuilder() {
  const params = useParams();
  const supabase = createClient();
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange,
    showStepPicker,
    setShowStepPicker,
    insertIndex,
    setInsertIndex
  } = useWorkflowStore();
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'published'>('draft');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const loadWorkflow = useCallback(async () => {
    try {
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', params.workflowId)
        .single();

      if (error) {
        console.error('Error loading workflow:', error);
        return;
      }

      setWorkflowTitle(workflow.name || 'Untitled Workflow');
      setWorkflowStatus(workflow.status || 'draft');
      
      // Ensure all edges have the proper data property
      const edgesWithData = (workflow.connections || []).map((edge: Edge, index: number) => ({
        ...edge,
        type: 'custom',
        data: { onAdd: () => handleAddClick(index + 1) }
      }));
      
      useWorkflowStore.setState({
        nodes: workflow.steps || [],
        edges: edgesWithData,
      });
      
      // Center view after nodes are loaded
      setTimeout(() => {
        flowRef.current?.fitView({ padding: 0.2, includeHiddenNodes: true });
      }, 100);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  }, [params.workflowId, supabase]);

  const updateWorkflowTitle = useCallback(async (newTitle: string) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({
          name: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.workflowId)
        .select();

      if (error) {
        console.error('Error updating workflow title:', error);
        toast.error('Failed to update workflow title');
        return;
      }

      setWorkflowTitle(newTitle);
      toast.success('Workflow title updated');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  }, [params.workflowId, supabase]);

  const handleTitleSubmit = useCallback(() => {
    if (titleInputRef.current) {
      const newTitle = titleInputRef.current.value.trim();
      if (newTitle && newTitle !== workflowTitle) {
        updateWorkflowTitle(newTitle);
      }
      setIsEditingTitle(false);
    }
  }, [workflowTitle, updateWorkflowTitle]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  }, [handleTitleSubmit]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const saveWorkflow = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({
          steps: nodes,
          connections: edges,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.workflowId);

      if (error) {
        console.error('Error saving workflow:', error);
        toast.error('Failed to save workflow');
        return;
      }

      toast.success('Workflow saved successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  }, [nodes, edges, params.workflowId, supabase]);

  const publishWorkflow = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.workflowId);

      if (error) {
        console.error('Error publishing workflow:', error);
        toast.error('Failed to publish workflow');
        return;
      }

      setWorkflowStatus('published');
      toast.success('Workflow published successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  }, [params.workflowId, supabase]);

  const handleStepSelect = useCallback(async (template: any) => {
    const newNode = {
      id: crypto.randomUUID(),
      type: template.type,
      position: { x: 0, y: 0 },
      draggable: false,
      data: {
        ...template.default_config,
        templateId: template.id
      }
    };

    const existingNodes = nodes || [];
    
    // If inserting at a specific position
    if (insertIndex !== null) {
      const xPosition = insertIndex === 0 
        ? 100 // First position
        : existingNodes[insertIndex - 1].position.x + 400; // After specified node
      
      // Shift all subsequent nodes to the right
      const updatedNodes = existingNodes.map((node, idx) => {
        if (idx >= insertIndex) {
          return {
            ...node,
            position: {
              ...node.position,
              x: node.position.x + 400
            }
          };
        }
        return node;
      });

      newNode.position = { x: xPosition, y: 100 };
      
      // Insert the new node at the specified position
      const nodesWithNew = [
        ...updatedNodes.slice(0, insertIndex),
        newNode,
        ...updatedNodes.slice(insertIndex)
      ];

      // Update edges
      const newEdges = edges.map(edge => ({
        ...edge,
        type: 'custom',
        data: { onAdd: () => handleAddClick(edges.indexOf(edge) + 1) }
      }));

      if (insertIndex > 0) {
        // Connect from previous node to new node
        const prevNode = existingNodes[insertIndex - 1];
        newEdges.push({
          id: `${prevNode.id}-${newNode.id}`,
          source: prevNode.id,
          target: newNode.id,
          type: 'custom',
          data: { onAdd: () => handleAddClick(insertIndex) }
        });
      }
      if (insertIndex < existingNodes.length) {
        // Connect from new node to next node
        const nextNode = existingNodes[insertIndex];
        // Remove old edge if it exists
        if (insertIndex > 0) {
          const prevNode = existingNodes[insertIndex - 1];
          const edgeIndex = newEdges.findIndex(e => 
            e.source === prevNode.id && e.target === nextNode.id
          );
          if (edgeIndex !== -1) {
            newEdges.splice(edgeIndex, 1);
          }
        }
        // Add new edge to next node
        newEdges.push({
          id: `${newNode.id}-${nextNode.id}`,
          source: newNode.id,
          target: nextNode.id,
          type: 'custom',
          data: { onAdd: () => handleAddClick(insertIndex + 1) }
        });
      }

      useWorkflowStore.setState({
        nodes: nodesWithNew,
        edges: newEdges,
      });
    } else {
      // Add to the end (existing behavior)
      const lastNode = existingNodes[existingNodes.length - 1];
      const xPosition = lastNode ? lastNode.position.x + 400 : 100;
      newNode.position = { x: xPosition, y: 100 };

      if (lastNode) {
        const newEdge = {
          id: `${lastNode.id}-${newNode.id}`,
          source: lastNode.id,
          target: newNode.id,
          type: 'custom',
          data: { onAdd: () => handleAddClick(nodes.length) }
        };
        useWorkflowStore.setState({
          nodes: [...nodes, newNode],
          edges: [...edges.map(edge => ({
            ...edge,
            type: 'custom',
            data: { onAdd: () => handleAddClick(edges.indexOf(edge) + 1) }
          })), newEdge],
        });
      } else {
        useWorkflowStore.setState({
          nodes: [newNode],
        });
      }
    }

    setShowStepPicker(false);
    setInsertIndex(null);

    // Center view after adding new node
    setTimeout(() => {
      flowRef.current?.fitView({ padding: 0.2, includeHiddenNodes: true });
    }, 100);
  }, [nodes, edges, insertIndex]);

  const handleAddClick = (index: number) => {
    setInsertIndex(index);
    setShowStepPicker(true);
  };

  // Custom node renderer to add plus buttons
  const getNodePositions = () => {
    const positions: { x: number, y: number }[] = [];
    if (!nodes.length) {
      positions.push({ x: 100, y: 100 }); // Initial position
    } else {
      // Add positions between nodes
      nodes.forEach((node, i) => {
        if (i === 0) {
          positions.push({ x: node.position.x - 200, y: 100 }); // Before first node
        }
        positions.push({ x: node.position.x + 200, y: 100 }); // After each node
      });
    }
    return positions;
  };

  // Find the selected node
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  return (
    <div className="h-screen w-full relative">
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-background/95 backdrop-blur-lg border-b">
        <Link
          href="/workflows"
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-1 transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]" />
          <span className="transition-opacity duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]">Back to workflows</span>
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 font-semibold flex items-center gap-2 group cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]">
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              defaultValue={workflowTitle}
              className="h-7 w-[200px] text-center font-semibold bg-transparent"
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
            />
          ) : (
            <>
              <span>{workflowTitle}</span>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" onClick={() => setIsEditingTitle(true)} />
              <Badge 
                variant="outline" 
                className={cn(
                  "ml-2 capitalize",
                  workflowStatus === 'published' ? "border-green-500 text-green-500" : "border-orange-500 text-orange-500"
                )}
              >
                {workflowStatus}
              </Badge>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]">
          <Button variant="outline" size="sm" className="transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-105 active:scale-95">
            <Eye className="w-4 h-4 mr-1 transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]" />
            Preview
          </Button>
          <Button onClick={saveWorkflow} size="sm" className="transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-105 active:scale-95">
            <Save className="w-4 h-4 mr-1 transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]" />
            Save
          </Button>
          <Button 
            onClick={publishWorkflow} 
            variant="default" 
            size="sm" 
            className="transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-105 active:scale-95"
            disabled={workflowStatus === 'published'}
          >
            <Upload className="w-4 h-4 mr-1 transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]" />
            Publish
          </Button>
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
        className="bg-muted/10"
        defaultEdgeOptions={{
          type: 'custom',
          animated: false,
          style: { strokeWidth: 2 }
        }}
        nodesDraggable={false}
        preventScrolling={true}
        connectOnClick={false}
        onInit={instance => {
          flowRef.current = instance;
          instance.fitView({ padding: 0.2, includeHiddenNodes: true });
        }}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
      >
        <Background />
        <Controls />
        <MiniMap />
        {nodes.length === 0 && (
          <EmptyWorkflowState />
        )}
      </ReactFlow>
      {showStepPicker && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[9999]"
            onClick={() => {
              setShowStepPicker(false);
              setInsertIndex(null);
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[10000]">
            <div className="bg-background p-4 rounded-lg shadow-lg border max-w-md w-full relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Add Onboarding Step</h2>
                <button 
                  onClick={() => {
                    setShowStepPicker(false);
                    setInsertIndex(null);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>
              <StepPicker 
                onStepSelect={(step) => {
                  handleStepSelect(step);
                  setShowStepPicker(false);
                  setInsertIndex(null);
                }}
              />
            </div>
          </div>
        </>
      )}
      {/* Sidebar for step editor */}
      {selectedNode && (
        <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-[350px] bg-white border-l shadow-lg z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="font-semibold text-lg">{selectedNode.data?.title || 'Step Settings'}</div>
            <button onClick={() => setSelectedNodeId(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Example fields, can be expanded per node type */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1">Title</label>
              <input
                className="w-full border rounded px-2 py-1"
                value={selectedNode.data?.title || ''}
                onChange={e => {
                  const newTitle = e.target.value;
                  useWorkflowStore.setState({
                    nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, title: newTitle } } : n)
                  });
                }}
              />
            </div>
            {/* Add more fields here as needed */}
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowInstance,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Pencil, Save, Upload, Plus } from 'lucide-react';
import Link from 'next/link';
import { nodeTypes } from '@/components/workflow/node-types';
import { edgeTypes } from '@/components/workflow/edge-types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StepPicker } from '@/components/workflow/step-picker';
import { PlusButton } from '@/components/workflow/plus-button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function EmptyWorkflowState() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <PlusButton 
          size="lg"
          onClick={() => {
            useWorkflowStore.setState({
              showStepPicker: true,
              insertIndex: 0
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
  const router = useRouter();
  const supabase = createClient();
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange,
    showStepPicker,
    setShowStepPicker,
    insertIndex,
    setInsertIndex,
    selectedNodeId,
    setSelectedNodeId,
    hasUnsavedChanges,
    markChangesSaved
  } = useWorkflowStore();
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'published'>('draft');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const flowRef = useRef<ReactFlowInstance | null>(null);

  // Handle browser back/forward/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle Next.js client-side navigation
  const handleNavigation = useCallback((href: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(href);
      setShowUnsavedChangesDialog(true);
    } else {
      router.push(href);
    }
  }, [hasUnsavedChanges, router]);

  const loadWorkflow = useCallback(async () => {
    setIsLoading(true);
    try {
      // Reset the store to initial state before loading new data
      useWorkflowStore.getState().reset();
      
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
      
      // Initialize workflow with a single state update
      useWorkflowStore.getState().initializeWorkflow(
        workflow.steps || [],
        edgesWithData
      );
      
      // Center view after nodes are loaded
      setTimeout(() => {
        flowRef.current?.fitView({ padding: 0.2, includeHiddenNodes: true });
      }, 100);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
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

      markChangesSaved();
      toast.success('Workflow saved successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  }, [nodes, edges, params.workflowId, supabase, markChangesSaved]);

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
        templateId: template.id,
        ...(template.type === 'scheduling' ? { embedCode: '' } : {})
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

      // First update nodes and edges
      useWorkflowStore.setState({
        nodes: nodesWithNew,
        edges: newEdges,
      });

      // Then update selection in a separate call to ensure nodes are updated first
      setTimeout(() => {
        useWorkflowStore.setState({
          selectedNodeId: newNode.id
        });
      }, 0);
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
        // First update nodes and edges
        useWorkflowStore.setState({
          nodes: [...nodes, newNode],
          edges: [...edges.map(edge => ({
            ...edge,
            type: 'custom',
            data: { onAdd: () => handleAddClick(edges.indexOf(edge) + 1) }
          })), newEdge],
        });

        // Then update selection in a separate call
        setTimeout(() => {
          useWorkflowStore.setState({
            selectedNodeId: newNode.id
          });
        }, 0);
      } else {
        // First update nodes
        useWorkflowStore.setState({
          nodes: [newNode],
        });

        // Then update selection in a separate call
        setTimeout(() => {
          useWorkflowStore.setState({
            selectedNodeId: newNode.id
          });
        }, 0);
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
  const selectedNode = useMemo(() => {
    const node = nodes.find((n) => n.id === selectedNodeId);
    return node;
  }, [nodes, selectedNodeId]);

  // Update onNodeClick to use store's setSelectedNodeId
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4">
          <button 
            onClick={() => handleNavigation('/workflows')} 
            className="flex items-center gap-2 text-sm font-medium hover:text-foreground/70 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <Badge 
              variant="outline"
              className={cn(
                workflowStatus === 'published' 
                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900" 
                  : "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900"
              )}
            >
              {workflowStatus === 'published' ? 'Published' : 'Draft'}
            </Badge>
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              defaultValue={workflowTitle}
                className="h-8 w-[300px] text-base font-semibold"
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
            />
          ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-2 hover:text-foreground/70 transition-colors"
              >
                <h1 className="text-base font-semibold">{workflowTitle}</h1>
                <Pencil className="h-3.5 w-3.5" />
              </button>
          )}
        </div>
          <div className="flex items-center gap-2">
            {!isLoading && (
              <>
                <Button 
                  variant={hasUnsavedChanges ? "default" : "outline"} 
                  size="sm" 
                  onClick={saveWorkflow}
                  className={cn(
                    "hover:scale-105 transition-all duration-200",
                    hasUnsavedChanges ? "shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.1)]" : ""
                  )}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:scale-105 transition-all duration-200"
                  onClick={() => handleNavigation(`/workflows/${params.workflowId}/preview`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button 
                  variant={workflowStatus === 'published' ? "outline" : "default"} 
                  size="sm" 
                  onClick={publishWorkflow} 
                  disabled={workflowStatus === 'published'}
                  className="hover:scale-105 transition-all duration-200"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {workflowStatus === 'published' ? 'Published' : 'Publish'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 flex">
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
            {/* Example fields, can be expanded per node type */}
            <div className="mb-4">
                <label className="block text-xs font-medium mb-1">Step Name</label>
              <input
                className="w-full border rounded px-2 py-1"
                value={selectedNode.data?.title || ''}
                onChange={e => {
                  const newTitle = e.target.value;
                  useWorkflowStore.setState({
                    nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, title: newTitle } } : n),
                    hasUnsavedChanges: true
                  });
                }}
              />
            </div>
              {/* Form-specific settings */}
              {selectedNode.type === 'form' && (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-1">Description / Instructions</label>
                    <textarea
                      className="w-full border rounded px-2 py-1"
                      value={selectedNode.data?.description || ''}
                      onChange={e => {
                        const newDescription = e.target.value;
                        useWorkflowStore.setState({
                          nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, description: newDescription } } : n),
                          hasUnsavedChanges: true
                        });
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-1">Fields</label>
                    <div className="space-y-3">
                      {(selectedNode.data?.fields || []).map((field: any, idx: number) => (
                        <div key={idx} className="p-2 border rounded bg-muted/20 flex flex-col gap-1">
                          <div className="flex gap-2">
                            <select
                              className="border rounded px-2 py-1 text-xs w-1/2"
                              value={field.type}
                              onChange={e => {
                                const newType = e.target.value;
                                const newFields = [...selectedNode.data.fields];
                                newFields[idx].type = newType;
                                useWorkflowStore.setState({
                                  nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, fields: newFields } } : n),
                                  hasUnsavedChanges: true
                                });
                              }}
                            >
                              <option value="text">Single Line</option>
                              <option value="textarea">Paragraph</option>
                              <option value="number">Number</option>
                              <option value="dropdown">Dropdown</option>
                            </select>
                            <button
                              className="text-xs text-red-500 ml-auto px-2"
                              onClick={() => {
                                const newFields = [...selectedNode.data.fields];
                                newFields.splice(idx, 1);
                                useWorkflowStore.setState({
                                  nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, fields: newFields } } : n),
                                  hasUnsavedChanges: true
                                });
                              }}
                              type="button"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            className="border rounded px-2 py-1 text-xs w-full"
                            placeholder="Label"
                            value={field.label}
                            onChange={e => {
                              const newLabel = e.target.value;
                              const newFields = [...selectedNode.data.fields];
                              newFields[idx].label = newLabel;
                              useWorkflowStore.setState({
                                nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, fields: newFields } } : n),
                                hasUnsavedChanges: true
                              });
                            }}
                          />
                          <input
                            className="border rounded px-2 py-1 text-xs w-full"
                            placeholder="Placeholder"
                            value={field.placeholder}
                            onChange={e => {
                              const newPlaceholder = e.target.value;
                              const newFields = [...selectedNode.data.fields];
                              newFields[idx].placeholder = newPlaceholder;
                              useWorkflowStore.setState({
                                nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, fields: newFields } } : n),
                                hasUnsavedChanges: true
                              });
                            }}
                          />
                          {field.type === 'dropdown' && (
                            <input
                              className="border rounded px-2 py-1 text-xs w-full"
                              placeholder="Comma-separated options (e.g. Option 1, Option 2)"
                              value={field.options || ''}
                              onChange={e => {
                                const newFields = [...selectedNode.data.fields];
                                newFields[idx].options = e.target.value;
                                useWorkflowStore.setState({
                                  nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, fields: newFields } } : n),
                                  hasUnsavedChanges: true
                                });
                              }}
                            />
                          )}
                          <label className="flex items-center gap-2 text-xs mt-1">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={e => {
                                const newFields = [...selectedNode.data.fields];
                                newFields[idx].required = e.target.checked;
                                useWorkflowStore.setState({
                                  nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, fields: newFields } } : n),
                                  hasUnsavedChanges: true
                                });
                              }}
                            />
                            Required
                          </label>
                        </div>
                      ))}
                    </div>
                    <button
                      className="mt-2 px-2 py-1 border rounded text-xs bg-muted hover:bg-muted/50 w-full"
                      type="button"
                      onClick={() => {
                        const newFields = [...(selectedNode.data?.fields || [])];
                        newFields.push({ type: 'text', label: '', placeholder: '', required: false });
                        useWorkflowStore.setState({
                          nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, fields: newFields } } : n),
                          hasUnsavedChanges: true
                        });
                      }}
                    >
                      + Add Field
                    </button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-1">Submit Button Text</label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={selectedNode.data?.submitLabel || 'Submit'}
                      onChange={e => {
                        const newLabel = e.target.value;
                        useWorkflowStore.setState({
                          nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, submitLabel: newLabel } } : n),
                          hasUnsavedChanges: true
                        });
                      }}
                    />
                  </div>
                </>
              )}
              {/* Text step settings */}
              {selectedNode.type === 'text' && (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-1">Header</label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={selectedNode.data?.header || ''}
                      onChange={e => {
                        const newHeader = e.target.value;
                        useWorkflowStore.setState({
                          nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, header: newHeader } } : n),
                          hasUnsavedChanges: true
                        });
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-1">Subheader <span className="text-muted-foreground">(optional)</span></label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      value={selectedNode.data?.subheader || ''}
                      onChange={e => {
                        const newSubheader = e.target.value;
                        useWorkflowStore.setState({
                          nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, subheader: newSubheader } } : n),
                          hasUnsavedChanges: true
                        });
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-1">Body Text <span className="text-muted-foreground">(supports markdown, rich text, emojis)</span></label>
                    <textarea
                      className="w-full border rounded px-2 py-1 min-h-[80px]"
                      value={selectedNode.data?.content || ''}
                      onChange={e => {
                        const newContent = e.target.value;
                        useWorkflowStore.setState({
                          nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, content: newContent } } : n),
                          hasUnsavedChanges: true
                        });
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-1">Image <span className="text-muted-foreground">(optional, URL)</span></label>
                    <input
                      className="w-full border rounded px-2 py-1"
                      placeholder="https://..."
                      value={selectedNode.data?.image || ''}
                      onChange={e => {
                        const newImage = e.target.value;
                        useWorkflowStore.setState({
                          nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, image: newImage } } : n),
                          hasUnsavedChanges: true
                        });
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-1">Alignment</label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={selectedNode.data?.align || 'left'}
                      onChange={e => {
                        const newAlign = e.target.value;
                        useWorkflowStore.setState({
                          nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, align: newAlign } } : n),
                          hasUnsavedChanges: true
                        });
                      }}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                    </select>
                  </div>
                </>
              )}
              {/* Scheduling step settings */}
              {selectedNode.type === 'scheduling' && (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-medium mb-1">Calendar Embed Code</label>
                    <textarea
                      className="w-full border rounded px-2 py-1 min-h-[200px] font-mono text-sm"
                      value={selectedNode.data?.embedCode || ''}
                      placeholder="*Paste your calendar embed code here (e.g. from Calendly)"
                      onChange={e => {
                        const newEmbedCode = e.target.value;
                        useWorkflowStore.setState({
                          nodes: nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, embedCode: newEmbedCode } } : n),
                          hasUnsavedChanges: true
                        });
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        </div>
      {showStepPicker && (
        <Dialog open={showStepPicker} onOpenChange={(open) => !open && setShowStepPicker(false)}>
          <DialogContent className="sm:max-w-[500px]">
            <StepPicker
              onStepSelect={(template) => {
                handleStepSelect(template);
                setShowStepPicker(false);
                setInsertIndex(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnsavedChangesDialog(false);
                setPendingNavigation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingNavigation) {
                  router.push(pendingNavigation);
                }
              }}
            >
              Leave Without Saving
            </Button>
            <Button
              onClick={async () => {
                await saveWorkflow();
                if (pendingNavigation) {
                  router.push(pendingNavigation);
                }
              }}
            >
              Save & Leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
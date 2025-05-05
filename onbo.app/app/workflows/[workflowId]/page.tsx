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
import { ArrowLeft, Eye, Pencil, Save, Upload, Plus, Settings, Palette, GitBranch, Shield, Bell } from 'lucide-react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { NodeSettings } from '@/components/workflow/node-settings';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [activeView, setActiveView] = useState<'builder' | 'settings' | 'style'>('builder');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [requireAuth, setRequireAuth] = useState(false);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false);
  const [saveProgress, setSaveProgress] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [sendEmailConfirmation, setSendEmailConfirmation] = useState(false);
  const [branding, setBranding] = useState({
    logo_url: '',
    brand_color: '',
    custom_domain: ''
  });
  const [flowBehavior, setFlowBehavior] = useState({
    allow_back_navigation: true,
    show_progress_indicator: true,
    save_progress: false,
    completion_deadline: null as string | null
  });
  const [accessSecurity, setAccessSecurity] = useState({
    require_verification: false,
    access_type: 'public',
    password_protection: {
      enabled: false,
      password: ''
    }
  });
  const [notifications, setNotifications] = useState({
    on_start: false,
    on_complete: false,
    on_step_complete: false
  });

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
    try {
      if (hasUnsavedChanges) {
        setPendingNavigation(href);
        setShowUnsavedChangesDialog(true);
      } else {
        console.log('Navigating to:', href);
        router.push(href);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Failed to navigate to preview');
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
      setWorkflowDescription(workflow.description || '');
      setRequireAuth(workflow.require_auth || false);
      setAllowMultipleSubmissions(workflow.allow_multiple_submissions || false);
      setSaveProgress(workflow.save_progress || false);
      setSuccessMessage(workflow.success_message || '');
      setRedirectUrl(workflow.redirect_url || '');
      setSendEmailConfirmation(workflow.send_email_confirmation || false);
      
      setBranding(workflow.branding || {
        logo_url: '',
        brand_color: '',
        custom_domain: ''
      });
      setFlowBehavior(workflow.flow_behavior || {
        allow_back_navigation: true,
        show_progress_indicator: true,
        save_progress: false,
        completion_deadline: null
      });
      setAccessSecurity(workflow.access_security || {
        require_verification: false,
        access_type: 'public',
        password_protection: {
          enabled: false,
          password: ''
        }
      });
      setNotifications(workflow.notifications || {
        on_start: false,
        on_complete: false,
        on_step_complete: false
      });
      
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
      const workflowData = {
        name: workflowTitle || 'Untitled Workflow',
        description: workflowDescription || '',
        status: workflowStatus || 'draft',
        steps: nodes || [],
        connections: edges || [],
        branding: branding || {
          logo_url: '',
          brand_color: '',
          custom_domain: ''
        },
        flow_behavior: flowBehavior || {
          allow_back_navigation: true,
          show_progress_indicator: true,
          save_progress: false,
          completion_deadline: null
        },
        access_security: accessSecurity || {
          require_verification: false,
          access_type: 'public',
          password_protection: {
            enabled: false,
            password: ''
          }
        },
        notifications: notifications || {
          on_start: false,
          on_complete: false,
          on_step_complete: false
        },
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('workflows')
        .update(workflowData)
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
  }, [
    nodes,
    edges,
    params.workflowId,
    supabase,
    markChangesSaved,
    workflowTitle,
    workflowDescription,
    workflowStatus,
    branding,
    flowBehavior,
    accessSecurity,
    notifications
  ]);

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
    const nodeSpacing = 440; // 300px node width + 140px gap
    
    // If inserting at a specific position
    if (insertIndex !== null) {
      const xPosition = insertIndex === 0 
        ? 100 // First position
        : existingNodes[insertIndex - 1].position.x + nodeSpacing; // After specified node
      
      // Shift all subsequent nodes to the right
      const updatedNodes = existingNodes.map((node, idx) => {
        if (idx >= insertIndex) {
          return {
            ...node,
            position: {
              ...node.position,
              x: node.position.x + nodeSpacing
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
      const xPosition = lastNode ? lastNode.position.x + nodeSpacing : 100;
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
          <div className="w-[200px]">
            <button 
              onClick={() => handleNavigation('/workflows')} 
              className="flex items-center gap-2 text-sm font-medium hover:text-foreground/70 transition-colors"
        >
              <ArrowLeft className="h-4 w-4" />
              Back to Workflows
            </button>
          </div>
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
          <div className="w-[200px] flex items-center justify-end gap-2">
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
      <div className="flex justify-center border-b">
        <div className="flex">
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors relative",
              "hover:text-foreground/80",
              "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
              "after:transition-colors",
              activeView === 'builder' ? (
                "text-foreground after:bg-primary"
              ) : (
                "text-muted-foreground after:bg-transparent"
              )
            )}
            onClick={() => setActiveView('builder')}
          >
            Builder
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors relative",
              "hover:text-foreground/80",
              "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
              "after:transition-colors",
              activeView === 'settings' ? (
                "text-foreground after:bg-primary"
              ) : (
                "text-muted-foreground after:bg-transparent"
              )
            )}
            onClick={() => setActiveView('settings')}
          >
            Settings
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors relative",
              "hover:text-foreground/80",
              "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
              "after:transition-colors",
              activeView === 'style' ? (
                "text-foreground after:bg-primary"
              ) : (
                "text-muted-foreground after:bg-transparent"
              )
            )}
            onClick={() => setActiveView('style')}
          >
            Style
          </button>
        </div>
      </div>
      <div className="flex-1 flex">
        {activeView === 'builder' ? (
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
        ) : activeView === 'settings' ? (
          <div className="flex-1 p-4 overflow-y-auto flex justify-center bg-slate-50 dark:bg-slate-900/30">
            <div className="w-[800px] max-w-full">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Workflow Settings</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              </div>
              <Accordion 
                type="single" 
                collapsible 
                className="space-y-4"
                defaultValue="basic"
              >
                <AccordionItem 
                  value="basic" 
                  className="border-0 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="px-6 text-base font-medium hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-[#1260cc10]">
                        <Settings className="w-4 h-4 text-[#1260cc]" />
                      </div>
                      Basic Settings
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pt-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>Workflow Name</Label>
                        <Input
                          value={workflowTitle}
                          onChange={e => {
                            setWorkflowTitle(e.target.value);
                            useWorkflowStore.setState({ hasUnsavedChanges: true });
                          }}
                          onBlur={() => updateWorkflowTitle(workflowTitle)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Describe the purpose of this workflow..."
                          value={workflowDescription}
                onChange={e => {
                            setWorkflowDescription(e.target.value);
                            useWorkflowStore.setState({ hasUnsavedChanges: true });
                          }}
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Workflow Status</Label>
                        <RadioGroup
                          value={workflowStatus}
                          onValueChange={(value: 'draft' | 'published') => setWorkflowStatus(value)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="draft" id="status-draft" />
                            <Label htmlFor="status-draft">Draft</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="published" id="status-published" />
                            <Label htmlFor="status-published">Published</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="branding" 
                  className="border-0 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="px-6 text-base font-medium hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-[#1260cc10]">
                        <Palette className="w-4 h-4 text-[#1260cc]" />
                      </div>
                      Custom Branding
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Logo</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Enter logo URL"
                            value={branding.logo_url}
                            onChange={e => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                          />
                          <Button variant="outline" size="sm">Upload</Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Brand Color</Label>
                        <Input
                          type="color"
                          className="h-10"
                          value={branding.brand_color || '#000000'}
                          onChange={e => setBranding(prev => ({ ...prev, brand_color: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Custom Domain</Label>
                        <Input
                          placeholder="your-domain.com"
                          value={branding.custom_domain}
                          onChange={e => setBranding(prev => ({ ...prev, custom_domain: e.target.value }))}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="behavior" 
                  className="border-0 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="px-6 text-base font-medium hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-[#1260cc10]">
                        <GitBranch className="w-4 h-4 text-[#1260cc]" />
                      </div>
                      Flow Behavior
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-0.5">
                          <Label>Allow Back Navigation</Label>
                          <p className="text-sm text-muted-foreground">Let users revisit earlier steps</p>
                        </div>
                        <Switch
                          checked={flowBehavior.allow_back_navigation}
                          onCheckedChange={checked => setFlowBehavior(prev => ({ ...prev, allow_back_navigation: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-0.5">
                          <Label>Progress Indicator</Label>
                          <p className="text-sm text-muted-foreground">Show completion progress</p>
                        </div>
                        <Switch
                          checked={flowBehavior.show_progress_indicator}
                          onCheckedChange={checked => setFlowBehavior(prev => ({ ...prev, show_progress_indicator: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-0.5">
                          <Label>Save Progress</Label>
                          <p className="text-sm text-muted-foreground">Allow users to save and resume later</p>
                        </div>
                        <Switch
                          checked={flowBehavior.save_progress}
                          onCheckedChange={checked => setFlowBehavior(prev => ({ ...prev, save_progress: checked }))}
                        />
                      </div>

                      <div className="space-y-2 py-2 border-t">
                        <Label>Completion Deadline</Label>
                        <p className="text-sm text-muted-foreground mb-2">Set a deadline for workflow completion</p>
                        <Input
                          type="datetime-local"
                          value={flowBehavior.completion_deadline || ''}
                          onChange={e => setFlowBehavior(prev => ({ ...prev, completion_deadline: e.target.value }))}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="security" 
                  className="border-0 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="px-6 text-base font-medium hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-[#1260cc10]">
                        <Shield className="w-4 h-4 text-[#1260cc]" />
                      </div>
                      Access & Security
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-0.5">
                          <Label>Require Login or Email Verification</Label>
                          <p className="text-sm text-muted-foreground">Users must verify their identity</p>
                        </div>
                        <Switch
                          checked={accessSecurity.require_verification}
                          onCheckedChange={checked => setAccessSecurity(prev => ({ ...prev, require_verification: checked }))}
                        />
                      </div>

                      <div className="space-y-2 py-2 border-t">
                        <Label>Limit Access To</Label>
                        <Select
                          value={accessSecurity.access_type}
                          onValueChange={value => setAccessSecurity(prev => ({ ...prev, access_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Anyone with the link</SelectItem>
                            <SelectItem value="invite_only">Invited users only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="py-2 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <div className="space-y-0.5">
                            <Label>Password Protection</Label>
                            <p className="text-sm text-muted-foreground">Require a password to access</p>
                          </div>
                          <Switch
                            checked={accessSecurity.password_protection.enabled}
                            onCheckedChange={checked => setAccessSecurity(prev => ({
                              ...prev,
                              password_protection: {
                                ...prev.password_protection,
                                enabled: checked
                              }
                            }))}
                          />
                        </div>
                        {accessSecurity.password_protection.enabled && (
                          <Input
                            type="password"
                            placeholder="Enter password"
                            value={accessSecurity.password_protection.password}
                            onChange={e => setAccessSecurity(prev => ({
                              ...prev,
                              password_protection: {
                                ...prev.password_protection,
                                password: e.target.value
                              }
                            }))}
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="notifications" 
                  className="border-0 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="px-6 text-base font-medium hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-[#1260cc10]">
                        <Bell className="w-4 h-4 text-[#1260cc]" />
                      </div>
                      Notifications
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-0.5">
                          <Label>On Workflow Start</Label>
                          <p className="text-sm text-muted-foreground">Send email when workflow starts</p>
                        </div>
                        <Switch
                          checked={notifications.on_start}
                          onCheckedChange={checked => setNotifications(prev => ({ ...prev, on_start: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-0.5">
                          <Label>On Workflow Complete</Label>
                          <p className="text-sm text-muted-foreground">Send email when workflow is completed</p>
                        </div>
                        <Switch
                          checked={notifications.on_complete}
                          onCheckedChange={checked => setNotifications(prev => ({ ...prev, on_complete: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between py-2 border-t">
                        <div className="space-y-0.5">
                          <Label>On Step Complete</Label>
                          <p className="text-sm text-muted-foreground">Send email when any step is completed</p>
                        </div>
                        <Switch
                          checked={notifications.on_step_complete}
                          onCheckedChange={checked => setNotifications(prev => ({ ...prev, on_step_complete: checked }))}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 overflow-y-auto flex justify-center bg-slate-50 dark:bg-slate-900/30">
            <div className="w-[800px] max-w-full">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Workflow Style</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              </div>
              {/* Style content will be added later */}
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
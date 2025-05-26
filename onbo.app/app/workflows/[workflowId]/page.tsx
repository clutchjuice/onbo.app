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
import { ArrowLeft, Eye, Pencil, Save, Upload, Plus, Settings, Palette, GitBranch, Shield, Bell, Copy } from 'lucide-react';
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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { NodeSettings } from '@/components/workflow/node-settings';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { ColorField } from '@/components/ui/color-field';
import Image from 'next/image';
import { StepRenderer } from '@/components/workflow-preview/step-renderer';
import { BuilderView } from './views/BuilderView';
import { SettingsView } from './views/SettingsView';
import { StyleView } from './views/StyleView';
import { ShareView } from './views/ShareView';

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

// Utility to hash a string using SHA-256
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Utility to check if a string is a SHA-256 hash
function isSHA256(str: string) {
  return /^[a-f0-9]{64}$/i.test(str);
}

// Utility to deeply compare two values
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// Utility to compare draft and published workflow fields using deepEqual
function isDraftDifferentFromPublished(workflow: any) {
  if (!workflow) return false;
  const fields = [
    'name', 'description', 'steps', 'connections', 'branding', 'flow_behavior', 'access_security', 'notifications'
  ];
  for (const field of fields) {
    const draft = workflow[`draft_${field}`];
    const published = workflow[`published_${field}`];
    if (!deepEqual(draft, published)) {
      return true;
    }
  }
  return false;
}

// Update defaultBranding to match new design
const defaultBranding = {
  logo_url: '',
  brand_color: '',
  custom_domain: '',
  accent: '#2563eb', // blue for progress bar
  gradient1: '#fff',
  gradient2: '#fff',
  primaryText: '#232A41',
  secondaryText: '#5E777E',
  background: '#fff',
  buttonColor: '#2563eb', // blue for button
  theme: '',
};

function mergeBranding(branding: any) {
  return { ...defaultBranding, ...branding };
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
  const [activeView, setActiveView] = useState<'builder' | 'settings' | 'style' | 'share'>('builder');
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
    custom_domain: '',
    accent: '#E38C00',
    gradient1: '#DDCFC3',
    gradient2: '#886C5A',
    primaryText: '#232A41',
    secondaryText: '#5E777E',
    background: '#F6F6F6',
    buttonColor: '#E38C00',
    theme: '',
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
  const [lastSavedWorkflowTitle, setLastSavedWorkflowTitle] = useState('');
  const [lastSavedWorkflowDescription, setLastSavedWorkflowDescription] = useState('');
  const [lastSavedWorkflowStatus, setLastSavedWorkflowStatus] = useState<'draft' | 'published'>('draft');
  const [lastSavedBranding, setLastSavedBranding] = useState({ logo_url: '', brand_color: '', custom_domain: '', accent: '#E38C00', gradient1: '#DDCFC3', gradient2: '#886C5A', primaryText: '#232A41', secondaryText: '#5E777E', background: '#F6F6F6', buttonColor: '#E38C00', theme: '' });
  const [lastSavedFlowBehavior, setLastSavedFlowBehavior] = useState({ allow_back_navigation: true, show_progress_indicator: true, save_progress: false, completion_deadline: null as string | null });
  const [lastSavedAccessSecurity, setLastSavedAccessSecurity] = useState({ require_verification: false, access_type: 'public', password_protection: { enabled: false, password: '' } });
  const [lastSavedNotifications, setLastSavedNotifications] = useState({ on_start: false, on_complete: false, on_step_complete: false });
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishLink, setPublishLink] = useState('');
  const [workflowRecord, setWorkflowRecord] = useState<any>(null);
  const [showPublishNeedsSaveDialog, setShowPublishNeedsSaveDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

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
      // Use draft columns for editing
      setWorkflowTitle(workflow.draft_name || 'Untitled Workflow');
      setWorkflowStatus(workflow.draft_status || 'draft');
      setWorkflowDescription(workflow.draft_description || '');
      setRequireAuth(workflow.draft_access_security?.require_verification || false);
      setAllowMultipleSubmissions(workflow.draft_flow_behavior?.allow_multiple_submissions || false);
      setSaveProgress(workflow.draft_flow_behavior?.save_progress || false);
      setSuccessMessage(workflow.draft_notifications?.success_message || '');
      setRedirectUrl(workflow.draft_notifications?.redirect_url || '');
      setSendEmailConfirmation(workflow.draft_notifications?.send_email_confirmation || false);
      setBranding(workflow.draft_branding || { logo_url: '', brand_color: '', custom_domain: '', accent: '#E38C00', gradient1: '#DDCFC3', gradient2: '#886C5A', primaryText: '#232A41', secondaryText: '#5E777E', background: '#F6F6F6', buttonColor: '#E38C00', theme: '' });
      setFlowBehavior(workflow.draft_flow_behavior || { allow_back_navigation: true, show_progress_indicator: true, save_progress: false, completion_deadline: null });
      setAccessSecurity(workflow.draft_access_security || { require_verification: false, access_type: 'public', password_protection: { enabled: false, password: '' } });
      setNotifications(workflow.draft_notifications || { on_start: false, on_complete: false, on_step_complete: false });
      const edgesWithData = (workflow.draft_connections || []).map((edge: Edge, index: number) => ({
        ...edge,
        type: 'custom',
        data: { onAdd: () => handleAddClick(index + 1) }
      }));
      useWorkflowStore.getState().initializeWorkflow(
        workflow.draft_steps || [],
        edgesWithData
      );
      setTimeout(() => {
        flowRef.current?.fitView({ padding: 0.2, includeHiddenNodes: true });
      }, 100);
      setLastSavedWorkflowTitle(workflow.draft_name || 'Untitled Workflow');
      setLastSavedWorkflowDescription(workflow.draft_description || '');
      setLastSavedWorkflowStatus(workflow.draft_status || 'draft');
      setLastSavedBranding(workflow.draft_branding || { logo_url: '', brand_color: '', custom_domain: '', accent: '#E38C00', gradient1: '#DDCFC3', gradient2: '#886C5A', primaryText: '#232A41', secondaryText: '#5E777E', background: '#F6F6F6', buttonColor: '#E38C00', theme: '' });
      setLastSavedFlowBehavior(workflow.draft_flow_behavior || { allow_back_navigation: true, show_progress_indicator: true, save_progress: false, completion_deadline: null });
      setLastSavedAccessSecurity(workflow.draft_access_security || { require_verification: false, access_type: 'public', password_protection: { enabled: false, password: '' } });
      setLastSavedNotifications(workflow.draft_notifications || { on_start: false, on_complete: false, on_step_complete: false });
      setWorkflowRecord(workflow);
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
      setLastSavedWorkflowTitle(newTitle);
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

  const unpublishedChanges = useMemo(() => isDraftDifferentFromPublished(workflowRecord), [workflowRecord]);
  const canPublish = useMemo(() => !hasUnsavedChanges && unpublishedChanges, [hasUnsavedChanges, unpublishedChanges]);

  const saveWorkflow = useCallback(async () => {
    try {
      let accessSec = accessSecurity;
      // Hash password if enabled and not already hashed
      if (accessSec.password_protection?.enabled && accessSec.password_protection.password) {
        if (!isSHA256(accessSec.password_protection.password)) {
          accessSec = {
            ...accessSec,
            password_protection: {
              ...accessSec.password_protection,
              password: await hashString(accessSec.password_protection.password)
            }
          };
        }
      }
      const workflowData = {
        draft_name: workflowTitle || 'Untitled Workflow',
        draft_description: workflowDescription || '',
        draft_status: workflowStatus || 'draft',
        draft_steps: nodes || [],
        draft_connections: edges || [],
        draft_branding: mergeBranding(branding),
        draft_flow_behavior: flowBehavior || { allow_back_navigation: true, show_progress_indicator: true, save_progress: false, completion_deadline: null },
        draft_access_security: accessSec || { require_verification: false, access_type: 'public', password_protection: { enabled: false, password: '' } },
        draft_notifications: notifications || { on_start: false, on_complete: false, on_step_complete: false },
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
      setLastSavedWorkflowTitle(workflowTitle);
      setLastSavedWorkflowDescription(workflowDescription);
      setLastSavedWorkflowStatus(workflowStatus);
      setLastSavedBranding(branding);
      setLastSavedFlowBehavior(flowBehavior);
      setLastSavedAccessSecurity(accessSec);
      setLastSavedNotifications(notifications);
      markChangesSaved();
      toast.success('Workflow saved successfully');
      // Reload workflow record for publish diff
      const { data: workflow } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', params.workflowId)
        .single();
      setWorkflowRecord(workflow);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  }, [nodes, edges, params.workflowId, supabase, markChangesSaved, workflowTitle, workflowDescription, workflowStatus, branding, flowBehavior, accessSecurity, notifications]);

  const publishWorkflow = useCallback(async () => {
    try {
      let accessSec = accessSecurity;
      // Hash password if enabled and not already hashed
      if (accessSec.password_protection?.enabled && accessSec.password_protection.password) {
        if (!isSHA256(accessSec.password_protection.password)) {
          accessSec = {
            ...accessSec,
            password_protection: {
              ...accessSec.password_protection,
              password: await hashString(accessSec.password_protection.password)
            }
          };
        }
      }
      // Copy all draft_* columns to published_* columns and set status to 'published'
      const workflowData = {
        published_name: workflowTitle || 'Untitled Workflow',
        published_description: workflowDescription || '',
        published_status: 'published',
        published_steps: nodes || [],
        published_connections: edges || [],
        published_branding: mergeBranding(branding),
        published_flow_behavior: flowBehavior || { allow_back_navigation: true, show_progress_indicator: true, save_progress: false, completion_deadline: null },
        published_access_security: accessSec || { require_verification: false, access_type: 'public', password_protection: { enabled: false, password: '' } },
        published_notifications: notifications || { on_start: false, on_complete: false, on_step_complete: false },
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('workflows')
        .update(workflowData)
        .eq('id', params.workflowId);
      if (error) {
        console.error('Error publishing workflow:', error);
        toast.error('Failed to publish workflow');
        return;
      }
      setWorkflowStatus('published');
      toast.success('Workflow published successfully');
      const link = typeof window !== 'undefined' ? `${window.location.origin}/onboard/${params.workflowId}` : '';
      setPublishLink(link);
      setShowPublishDialog(true);
      // Reload workflow record for publish diff
      const { data: workflow } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', params.workflowId)
        .single();
      setWorkflowRecord(workflow);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  }, [params.workflowId, supabase, workflowTitle, workflowDescription, nodes, edges, branding, flowBehavior, accessSecurity, notifications]);

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
        hasUnsavedChanges: true,
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
          hasUnsavedChanges: true,
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
          hasUnsavedChanges: true,
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

  // On tab switch to settings, reset local state to last saved values
  useEffect(() => {
    if (activeView === 'settings') {
      setWorkflowTitle(lastSavedWorkflowTitle);
      setWorkflowDescription(lastSavedWorkflowDescription);
      setWorkflowStatus(lastSavedWorkflowStatus);
      setBranding(lastSavedBranding);
      setFlowBehavior(lastSavedFlowBehavior);
      setAccessSecurity(lastSavedAccessSecurity);
      setNotifications(lastSavedNotifications);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const handleBrandingChange = (update: (prev: typeof branding) => typeof branding) => {
    setBranding(prev => {
      const newBranding = update(prev);
      // Deep compare with lastSavedBranding
      const isEqual = JSON.stringify(newBranding) === JSON.stringify(lastSavedBranding);
      useWorkflowStore.setState({ hasUnsavedChanges: !isEqual });
      return newBranding;
    });
  };

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
                  variant={canPublish ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      setShowPublishNeedsSaveDialog(true);
                    } else {
                      publishWorkflow();
                    }
                  }}
                  disabled={!canPublish && !hasUnsavedChanges}
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
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors relative",
              "hover:text-foreground/80",
              "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
              "after:transition-colors",
              activeView === 'share' ? (
                "text-foreground after:bg-primary"
              ) : (
                "text-muted-foreground after:bg-transparent"
              )
            )}
            onClick={() => setActiveView('share')}
          >
            Share
          </button>
        </div>
      </div>
      <div className="flex-1 flex">
        {activeView === 'builder' && (
          <BuilderView
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
            flowRef={flowRef}
            handleNodeClick={handleNodeClick}
            setSelectedNodeId={setSelectedNodeId}
            selectedNode={selectedNode}
            handleAddClick={handleAddClick}
          />
        )}
        {activeView === 'settings' && (
          <SettingsView
            workflowTitle={workflowTitle}
            setWorkflowTitle={setWorkflowTitle}
            lastSavedWorkflowTitle={lastSavedWorkflowTitle}
            updateWorkflowTitle={updateWorkflowTitle}
            workflowDescription={workflowDescription}
            setWorkflowDescription={setWorkflowDescription}
            lastSavedWorkflowDescription={lastSavedWorkflowDescription}
            workflowStatus={workflowStatus}
            setWorkflowStatus={setWorkflowStatus}
            lastSavedWorkflowStatus={lastSavedWorkflowStatus}
            branding={branding}
            setBranding={setBranding}
            lastSavedBranding={lastSavedBranding}
            flowBehavior={flowBehavior}
            setFlowBehavior={setFlowBehavior}
            lastSavedFlowBehavior={lastSavedFlowBehavior}
            accessSecurity={accessSecurity}
            setAccessSecurity={setAccessSecurity}
            lastSavedAccessSecurity={lastSavedAccessSecurity}
            notifications={notifications}
            setNotifications={setNotifications}
            lastSavedNotifications={lastSavedNotifications}
            useWorkflowStore={useWorkflowStore}
            handleBrandingChange={handleBrandingChange}
            defaultBranding={defaultBranding}
            params={params}
            createClient={createClient}
            toast={toast}
            FileUpload={FileUpload}
            ColorField={ColorField}
            Label={Label}
            Input={Input}
            Textarea={Textarea}
            RadioGroup={RadioGroup}
            RadioGroupItem={RadioGroupItem}
            Switch={Switch}
            Select={Select}
            SelectTrigger={SelectTrigger}
            SelectValue={SelectValue}
            SelectContent={SelectContent}
            SelectItem={SelectItem}
            Accordion={Accordion}
            AccordionItem={AccordionItem}
            AccordionTrigger={AccordionTrigger}
            AccordionContent={AccordionContent}
            Settings={Settings}
            Palette={Palette}
            GitBranch={GitBranch}
            Shield={Shield}
            Bell={Bell}
            Image={Image}
            cn={cn}
          />
        )}
        {activeView === 'style' && (
          <StyleView
            branding={branding}
            handleBrandingChange={handleBrandingChange}
            defaultBranding={defaultBranding}
            nodes={nodes}
            FileUpload={FileUpload}
            ColorField={ColorField}
            Image={Image}
            StepRenderer={StepRenderer}
            Accordion={Accordion}
            AccordionItem={AccordionItem}
            AccordionTrigger={AccordionTrigger}
            AccordionContent={AccordionContent}
            params={params}
            toast={toast}
          />
        )}
        {activeView === 'share' && (
          <ShareView
            workflowStatus={workflowStatus}
            publishLink={publishLink}
          />
        )}
      </div>
    </div>
  );
} 
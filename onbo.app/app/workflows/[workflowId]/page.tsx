'use client';

import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { nodeTypes } from '@/components/workflow/node-types';
import { toast } from 'sonner';

export default function WorkflowBuilder() {
  const params = useParams();
  const supabase = createClient();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();

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

      useWorkflowStore.setState({
        nodes: workflow.steps || [],
        edges: workflow.connections || [],
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  }, [params.workflowId, supabase]);

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

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  return (
    <div className="h-screen w-full">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm">
        <Link
          href="/workflows"
          className="inline-flex items-center text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to workflows</span>
        </Link>
        <Button onClick={saveWorkflow}>
          <Save className="w-4 h-4 mr-2" />
          Save Workflow
        </Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
} 
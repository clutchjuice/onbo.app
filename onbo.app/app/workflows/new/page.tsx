'use client';

import { Card } from "@/components/ui/card";
import { ArrowRight, Wand2, FileCode, Layout, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function NewWorkflow() {
  const router = useRouter();
  const supabase = createClient();
  const [isCreating, setIsCreating] = useState(false);

  const createWorkflow = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      // Get the user's current workspace
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Please sign in to create a workflow');
        router.push('/login');
        return;
      }

      // Get user's active workspace
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('active_workspace')
        .eq('id', user.id)
        .single();

      if (userDataError) {
        console.error('Error fetching workspace data:', userDataError);
        toast.error('Failed to access your workspace. Please try again.');
        return;
      }
      
      if (!userData?.active_workspace) {
        toast.error('No active workspace found. Please create or select a workspace first.');
        router.push('/workspaces');  // Redirect to workspace selection
        return;
      }

      // Create the workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          workspace_id: userData.active_workspace,
          name: 'Untitled Workflow',
          description: 'A new workflow',
          user_id: user.id,
          steps: [],
          connections: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (workflowError) {
        console.error('Error creating workflow:', workflowError);
        toast.error('Failed to create workflow');
        return;
      }

      if (!workflow) {
        toast.error('Failed to create workflow');
        return;
      }

      // Redirect to the workflow builder
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/workflows" 
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to workflows</span>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Create a new workflow</h1>
        <p className="text-muted-foreground mb-8">How would you like to get started?</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create from scratch */}
          <button 
            onClick={createWorkflow} 
            disabled={isCreating}
            className="text-left"
          >
            <Card className="p-6 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer h-full">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  {isCreating ? (
                    <>
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground mt-2">Setting up your workflow...</span>
                    </>
                  ) : (
                    <Layout className="w-12 h-12 text-primary" />
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-2">Create from scratch</h2>
                <p className="text-muted-foreground text-sm flex-grow">
                  Start with a blank canvas and build your workflow step by step
                </p>
                <div className="flex items-center mt-4 text-primary">
                  <span className="text-sm">Get started</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Card>
          </button>

          {/* Create with AI */}
          <Link href="/workflows/ai/new">
            <Card className="p-6 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer h-full bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <Wand2 className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Create with AI</h2>
                <p className="text-muted-foreground text-sm flex-grow">
                  Describe your workflow and let AI generate it for you
                </p>
                <div className="flex items-center mt-4 text-primary">
                  <span className="text-sm">Try it out</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Create from template */}
          <Link href="/workflows/templates">
            <Card className="p-6 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer h-full">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <FileCode className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Use a template</h2>
                <p className="text-muted-foreground text-sm flex-grow">
                  Choose from our library of pre-built workflow templates
                </p>
                <div className="flex items-center mt-4 text-primary">
                  <span className="text-sm">Browse templates</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
} 
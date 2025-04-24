'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  useEffect(() => {
    // Hide the main content immediately
    setIsVerified(false);

    async function verifyAccess() {
      try {
        // Get the user's current session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.replace('/login');
          return;
        }

        // Get user's active workspace
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('active_workspace')
          .eq('id', user.id)
          .single();

        if (userDataError || !userData?.active_workspace) {
          router.replace('/workspaces');
          return;
        }

        // Get the workflow and verify it exists and belongs to the workspace
        const { data: workflow, error: workflowError } = await supabase
          .from('workflows')
          .select('workspace_id')
          .eq('id', params.workflowId)
          .single();

        if (workflowError || !workflow) {
          toast.error('Workflow not found');
          router.replace('/workflows');
          return;
        }

        // Check if workflow belongs to the active workspace
        if (workflow.workspace_id !== userData.active_workspace) {
          toast.error('You do not have access to this workflow');
          router.replace('/dashboard');
          return;
        }

        // Check if user is a member of the workspace
        const { data: membership, error: membershipError } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', userData.active_workspace)
          .eq('user_id', user.id)
          .single();

        if (membershipError || !membership) {
          toast.error('You do not have access to this workflow');
          router.replace('/dashboard');
          return;
        }

        // If we get here, the user is verified
        setIsVerified(true);
      } catch (error) {
        console.error('Error verifying access:', error);
        router.replace('/dashboard');
      }
    }

    verifyAccess();
  }, [supabase, router, params.workflowId]);

  // Show loading state by default
  if (!isVerified) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only render the children (workflow builder) after verification
  return children;
} 
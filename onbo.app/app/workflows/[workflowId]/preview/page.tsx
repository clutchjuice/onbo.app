'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { PreviewController } from '@/components/workflow-preview/preview-controller';
import { PreviewLayout } from '@/components/workflow-preview/preview-layout';
import { toast } from 'sonner';

export default function WorkflowPreview() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [workflow, setWorkflow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkflow = async () => {
      try {
        const { data: workflow, error } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', params.workflowId)
          .single();

        if (error) {
          setError(error.message);
          toast.error('Failed to load workflow');
          return;
        }
        
        if (!workflow) {
          setError('Workflow not found');
          toast.error('Workflow not found');
          return;
        }

        setWorkflow(workflow);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load workflow';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflow();
  }, [params.workflowId, supabase]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Error Loading Workflow</h2>
          <p className="text-muted-foreground mt-2">{error || 'The workflow could not be loaded.'}</p>
          <button
            onClick={() => router.push('/workflows')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  return (
    <PreviewLayout>
      <PreviewController workflow={workflow} />
    </PreviewLayout>
  );
} 
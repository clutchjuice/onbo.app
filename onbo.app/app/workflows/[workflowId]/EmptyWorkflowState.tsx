import React from 'react';
import { PlusButton } from '@/components/workflow/plus-button';
import { useWorkflowStore } from '@/lib/stores/workflow-store';

export function EmptyWorkflowState() {
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
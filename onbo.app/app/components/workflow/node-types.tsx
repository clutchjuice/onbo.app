import { Handle, Position } from 'reactflow';
import { Type, Video, FormInput, MoreHorizontal, Plus, Upload, FileText, Calendar, Signature, CreditCard } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { cn } from '@/lib/utils';

const baseNodeStyles = 'min-w-[220px] rounded-lg border bg-card text-card-foreground shadow-sm relative';
const handleStyles = 'w-3 h-3 bg-primary border-2 border-background';
const headerHeight = '64px'; // Height of the title/logo section

// Move this to the top level so it's reusable
function useNodePosition(id: string) {
  const nodes = useWorkflowStore(state => state.nodes);
  const isFirst = nodes[0]?.id === id;
  const isLast = nodes[nodes.length - 1]?.id === id;
  return { isFirst, isLast };
}

function StepBadge({ label }: { label: string }) {
  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
      {label}
    </div>
  );
}

// Add color mapping for different node types
const nodeColorMap: Record<string, string> = {
  Text: "text-blue-500 dark:text-blue-400",
  Video: "text-purple-500 dark:text-purple-400",
  Form: "text-green-500 dark:text-green-400",
  "File Upload": "text-orange-500 dark:text-orange-400",
  Contract: "text-rose-500 dark:text-rose-400",
  Calendar: "text-cyan-500 dark:text-cyan-400",
  Document: "text-amber-500 dark:text-amber-400",
  Payment: "text-emerald-500 dark:text-emerald-400"
};

// Update NodeHeader to handle the badges directly
function NodeHeader({ icon: Icon, title, type, id }: { icon: any, title: string, type: string, id: string }) {
  const { isFirst, isLast } = useNodePosition(id);
  const iconColorClass = nodeColorMap[type] || "text-primary";
  
  return (
    <>
      {(isFirst || isLast) && (
        <StepBadge label={isFirst ? "First Step" : "Last Step"} />
      )}
      <div className="flex items-center gap-3 p-4 pt-2" style={{ height: headerHeight }}>
        <Icon className={cn("w-8 h-8 flex-shrink-0", iconColorClass)} />
        <div className="flex-1 min-w-0 pr-8">
          <span className="font-semibold text-base cursor-pointer truncate block" title={title}>
            {title}
          </span>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">{type}</div>
        </div>
      </div>
    </>
  );
} 
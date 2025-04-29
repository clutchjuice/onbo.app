'use client';

import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type TaskNodeData = {
  label: string;
  description?: string;
};

function TaskNode({ data }: { data: TaskNodeData }) {
  return (
    <Card className="min-w-[200px]">
      <Handle type="target" position={Position.Left} />
      <CardHeader>
        <CardTitle className="text-sm">{data.label}</CardTitle>
      </CardHeader>
      {data.description && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{data.description}</p>
        </CardContent>
      )}
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}

export default TaskNode; 
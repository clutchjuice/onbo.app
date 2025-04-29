import { Handle, Position } from 'reactflow';
import { Type, Video, FormInput } from 'lucide-react';

const baseNodeStyles = `
  min-w-[180px] rounded-lg border bg-card text-card-foreground shadow-sm
`;

const handleStyles = `
  w-3 h-3 bg-primary border-2 border-background
`;

export function TextNode({ data }: { data: any }) {
  return (
    <div className={baseNodeStyles}>
      <Handle type="target" position={Position.Left} className={handleStyles} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Type className="w-4 h-4" />
          <h3 className="font-medium">{data.title || 'Text Display'}</h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {data.content || 'No content yet'}
        </p>
      </div>
      <Handle type="source" position={Position.Right} className={handleStyles} />
    </div>
  );
}

export function VideoNode({ data }: { data: any }) {
  return (
    <div className={baseNodeStyles}>
      <Handle type="target" position={Position.Left} className={handleStyles} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-4 h-4" />
          <h3 className="font-medium">{data.title || 'Video'}</h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {data.description || 'No description yet'}
        </p>
      </div>
      <Handle type="source" position={Position.Right} className={handleStyles} />
    </div>
  );
}

export function FormNode({ data }: { data: any }) {
  return (
    <div className={baseNodeStyles}>
      <Handle type="target" position={Position.Left} className={handleStyles} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <FormInput className="w-4 h-4" />
          <h3 className="font-medium">{data.title || 'Form'}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.fields?.length} field{data.fields?.length !== 1 ? 's' : ''}
        </p>
      </div>
      <Handle type="source" position={Position.Right} className={handleStyles} />
    </div>
  );
}

export const nodeTypes = {
  text: TextNode,
  video: VideoNode,
  form: FormNode,
}; 
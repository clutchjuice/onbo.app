import { Handle, Position } from 'reactflow';
import { Type, Video, FormInput, MoreHorizontal, Plus } from 'lucide-react';
import { useState, useRef } from 'react';
import { useWorkflowStore } from '@/lib/stores/workflow-store';

const baseNodeStyles = 'min-w-[220px] rounded-lg border bg-card text-card-foreground shadow-sm relative';
const handleStyles = 'w-3 h-3 bg-primary border-2 border-background';

function NodeMenu({ nodeId }: { nodeId: string }) {
  const [open, setOpen] = useState(false);
  const { nodes, edges } = useWorkflowStore();

  const handleDelete = () => {
    // Remove the node
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    
    // Remove any connected edges
    const updatedEdges = edges.filter(
      e => e.source !== nodeId && e.target !== nodeId
    );

    // Update the store
    useWorkflowStore.setState({
      nodes: updatedNodes,
      edges: updatedEdges,
    });

    setOpen(false);
  };

  return (
    <div className="absolute top-2 right-2 z-10">
      <button
        className="p-1 rounded hover:bg-muted focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        tabIndex={-1}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-20">
          <button 
            className="block w-full text-left px-4 py-2 hover:bg-muted text-sm text-red-600 hover:text-red-700"
            onClick={handleDelete}
          >
            Delete
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-muted text-sm">Move</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-muted text-sm">Duplicate</button>
        </div>
      )}
    </div>
  );
}

function AddNodeButton({ nodeId }: { nodeId: string }) {
  const { edges } = useWorkflowStore();

  // Check if this node has any outgoing connections
  const hasOutgoingEdges = edges.some(edge => edge.source === nodeId);

  if (hasOutgoingEdges) {
    return null;
  }

  return (
    <div 
      className="absolute right-0 top-1/2 -translate-y-1/2"
      style={{ right: '-100px' }}
    >
      {/* Line connecting to the plus button */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[60px] h-[2px] bg-border"
        style={{ left: '-60px' }}
      />
      <button
        className="w-8 h-8 rounded-full bg-background hover:bg-accent flex items-center justify-center 
                   border-2 border-border shadow-sm hover:shadow transition-all group relative"
        onClick={() => {
          const workflow = useWorkflowStore.getState();
          workflow.setShowStepPicker(true);
          workflow.setInsertIndex(workflow.nodes.findIndex(n => n.id === nodeId) + 1);
        }}
      >
        <Plus className="w-4 h-4 text-foreground group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}

function EditableTitle({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    setEditing(false);
    if (temp.trim() && temp !== value) {
      onChange(temp.trim());
    } else {
      setTemp(value);
    }
  };

  return editing ? (
    <input
      ref={inputRef}
      className="font-semibold text-base bg-transparent border-b border-muted focus:outline-none w-full"
      value={temp}
      onChange={e => setTemp(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => {
        if (e.key === 'Enter') inputRef.current?.blur();
        if (e.key === 'Escape') { setTemp(value); setEditing(false); }
      }}
      autoFocus
    />
  ) : (
    <span
      className="font-semibold text-base cursor-pointer"
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value}
    </span>
  );
}

export function TextNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  const [title, setTitle] = useState(data.title || 'Text Display');
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle type="target" position={Position.Left} className={handleStyles} />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <div className="p-4 pt-2">
        <div className="flex items-center gap-3">
          <Type className="w-8 h-8 text-primary" />
          <div className="flex-1 min-w-0">
            <EditableTitle value={title} onChange={setTitle} />
            <div className="text-xs text-muted-foreground font-medium mt-0.5">Text</div>
          </div>
        </div>
        {data.content && (
          <>
            <div className="h-px bg-border my-3" />
            <p className="text-sm text-muted-foreground line-clamp-2">
              {data.content}
            </p>
          </>
        )}
      </div>
      <Handle type="source" position={Position.Right} className={handleStyles} />
    </div>
  );
}

export function VideoNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  const [title, setTitle] = useState(data.title || 'Video');
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle type="target" position={Position.Left} className={handleStyles} />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <div className="p-4 pt-2">
        <div className="flex items-center gap-3">
          <Video className="w-8 h-8 text-primary" />
          <div className="flex-1 min-w-0">
            <EditableTitle value={title} onChange={setTitle} />
            <div className="text-xs text-muted-foreground font-medium mt-0.5">Video</div>
          </div>
        </div>
        {data.description && (
          <>
            <div className="h-px bg-border my-3" />
            <p className="text-sm text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          </>
        )}
      </div>
      <Handle type="source" position={Position.Right} className={handleStyles} />
    </div>
  );
}

export function FormNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  const [title, setTitle] = useState(data.title || 'Form');
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle type="target" position={Position.Left} className={handleStyles} />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <div className="p-4 pt-2">
        <div className="flex items-center gap-3">
          <FormInput className="w-8 h-8 text-primary" />
          <div className="flex-1 min-w-0">
            <EditableTitle value={title} onChange={setTitle} />
            <div className="text-xs text-muted-foreground font-medium mt-0.5">Form</div>
          </div>
        </div>
        {data.fields?.length > 0 && (
          <>
            <div className="h-px bg-border my-3" />
            <p className="text-sm text-muted-foreground">
              {data.fields.length} field{data.fields.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
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
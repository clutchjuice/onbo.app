import { Handle, Position } from 'reactflow';
import { Type, Video, FormInput, MoreHorizontal, Plus, Upload, FileText, Calendar, MessageSquare, Signature } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useWorkflowStore } from '@/lib/stores/workflow-store';

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
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-muted/50 text-muted-foreground rounded-md text-xs font-medium whitespace-nowrap z-10">
      {label}
    </div>
  );
}

function DeleteConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm,
  nodeTitle 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  nodeTitle: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background border rounded-lg shadow-lg p-6 w-[400px] space-y-4">
        <h3 className="text-lg font-semibold">Delete Step</h3>
        <p className="text-muted-foreground">
          Are you sure you want to delete "{nodeTitle}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md hover:bg-muted text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function NodeMenu({ nodeId }: { nodeId: string }) {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { nodes, edges } = useWorkflowStore();

  // Get the node title for the confirmation dialog
  const nodeTitle = nodes.find(n => n.id === nodeId)?.data?.title || 'this step';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the menu and the button
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    // Add the event listener to the document
    document.addEventListener('click', handleClickOutside, true);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  const handleDelete = () => {
    // Find the node's position in the workflow
    const nodeIndex = nodes.findIndex(n => n.id === nodeId);
    const prevNode = nodeIndex > 0 ? nodes[nodeIndex - 1] : null;
    const nextNode = nodeIndex < nodes.length - 1 ? nodes[nodeIndex + 1] : null;
    
    // Remove the node
    const updatedNodes = nodes.filter(n => n.id !== nodeId);

    // Reposition remaining nodes to maintain consistent spacing
    const nodeSpacing = 400; // Standard spacing between nodes
    updatedNodes.forEach((node, index) => {
      if (index >= nodeIndex) {
        node.position = {
          ...node.position,
          x: (index > 0 ? updatedNodes[index - 1].position.x : 0) + nodeSpacing
        };
      }
    });
    
    // Remove any connected edges
    let updatedEdges = edges.filter(
      e => e.source !== nodeId && e.target !== nodeId
    );

    // If this was a middle node, create a new edge connecting the previous and next nodes
    if (prevNode && nextNode) {
      updatedEdges.push({
        id: `${prevNode.id}-${nextNode.id}`,
        source: prevNode.id,
        target: nextNode.id,
        type: 'custom',
        data: { onAdd: () => {
          const workflow = useWorkflowStore.getState();
          workflow.setShowStepPicker(true);
          workflow.setInsertIndex(nodeIndex);
        }}
      });
    }

    // Update the store
    useWorkflowStore.setState({
      nodes: updatedNodes,
      edges: updatedEdges,
      selectedNodeId: null, // Clear selection when deleting a node
      hasUnsavedChanges: true // Mark as unsaved when deleting a node
    });

    setOpen(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };

  return (
    <>
      <div className="absolute top-2 right-2 z-10 pl-2">
        <button
          ref={buttonRef}
          className="p-1 rounded hover:bg-muted focus:outline-none"
          onClick={toggleMenu}
          tabIndex={-1}
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
        {open && (
          <div ref={menuRef} className="absolute right-0 mt-2 w-32 bg-background border rounded-md shadow-md z-20">
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-muted text-sm text-red-600 hover:text-red-700 rounded-t-md"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
                setOpen(false);
              }}
            >
              Delete
            </button>
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-muted text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              Move
            </button>
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-muted text-sm rounded-b-md"
              onClick={(e) => e.stopPropagation()}
            >
              Duplicate
            </button>
          </div>
        )}
      </div>
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        nodeTitle={nodeTitle}
      />
    </>
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
      className="absolute right-0"
      style={{ 
        right: '-100px',
        top: parseInt(headerHeight) / 2,
        transform: 'translateY(-50%)'
      }}
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

// Update NodeHeader to handle the badges directly
function NodeHeader({ icon: Icon, title, type, id }: { icon: any, title: string, type: string, id: string }) {
  const { isFirst, isLast } = useNodePosition(id);
  return (
    <>
      {(isFirst || isLast) && (
        <StepBadge label={isFirst ? "First Step" : "Last Step"} />
      )}
      <div className="flex items-center gap-3 p-4 pt-2" style={{ height: headerHeight }}>
        <Icon className="w-8 h-8 text-primary flex-shrink-0" />
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

// Update each node to use the new header component and handle positioning
export function TextNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <NodeHeader 
        icon={Type} 
        title={data.title || 'Text Display'} 
        type="Text"
        id={id}
      />
      {(data.header || data.subheader) && (
        <div className="px-4 pb-4">
          <div className="h-px bg-border mb-3" />
          <div className="text-sm text-muted-foreground space-y-1">
            {data.header && (
              <div className="flex items-center gap-2">
                <span className="font-medium flex-shrink-0">Header:</span>
                <span className="truncate">{data.header}</span>
              </div>
            )}
            {data.subheader && (
              <div className="flex items-center gap-2">
                <span className="font-medium flex-shrink-0">Subheader:</span>
                <span className="truncate">{data.subheader}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
    </div>
  );
}

export function VideoNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle type="target" position={Position.Left} className={handleStyles} />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <NodeHeader icon={Video} title={data.title || 'Video'} type="Video" id={id} />
      {data.description && (
        <>
          <div className="h-px bg-border my-3" />
          <p className="text-sm text-muted-foreground truncate">
            {data.description}
          </p>
        </>
      )}
      <Handle type="source" position={Position.Right} className={handleStyles} />
    </div>
  );
}

export function FormNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <NodeHeader 
        icon={FormInput} 
        title={data.title || 'Form'} 
        type="Form"
        id={id}
      />
      {data.fields?.length > 0 && (
        <div className="px-4 pb-4">
          <div className="h-px bg-border mb-3" />
          <div className="text-sm text-muted-foreground space-y-1">
            {data.fields.map((field: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="truncate">{field.label || 'Untitled'}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">(
                  {field.type === 'text' && 'Single Line'}
                  {field.type === 'textarea' && 'Paragraph'}
                  {field.type === 'number' && 'Number'}
                  {field.type === 'dropdown' && 'Dropdown'}
                )</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
    </div>
  );
}

export function FileUploadNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <NodeHeader 
        icon={Upload} 
        title={data.title || 'File Upload'} 
        type="File Upload"
        id={id}
      />
      {(data.maxFiles || data.allowedTypes) && (
        <div className="px-4 pb-4">
          <div className="h-px bg-border mb-3" />
          <div className="text-sm text-muted-foreground space-y-1">
            {data.maxFiles && (
              <div className="flex items-center gap-2">
                <span className="font-medium flex-shrink-0">Max Files:</span>
                <span className="truncate">{data.maxFiles}</span>
              </div>
            )}
            {data.allowedTypes && (
              <div className="flex items-center gap-2">
                <span className="font-medium flex-shrink-0">Allowed Types:</span>
                <span className="truncate">{data.allowedTypes}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
    </div>
  );
}

export function ContractNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <NodeHeader 
        icon={Signature} 
        title={data.title || 'Contract Signing'} 
        type="Contract"
        id={id}
      />
      {data.documentName && (
        <div className="px-4 pb-4">
          <div className="h-px bg-border mb-3" />
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium flex-shrink-0">Document:</span>
              <span className="truncate">{data.documentName}</span>
            </div>
          </div>
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
    </div>
  );
}

export function SchedulingNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <NodeHeader 
        icon={Calendar} 
        title={data.title || 'Scheduling'} 
        type="Calendar"
        id={id}
      />
      {data.embedCode && (
        <div className="px-4 pb-4">
          <div className="h-px bg-border mb-3" />
          <div className="text-sm text-muted-foreground truncate">
            Calendar embed code added
          </div>
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
    </div>
  );
}

export function FeedbackNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <NodeHeader 
        icon={MessageSquare} 
        title={data.title || 'Feedback Form'} 
        type="Feedback"
        id={id}
      />
      {data.description && (
        <div className="px-4 pb-4">
          <div className="h-px bg-border mb-3" />
          <p className="text-sm text-muted-foreground truncate">
            {data.description}
          </p>
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
    </div>
  );
}

export function DocumentNode({ data, id, selected }: { data: any, id: string, selected?: boolean }) {
  return (
    <div className={baseNodeStyles + (selected ? ' ring-2 ring-primary' : '')}>
      <Handle 
        type="target" 
        position={Position.Left} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
      <NodeMenu nodeId={id} />
      <AddNodeButton nodeId={id} />
      <NodeHeader 
        icon={FileText} 
        title={data.title || 'Document'} 
        type="Document"
        id={id}
      />
      {(data.documentName || data.documentType) && (
        <div className="px-4 pb-4">
          <div className="h-px bg-border mb-3" />
          <div className="text-sm text-muted-foreground space-y-1">
            {data.documentName && (
              <div className="flex items-center gap-2">
                <span className="font-medium flex-shrink-0">Document:</span>
                <span className="truncate">{data.documentName}</span>
              </div>
            )}
            {data.documentType && (
              <div className="flex items-center gap-2">
                <span className="font-medium flex-shrink-0">Type:</span>
                <span className="truncate">{data.documentType}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        className={handleStyles}
        style={{ top: parseInt(headerHeight) / 2 }}
      />
    </div>
  );
}

export const nodeTypes = {
  text: TextNode,
  video: VideoNode,
  form: FormNode,
  file_upload: FileUploadNode,
  contract_esign: ContractNode,
  scheduling: SchedulingNode,
  feedback: FeedbackNode,
  document_embed: DocumentNode,
}; 
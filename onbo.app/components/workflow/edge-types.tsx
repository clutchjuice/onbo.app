import { BaseEdge, EdgeProps, getStraightPath } from 'reactflow';
import { Plus } from 'lucide-react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  // Calculate the total distance between nodes
  const distance = targetX - sourceX;
  
  // For connected edges, we want to extend them to 140px
  // We'll adjust the source and target X coordinates to achieve this
  const adjustedSourceX = sourceX + ((distance - 140) / 2);
  const adjustedTargetX = targetX - ((distance - 140) / 2);

  const [edgePath, centerX, centerY] = getStraightPath({
    sourceX: adjustedSourceX,
    sourceY,
    targetX: adjustedTargetX,
    targetY,
  });

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onAdd) {
      data.onAdd();
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <foreignObject
        width={40}
        height={40}
        x={centerX - 20}
        y={centerY - 20}
        className="overflow-visible"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center w-full h-full">
          <div
            onClick={handleAddClick}
            className="w-8 h-8 rounded-full bg-background hover:bg-accent flex items-center justify-center 
                     border-2 border-border shadow-sm hover:shadow transition-all group cursor-pointer
                     hover:scale-110 hover:border-border/80"
          >
            <Plus className="w-4 h-4 text-foreground group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </foreignObject>
    </>
  );
}

export const edgeTypes = {
  custom: CustomEdge,
}; 
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlusButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

const sizeClasses = {
  sm: 'w-6 h-6',
  default: 'w-8 h-8',
  lg: 'w-10 h-10'
};

const iconSizeClasses = {
  sm: 'w-3 h-3',
  default: 'w-4 h-4',
  lg: 'w-5 h-5'
};

export function PlusButton({ onClick, className, size = 'default' }: PlusButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        sizeClasses[size],
        "rounded-full bg-background hover:bg-accent flex items-center justify-center",
        "border-2 border-border shadow-sm hover:shadow transition-all group",
        className
      )}
    >
      <Plus 
        className={cn(
          iconSizeClasses[size],
          "text-foreground group-hover:scale-110 transition-transform"
        )} 
      />
    </button>
  );
} 
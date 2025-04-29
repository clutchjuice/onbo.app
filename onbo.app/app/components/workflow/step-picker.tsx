import { useState, useEffect } from 'react';
import { Plus, Type, Video, FormInput } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface StepTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  default_config: any;
}

interface StepPickerProps {
  onStepSelect: (template: StepTemplate) => void;
}

export function StepPicker({ onStepSelect }: StepPickerProps) {
  const [templates, setTemplates] = useState<StepTemplate[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadTemplates();
  }, []);

  // Load templates when component mounts
  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('step_templates')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading templates:', error);
      return;
    }

    setTemplates(data || []);
  };

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'Type':
        return <Type className="w-6 h-6" />;
      case 'Video':
        return <Video className="w-6 h-6" />;
      case 'FormInput':
        return <FormInput className="w-6 h-6" />;
      default:
        return <Plus className="w-6 h-6" />;
    }
  };

  return (
    <div className="grid gap-4 py-4">
      {templates.map((template, index) => (
        <button
          key={template.id}
          className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-all duration-300 ease-in-out text-left transform hover:scale-[1.02] focus:scale-[1.02]"
          onClick={() => onStepSelect(template)}
          style={{
            opacity: 0,
            animation: `fadeSlideIn 500ms ease-out forwards ${index * 100}ms`
          }}
        >
          {getStepIcon(template.icon)}
          <div>
            <h3 className="font-medium transition-colors duration-300">{template.name}</h3>
            <p className="text-sm text-muted-foreground transition-colors duration-300">{template.description}</p>
          </div>
        </button>
      ))}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
} 
import { useState, useEffect } from 'react';
import {
  Plus,
  Type,
  Video,
  FormInput,
  Signature,
  Calendar,
  FileText,
  MessageSquare,
  CreditCard
} from 'lucide-react';
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

// Color mapping for different step types - all using the same blue color
const iconColorMap: Record<string, { color: string; bgColor: string }> = {
  text: {
    color: '#1260cc',
    bgColor: '#1260cc10'
  },
  video: {
    color: '#1260cc',
    bgColor: '#1260cc10'
  },
  form: {
    color: '#1260cc',
    bgColor: '#1260cc10'
  },
  contract_esign: {
    color: '#1260cc',
    bgColor: '#1260cc10'
  },
  scheduling: {
    color: '#1260cc',
    bgColor: '#1260cc10'
  },
  document_embed: {
    color: '#1260cc',
    bgColor: '#1260cc10'
  },
  payment: {
    color: '#1260cc',
    bgColor: '#1260cc10'
  }
};

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

  const getStepIcon = (iconName: string, type: string) => {
    const colors = iconColorMap[type] || { color: '#1260cc', bgColor: '#1260cc10' };
    const iconStyle = {
      width: '24px',
      height: '24px',
      color: colors.color
    };

    const containerStyle = {
      width: '48px',
      height: '48px',
      backgroundColor: colors.bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '12px'
    };

    switch (iconName) {
      case 'Type':
        return <div style={containerStyle}><Type style={iconStyle} /></div>;
      case 'Video':
        return <div style={containerStyle}><Video style={iconStyle} /></div>;
      case 'FormInput':
        return <div style={containerStyle}><FormInput style={iconStyle} /></div>;
      case 'signature':
        return <div style={containerStyle}><Signature style={iconStyle} /></div>;
      case 'calendar':
        return <div style={containerStyle}><Calendar style={iconStyle} /></div>;
      case 'file-text':
        return <div style={containerStyle}><FileText style={iconStyle} /></div>;
      case 'survey':
        return <div style={containerStyle}><MessageSquare style={iconStyle} /></div>;
      case 'credit-card':
        return <div style={containerStyle}><CreditCard style={iconStyle} /></div>;
      default:
        return <div style={containerStyle}><Plus style={iconStyle} /></div>;
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
          {getStepIcon(template.icon, template.type)}
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
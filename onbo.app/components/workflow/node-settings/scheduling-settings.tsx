import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface SchedulingSettingsProps {
  data: {
    title: string;
    header: string;
    description: string;
    embedCode: string;
  };
  onChange: (data: any) => void;
}

export function SchedulingSettings({ data, onChange }: SchedulingSettingsProps) {
  const [formData, setFormData] = useState({
    title: data.title || 'Scheduling',
    header: data.header || '',
    description: data.description || '',
    embedCode: data.embedCode || '',
  });

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Step Name</Label>
        <Input
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter step name"
        />
      </div>

      <div className="space-y-2">
        <Label>Header</Label>
        <Input
          value={formData.header}
          onChange={(e) => handleChange('header', e.target.value)}
          placeholder="Enter header text"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter description text"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Calendar Embed Code</Label>
        <Textarea
          value={formData.embedCode}
          onChange={(e) => handleChange('embedCode', e.target.value)}
          placeholder="Paste your calendar embed code here (e.g. from Calendly)"
          className="min-h-[200px] font-mono text-sm"
        />
      </div>
    </div>
  );
} 
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface SchedulingSettingsProps {
  data: {
    title: string;
    embedCode: string;
  };
  onChange: (data: any) => void;
}

export function SchedulingSettings({ data, onChange }: SchedulingSettingsProps) {
  const [title, setTitle] = useState(data.title || 'Schedule Meeting');
  const [embedCode, setEmbedCode] = useState(data.embedCode || '');

  const handleSave = () => {
    onChange({
      ...data,
      title,
      embedCode,
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
        />
      </div>
      <div className="space-y-2">
        <Label>Calendar Embed Code</Label>
        <Textarea
          value={embedCode}
          onChange={(e) => setEmbedCode(e.target.value)}
          placeholder="Paste your calendar embed code here (e.g. from Calendly)"
          className="min-h-[200px] font-mono text-sm"
        />
      </div>
      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );
} 
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface TextSettingsProps {
  data: {
    title: string;
    header: string;
    subheader: string;
    auto_advance?: {
      enabled: boolean;
      duration: number;
    };
  };
  onChange: (data: any) => void;
}

export function TextSettings({ data, onChange }: TextSettingsProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleAutoAdvanceChange = (enabled: boolean) => {
    onChange({
      ...data,
      auto_advance: {
        enabled,
        duration: data.auto_advance?.duration || 5
      }
    });
  };

  const handleDurationChange = (duration: string) => {
    onChange({
      ...data,
      auto_advance: {
        enabled: data.auto_advance?.enabled || false,
        duration: parseInt(duration) || 5
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Step Name</Label>
        <Input
          value={data.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Text Display"
        />
      </div>
      <div className="space-y-2">
        <Label>Header</Label>
        <Textarea
          value={data.header || ''}
          onChange={(e) => handleChange('header', e.target.value)}
          placeholder="Enter header text..."
          className="resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label>Subheader</Label>
        <Textarea
          value={data.subheader || ''}
          onChange={(e) => handleChange('subheader', e.target.value)}
          placeholder="Enter subheader text..."
          className="resize-none"
        />
      </div>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto Advance</Label>
            <p className="text-sm text-muted-foreground">Automatically advance to next step</p>
          </div>
          <Switch
            checked={data.auto_advance?.enabled || false}
            onCheckedChange={handleAutoAdvanceChange}
          />
        </div>
        {data.auto_advance?.enabled && (
          <div className="space-y-2">
            <Label>Duration (seconds)</Label>
            <Input
              type="number"
              min="1"
              value={data.auto_advance?.duration || 5}
              onChange={(e) => handleDurationChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
} 
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface ContractSettingsProps {
  data: {
    label: string;
    documentName?: string;
    documentContent?: string;
    requireSignature?: boolean;
    requireInitials?: boolean;
    requireDate?: boolean;
    allowDownload?: boolean;
  };
  onChange: (data: any) => void;
}

export function ContractSettings({ data, onChange }: ContractSettingsProps) {
  const [formData, setFormData] = useState({
    label: data.label || 'Sign the contract',
    documentName: data.documentName || '',
    documentContent: data.documentContent || '',
    requireSignature: data.requireSignature !== false, // default to true
    requireInitials: data.requireInitials || false,
    requireDate: data.requireDate !== false, // default to true
    allowDownload: data.allowDownload || false,
  });

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Label</Label>
        <Input
          value={formData.label}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Enter label text"
        />
      </div>

      <div className="space-y-2">
        <Label>Document Name</Label>
        <Input
          value={formData.documentName}
          onChange={(e) => handleChange('documentName', e.target.value)}
          placeholder="Enter document name"
        />
      </div>

      <div className="space-y-2">
        <Label>Document Content</Label>
        <Textarea
          value={formData.documentContent}
          onChange={(e) => handleChange('documentContent', e.target.value)}
          placeholder="Enter or paste document content"
          className="min-h-[200px] font-mono text-sm"
        />
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Signature</Label>
            <p className="text-sm text-muted-foreground">Require electronic signature</p>
          </div>
          <Switch
            checked={formData.requireSignature}
            onCheckedChange={(checked: boolean) => handleChange('requireSignature', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Initials</Label>
            <p className="text-sm text-muted-foreground">Require initials on each page</p>
          </div>
          <Switch
            checked={formData.requireInitials}
            onCheckedChange={(checked: boolean) => handleChange('requireInitials', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Date</Label>
            <p className="text-sm text-muted-foreground">Include date field with signature</p>
          </div>
          <Switch
            checked={formData.requireDate}
            onCheckedChange={(checked: boolean) => handleChange('requireDate', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow Download</Label>
            <p className="text-sm text-muted-foreground">Allow downloading the signed document</p>
          </div>
          <Switch
            checked={formData.allowDownload}
            onCheckedChange={(checked: boolean) => handleChange('allowDownload', checked)}
          />
        </div>
      </div>
    </div>
  );
} 
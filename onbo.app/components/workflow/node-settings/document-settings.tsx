import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, File, Link } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentSettingsProps {
  data: {
    title: string;
    header: string;
    description: string;
    fileUrl: string;
    embedLink: string;
    sourceType: 'upload' | 'embed' | 'url';
    fileName: string;
    allowDownload: boolean;
    requireView: boolean;
  };
  onChange: (data: any) => void;
}

export function DocumentSettings({ data, onChange }: DocumentSettingsProps) {
  const [formData, setFormData] = useState({
    title: data.title || 'Document',
    header: data.header || '',
    description: data.description || '',
    fileUrl: data.fileUrl || '',
    embedLink: data.embedLink || '',
    sourceType: data.sourceType || 'upload',
    fileName: data.fileName || '',
    allowDownload: data.allowDownload || false,
    requireView: data.requireView || false,
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Maximum file size is 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to your storage service
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();

      // Update form data
      handleChange('fileUrl', url);
      handleChange('fileName', file.name);
      
      toast.success('Your document has been uploaded');
    } catch (error) {
      toast.error('Upload failed. Please try again later.');
    } finally {
      setIsUploading(false);
    }
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
        <Input
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter description"
        />
      </div>

      <div className="space-y-2">
        <Label>Source Type</Label>
        <Select
          value={formData.sourceType}
          onValueChange={(value: 'upload' | 'embed' | 'url') => handleChange('sourceType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select source type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upload">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Upload PDF</span>
              </div>
            </SelectItem>
            <SelectItem value="embed">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4" />
                <span>Embed Link</span>
              </div>
            </SelectItem>
            <SelectItem value="url">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                <span>File URL</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.sourceType === 'upload' ? (
        <div className="space-y-2">
          <Label>Upload PDF</Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="w-full"
              disabled={isUploading}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : formData.fileName || 'Choose PDF'}
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Maximum file size: 10MB
          </p>
        </div>
      ) : formData.sourceType === 'url' ? (
        <div className="space-y-2">
          <Label>File URL</Label>
          <Input
            value={formData.fileUrl}
            onChange={(e) => handleChange('fileUrl', e.target.value)}
            placeholder="Enter document URL"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Embed Link</Label>
          <Input
            value={formData.embedLink}
            onChange={(e) => handleChange('embedLink', e.target.value)}
            placeholder="Enter embed link"
          />
        </div>
      )}

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow Download</Label>
            <p className="text-sm text-muted-foreground">Enable document download</p>
          </div>
          <Switch
            checked={formData.allowDownload}
            onCheckedChange={(checked: boolean) => handleChange('allowDownload', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require View</Label>
            <p className="text-sm text-muted-foreground">User must view document to continue</p>
          </div>
          <Switch
            checked={formData.requireView}
            onCheckedChange={(checked: boolean) => handleChange('requireView', checked)}
          />
        </div>
      </div>
    </div>
  );
} 
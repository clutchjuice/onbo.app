import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VideoSettingsProps {
  data: {
    title: string;
    header: string;
    autoplay: boolean;
    videoUrl: string;
    embedCode: string;
    sourceType: 'embed' | 'url';
    description: string;
  };
  onChange: (data: any) => void;
}

function getVideoEmbedCode(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }
      if (videoId) {
        return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      }
    }
    
    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) {
        return `<iframe src="https://player.vimeo.com/video/${videoId}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      }
    }

    // If no matching platform or invalid URL, return empty string
    return '';
  } catch (error) {
    return '';
  }
}

export function VideoSettings({ data, onChange }: VideoSettingsProps) {
  const [formData, setFormData] = useState({
    title: data.title || 'Video',
    header: data.header || '',
    autoplay: data.autoplay || false,
    videoUrl: data.videoUrl || '',
    embedCode: data.embedCode || '',
    sourceType: data.sourceType || 'embed',
    description: data.description || '',
  });

  // Auto-generate embed code when URL changes
  useEffect(() => {
    if (formData.sourceType === 'url' && formData.videoUrl) {
      const embedCode = getVideoEmbedCode(formData.videoUrl);
      if (embedCode) {
        setFormData(prev => ({
          ...prev,
          embedCode
        }));
        onChange({
          ...formData,
          embedCode
        });
      }
    }
  }, [formData.videoUrl, formData.sourceType]);

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
          placeholder="Enter video description"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Source Type</Label>
        <Select
          value={formData.sourceType}
          onValueChange={(value: 'embed' | 'url') => handleChange('sourceType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select source type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">Video URL</SelectItem>
            <SelectItem value="embed">Custom Embed Code</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.sourceType === 'url' ? (
        <div className="space-y-2">
          <Label>Video URL</Label>
          <Input
            value={formData.videoUrl}
            onChange={(e) => handleChange('videoUrl', e.target.value)}
            placeholder="Enter YouTube or Vimeo URL"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Supports YouTube and Vimeo URLs
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Embed Code</Label>
          <Textarea
            value={formData.embedCode}
            onChange={(e) => handleChange('embedCode', e.target.value)}
            placeholder="Paste custom embed code here"
            className="min-h-[100px] font-mono text-sm"
          />
        </div>
      )}

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Autoplay</Label>
            <p className="text-sm text-muted-foreground">Start playing automatically</p>
          </div>
          <Switch
            checked={formData.autoplay}
            onCheckedChange={(checked: boolean) => handleChange('autoplay', checked)}
          />
        </div>
      </div>
    </div>
  );
} 
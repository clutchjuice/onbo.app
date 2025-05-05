import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, FormInput, ChevronDown, GripVertical, X } from 'lucide-react';
import { IconSelect } from '@/components/ui/icon-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { Badge } from '@/components/ui/badge';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'date' | 'checkbox' | 'select' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: {
    value: string;
    label: string;
    subtext?: string;
    icon?: string;
  }[];
  allowedTypes?: string; // For file upload
  maxFileSize?: number; // For file upload in MB
  allowMultiple?: boolean; // For file upload
  displayStyle?: 'default' | 'grid-card' | 'list-card' | 'radio';
}

interface FormSettingsProps {
  data: {
    title: string;
    header: string;
    description: string;
    fields: FormField[];
    submitButtonText: string;
  };
  onChange: (data: any) => void;
}

export function FormSettings({ data, onChange }: FormSettingsProps) {
  const [formData, setFormData] = useState({
    title: data.title || '',
    header: data.header || '',
    description: data.description || '',
    fields: data.fields || [],
    submitButtonText: data.submitButtonText || '',
  });
  const { setHasUnsavedChanges } = useWorkflowStore();

  useEffect(() => {
    // Update local state when data prop changes
    setFormData({
      title: data.title || '',
      header: data.header || '',
      description: data.description || '',
      fields: data.fields || [],
      submitButtonText: data.submitButtonText || '',
    });
  }, [data]);

  const [openFields, setOpenFields] = useState<string[]>([]);

  const toggleField = (fieldId: string) => {
    setOpenFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
    setHasUnsavedChanges(true);
  };

  const handleFieldChange = (index: number, field: string, value: any) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], [field]: value };
    handleChange('fields', newFields);
  };

  const handleOptionChange = (fieldIndex: number, optionIndex: number, field: string, value: any) => {
    const newFields = [...formData.fields];
    if (!newFields[fieldIndex].options) {
      newFields[fieldIndex].options = [];
    }
    newFields[fieldIndex].options![optionIndex] = {
      ...newFields[fieldIndex].options![optionIndex],
      [field]: value
    };
    handleChange('fields', newFields);
  };

  const addField = () => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      label: '',
      placeholder: '',
      required: false
    };
    handleChange('fields', [...formData.fields, newField]);
  };

  const removeField = (index: number) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    handleChange('fields', newFields);
  };

  const addOption = (fieldIndex: number) => {
    const newFields = [...formData.fields];
    if (!newFields[fieldIndex].options) {
      newFields[fieldIndex].options = [];
    }
    newFields[fieldIndex].options!.push({
      value: '',
      label: '',
      subtext: '',
      icon: ''
    });
    handleChange('fields', newFields);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const newFields = [...formData.fields];
    newFields[fieldIndex].options = newFields[fieldIndex].options!.filter((_, i) => i !== optionIndex);
    handleChange('fields', newFields);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <ScrollArea className="flex-1 -mr-4 pr-4">
        <div className="space-y-8">
          {/* Basic Settings Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <FormInput className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Form Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Step Name</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter step name"
                />
                <p className="text-sm text-muted-foreground">
                  This name will be displayed in the workflow sidebar
                </p>
              </div>

              <div className="space-y-2">
                <Label>Form Header</Label>
                <Input
                  value={formData.header}
                  onChange={(e) => handleChange('header', e.target.value)}
                  placeholder="Enter form header"
                />
                <p className="text-sm text-muted-foreground">
                  This will be shown as the main heading of your form
                </p>
              </div>

              <div className="space-y-2">
                <Label>Form Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter form description"
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  This description will be shown below the form header
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Form Fields</h2>
              <p className="text-sm text-muted-foreground">
                {formData.fields.length} field{formData.fields.length !== 1 ? 's' : ''} added
              </p>
            </div>

            <div className="space-y-4">
              {formData.fields.map((field, fieldIndex) => (
                <Collapsible
                  key={field.id}
                  open={openFields.includes(field.id)}
                  onOpenChange={() => toggleField(field.id)}
                  className={cn(
                    "border rounded-lg transition-all duration-200",
                    "hover:shadow-md hover:border-primary/20",
                    openFields.includes(field.id) ? "bg-muted/30" : "bg-background"
                  )}
                >
                  <div className="flex items-center">
                    <CollapsibleTrigger className="flex items-center flex-1 p-4 text-left">
                      <div className="flex items-center gap-3">
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                            openFields.includes(field.id) ? "transform rotate-180" : ""
                          )}
                        />
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.label || 'Untitled Field'}</span>
                            {field.required && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Required</span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                            {field.type === 'select' && field.displayStyle && field.displayStyle !== 'default' && 
                              ` (${field.displayStyle === 'grid-card' ? 'Grid' : field.displayStyle === 'list-card' ? 'List' : 'Radio'} Style)`}
                          </span>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(fieldIndex)}
                      className="h-8 w-8 mr-4 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <CollapsibleContent>
                    <div className="p-4 pt-2 space-y-4 border-t">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => handleFieldChange(fieldIndex, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="textarea">Text Area</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="tel">Phone</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                              <SelectItem value="file">File Upload</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => handleFieldChange(fieldIndex, 'label', e.target.value)}
                            placeholder="Enter field label"
                          />
                          <p className="text-sm text-muted-foreground">
                            This label will be shown above the field
                          </p>
                        </div>

                        {field.type !== 'checkbox' && field.type !== 'select' && field.type !== 'date' && field.type !== 'file' && (
                          <div className="space-y-2">
                            <Label>Placeholder</Label>
                            <Input
                              value={field.placeholder}
                              onChange={(e) => handleFieldChange(fieldIndex, 'placeholder', e.target.value)}
                              placeholder="Enter field placeholder"
                            />
                            <p className="text-sm text-muted-foreground">
                              Text shown when the field is empty
                            </p>
                          </div>
                        )}

                        {field.type === 'select' && (
                          <>
                            <div className="space-y-4 border-t pt-4">
                              <div className="flex items-center justify-between">
                                <Label>Display Style</Label>
                                <Select
                                  value={field.displayStyle || 'default'}
                                  onValueChange={(value) => handleFieldChange(fieldIndex, 'displayStyle', value)}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">Default Dropdown</SelectItem>
                                    <SelectItem value="grid-card">Grid Cards</SelectItem>
                                    <SelectItem value="list-card">List Cards</SelectItem>
                                    <SelectItem value="radio">Radio Buttons</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {field.displayStyle === 'default' ? 'Standard dropdown select menu' :
                                 field.displayStyle === 'radio' ? 'Simple radio button selection' :
                                 'Visual selection with icons and descriptions'}
                              </p>
                            </div>

                            <div className="space-y-4 border-t pt-4">
                              <div className="flex items-center justify-between">
                                <Label>Options</Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(fieldIndex)}
                                  className="gap-1.5"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add Option
                                </Button>
                              </div>
                              <div className="space-y-3">
                                {field.options?.map((option, optionIndex) => (
                                  <div 
                                    key={optionIndex} 
                                    className={cn(
                                      "space-y-3 border rounded-lg p-3",
                                      "hover:border-primary/20"
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm text-muted-foreground">Option {optionIndex + 1}</Label>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeOption(fieldIndex, optionIndex)}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <div className="space-y-3">
                                      <div>
                                        <Input
                                          value={option.label}
                                          onChange={(e) => handleOptionChange(fieldIndex, optionIndex, 'label', e.target.value)}
                                          placeholder="Enter option label"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          The text shown to the user
                                        </p>
                                      </div>
                                      <div>
                                        <Input
                                          value={option.value}
                                          onChange={(e) => handleOptionChange(fieldIndex, optionIndex, 'value', e.target.value)}
                                          placeholder="Enter option value"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          The value stored when this option is selected
                                        </p>
                                      </div>
                                      <div>
                                        <Input
                                          value={option.subtext || ''}
                                          onChange={(e) => handleOptionChange(fieldIndex, optionIndex, 'subtext', e.target.value)}
                                          placeholder="Enter option description (optional)"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Additional description shown below the option
                                        </p>
                                      </div>
                                      {(field.displayStyle === 'grid-card' || field.displayStyle === 'list-card') && (
                                        <div>
                                          <IconSelect
                                            value={option.icon || ''}
                                            onChange={(value) => handleOptionChange(fieldIndex, optionIndex, 'icon', value)}
                                          />
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Icon shown with the option
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {field.type === 'file' && (
                          <>
                            <div className="space-y-2">
                              <Label>Allowed File Types</Label>
                              <Input
                                value={field.allowedTypes}
                                onChange={(e) => handleFieldChange(fieldIndex, 'allowedTypes', e.target.value)}
                                placeholder=".pdf, .docx, .png"
                              />
                              <p className="text-xs text-muted-foreground">
                                Comma-separated list of file extensions (e.g. .pdf, .docx, .png)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>Max File Size (MB)</Label>
                              <Input
                                type="number"
                                value={field.maxFileSize}
                                onChange={(e) => handleFieldChange(fieldIndex, 'maxFileSize', parseInt(e.target.value))}
                                min={1}
                                max={100}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>Allow Multiple Files</Label>
                                <p className="text-sm text-muted-foreground">
                                  Enable uploading multiple files at once
                                </p>
                              </div>
                              <Switch
                                checked={field.allowMultiple}
                                onCheckedChange={(checked) => handleFieldChange(fieldIndex, 'allowMultiple', checked)}
                              />
                            </div>
                          </>
                        )}

                        <div className="flex items-center justify-between border-t pt-4">
                          <Label htmlFor={`required-${field.id}`}>Required Field</Label>
                          <Switch
                            id={`required-${field.id}`}
                            checked={field.required}
                            onCheckedChange={(checked) => handleFieldChange(fieldIndex, 'required', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Add Field Button */}
      <div className="mt-4">
        <Button
          variant="outline"
          onClick={addField}
          className="w-full h-12 text-base gap-2 border-dashed hover:border-primary hover:bg-primary/5"
        >
          <Plus className="h-5 w-5" />
          Add New Field
        </Button>
      </div>
    </div>
  );
} 
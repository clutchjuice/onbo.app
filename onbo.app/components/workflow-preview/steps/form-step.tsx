import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'number' | 'select' | 'checkbox' | 'tel' | 'date' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: {
    value: string;
    label: string;
    subtext?: string;
    icon?: string;
  }[];
  displayStyle?: 'default' | 'grid-card' | 'list-card' | 'radio';
  allowedTypes?: string;
  maxFileSize?: number;
  allowMultiple?: boolean;
}

interface FormStepConfig {
  header?: string;
  description?: string;
  fields: FormField[];
}

interface FormStepProps {
  config: FormStepConfig;
  onComplete: (response: Record<string, any>) => void;
  response?: Record<string, any>;
}

export function FormStep({ config, onComplete, response }: FormStepProps) {
  const [formData, setFormData] = useState<Record<string, any>>(response || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Ensure config has default values
  const safeConfig = {
    header: config?.header,
    description: config?.description,
    fields: config?.fields || [],
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    safeConfig.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.id];
        let isEmpty = false;

        // Special handling for different field types
        if (field.type === 'checkbox') {
          isEmpty = value === undefined;
        } else if (field.type === 'select' && (field.displayStyle === 'grid-card' || field.displayStyle === 'list-card')) {
          isEmpty = !value || value === '';
        } else {
          isEmpty = value === undefined || value === null || value === '';
        }
        
        if (isEmpty) {
          if (field.type === 'select' && (field.displayStyle === 'grid-card' || field.displayStyle === 'list-card')) {
            newErrors[field.id] = 'Please select an option';
          } else {
            newErrors[field.id] = 'This field is required';
          }
        }
      }
    });
    return newErrors;
  };

  // Handle form submission attempt
  useEffect(() => {
    const handleFormSubmitAttempt = () => {
      setIsSubmitted(true);
      const newErrors = validateForm();
      setErrors(newErrors);
      
      // If no errors, complete the form
      if (Object.keys(newErrors).length === 0) {
        onComplete(formData);
      }
    };

    window.addEventListener('formSubmitAttempt', handleFormSubmitAttempt);
    return () => {
      window.removeEventListener('formSubmitAttempt', handleFormSubmitAttempt);
    };
  }, [formData, onComplete]);

  const handleChange = (fieldId: string, value: any) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }));
    
    // Ensure we're not setting undefined for checkboxes
    if (value === undefined && safeConfig.fields.find(f => f.id === fieldId)?.type === 'checkbox') {
      value = false;
    }
    
    const newFormData = {
      ...formData,
      [fieldId]: value
    };
    
    setFormData(newFormData);

    // If the form was previously submitted, validate again
    if (isSubmitted) {
      const newErrors = validateForm();
      setErrors(newErrors);
      
      // If no errors after change, update the parent
      if (Object.keys(newErrors).length === 0) {
        onComplete(newFormData);
      }
    }
  };

  const shouldShowError = (fieldId: string) => {
    return (touched[fieldId] || isSubmitted) && errors[fieldId];
  };

  const renderField = (field: FormField) => {
    if (!field) return null;

    const showError = shouldShowError(field.id);
    const errorMessage = errors[field.id];

    switch (field.type) {
      case 'file':
        return (
          <FileUpload
            value={formData[field.id] || null}
            onChange={files => handleChange(field.id, files)}
            error={showError ? errorMessage : undefined}
            allowedTypes={field.allowedTypes}
            maxFileSize={field.maxFileSize}
            allowMultiple={field.allowMultiple}
            required={field.required}
            className="bg-white dark:bg-slate-950 shadow-sm"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={e => handleChange(field.id, e.target.value)}
            className={cn(
              "bg-white dark:bg-slate-950 shadow-sm border-2 min-h-[120px]",
              "hover:shadow-md hover:border-primary transition-all duration-200",
              "focus-visible:ring-1 focus-visible:ring-primary",
              showError ? 'border-destructive' : 'border-input'
            )}
          />
        );

      case 'select':
        if ((field.displayStyle === 'grid-card' || field.displayStyle === 'list-card') && field.options) {
          return (
            <RadioGroup
              value={formData[field.id] || ''}
              onValueChange={value => handleChange(field.id, value)}
              className={cn(
                field.displayStyle === 'grid-card' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "flex flex-col gap-3"
              )}
            >
              {field.options.map((option, index) => {
                const IconComponent = option.icon ? 
                  (Icons[option.icon as keyof typeof Icons] as React.ComponentType<any>) : 
                  null;

                return (
                  <div key={index} className="relative group">
                    <RadioGroupItem
                      value={option.value}
                      id={`${field.id}-${index}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`${field.id}-${index}`}
                      className={cn(
                        "flex items-center border-2 bg-white dark:bg-slate-950 shadow-sm",
                        "hover:shadow-md hover:scale-[1.02] hover:border-primary",
                        "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                        "cursor-pointer transition-all duration-200",
                        field.displayStyle === 'grid-card' 
                          ? "flex-col justify-center rounded-xl p-6 text-center"
                          : "gap-6 rounded-lg p-4",
                        showError ? 'border-destructive' : 'border-input'
                      )}
                    >
                      {IconComponent && (
                        <div className={cn(
                          "transition-transform duration-200",
                          field.displayStyle === 'grid-card' 
                            ? "mb-4"
                            : ""
                        )}>
                          <IconComponent className={cn(
                            "text-muted-foreground group-hover:text-primary transition-colors duration-200",
                            field.displayStyle === 'grid-card' ? "h-12 w-12" : "h-10 w-10"
                          )} />
                        </div>
                      )}
                      <div className={cn(
                        field.displayStyle === 'grid-card' 
                          ? "text-center space-y-2"
                          : "flex-1"
                      )}>
                        <div className="font-semibold text-lg">{option.label}</div>
                        {option.subtext && (
                          <div className="text-sm text-muted-foreground">
                            {option.subtext}
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          );
        } else if (field.displayStyle === 'radio' && field.options) {
          return (
            <RadioGroup
              value={formData[field.id] || ''}
              onValueChange={value => handleChange(field.id, value)}
              className="flex flex-col space-y-3"
            >
              {field.options.map((option, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={option.value}
                    id={`${field.id}-${index}`}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`${field.id}-${index}`}
                      className="text-base font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    {option.subtext && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {option.subtext}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          );
        }

        return (
          <Select
            value={formData[field.id] || '_placeholder'}
            onValueChange={value => handleChange(field.id, value === '_placeholder' ? '' : value)}
          >
            <SelectTrigger 
              className={cn(
                "bg-white dark:bg-slate-950 shadow-sm border-2",
                "hover:shadow-md hover:border-primary transition-all duration-200",
                showError ? 'border-destructive' : 'border-input'
              )}
            >
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_placeholder">
                {field.placeholder || 'Select an option'}
              </SelectItem>
              {(field.options || []).map((option, index) => (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={formData[field.id] || false}
              onCheckedChange={checked => handleChange(field.id, checked)}
            />
            <label
              htmlFor={field.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.label}
            </label>
          </div>
        );

      default:
        return (
          <Input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={e => handleChange(field.id, e.target.value)}
            className={cn(
              "bg-white dark:bg-slate-950 shadow-sm border-2",
              "hover:shadow-md hover:border-primary transition-all duration-200",
              "focus-visible:ring-1 focus-visible:ring-primary",
              showError ? 'border-destructive' : 'border-input'
            )}
          />
        );
    }
  };

  // If no fields are configured, show an error message
  if (!safeConfig.fields.length) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
        <h3 className="font-semibold">Invalid Form Configuration</h3>
        <p className="mt-1 text-sm">
          No form fields have been configured for this step.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      {safeConfig.header && (
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {safeConfig.header}
          </h2>
          {safeConfig.description && (
            <p className="text-muted-foreground text-lg">
              {safeConfig.description}
            </p>
          )}
        </div>
      )}

      <div className="space-y-6">
        {safeConfig.fields.map(field => (
          <div key={field.id} className="space-y-3">
            {field.type !== 'checkbox' && (
              <Label htmlFor={field.id} className="text-base font-medium">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}
            <div className="relative">
              {renderField(field)}
              {shouldShowError(field.id) && (
                <p className="absolute -bottom-6 left-0 text-sm text-destructive flex items-center gap-1.5">
                  <svg
                    viewBox="0 0 16 16"
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z"/>
                  </svg>
                  {errors[field.id]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
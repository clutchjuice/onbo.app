import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ContractStepConfig {
  title?: string;
  description?: string;
  contract_text: string;
  require_full_name?: boolean;
  require_email?: boolean;
  require_date?: boolean;
}

interface ContractStepProps {
  config: ContractStepConfig;
  onComplete: (response: {
    signed: boolean;
    full_name?: string;
    email?: string;
    signed_date?: string;
  }) => void;
  response?: {
    signed: boolean;
    full_name?: string;
    email?: string;
    signed_date?: string;
  };
}

export function ContractStep({ config, onComplete, response }: ContractStepProps) {
  const [formData, setFormData] = useState({
    full_name: response?.full_name || '',
    email: response?.email || '',
    signed_date: response?.signed_date || new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (config.require_full_name && !formData.full_name) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (config.require_email && !formData.email) {
      newErrors.email = 'Email is required';
    } else if (
      config.require_email &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = 'Invalid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onComplete({
      signed: true,
      ...formData
    });
  };

  return (
    <div className="space-y-6 py-8">
      {config.title && (
        <h2 className="text-2xl font-semibold tracking-tight">
          {config.title}
        </h2>
      )}
      
      {config.description && (
        <p className="text-muted-foreground mb-6">
          {config.description}
        </p>
      )}

      <div className="bg-muted p-6 rounded-lg mb-6">
        <div className="prose dark:prose-invert max-w-none">
          {config.contract_text}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {config.require_full_name && (
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className={errors.full_name ? 'border-red-500' : ''}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name}</p>
            )}
          </div>
        )}

        {config.require_email && (
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
        )}

        {config.require_date && (
          <div className="space-y-2">
            <Label htmlFor="signed_date">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="signed_date"
              type="date"
              value={formData.signed_date}
              onChange={e => setFormData(prev => ({ ...prev, signed_date: e.target.value }))}
              className={errors.signed_date ? 'border-red-500' : ''}
            />
            {errors.signed_date && (
              <p className="text-sm text-red-500">{errors.signed_date}</p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full">
          Sign Contract
        </Button>
      </form>
    </div>
  );
} 
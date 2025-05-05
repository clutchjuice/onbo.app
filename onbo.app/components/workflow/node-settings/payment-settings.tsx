import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentSettingsProps {
  data: {
    title: string;
    header: string;
    description: string;
    payment_link: string;
    button_text: string;
    success_message: string;
  };
  onChange: (data: any) => void;
}

export function PaymentSettings({ data, onChange }: PaymentSettingsProps) {
  const [formData, setFormData] = useState({
    title: data.title || 'Payment',
    header: data.header || '',
    description: data.description || '',
    payment_link: data.payment_link || '',
    button_text: data.button_text || 'Pay Now',
    success_message: data.success_message || 'Thank you for your payment!',
  });

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const currencies = [
    'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'
  ];

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
          placeholder="Enter payment description"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Stripe Payment Link</Label>
        <Input
          value={formData.payment_link}
          onChange={(e) => handleChange('payment_link', e.target.value)}
          placeholder="https://buy.stripe.com/..."
        />
        <p className="text-sm text-muted-foreground mt-1">
          Paste your Stripe payment link here
        </p>
      </div>

      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          value={formData.button_text}
          onChange={(e) => handleChange('button_text', e.target.value)}
          placeholder="Pay Now"
        />
      </div>

      <div className="space-y-2">
        <Label>Success Message</Label>
        <Textarea
          value={formData.success_message}
          onChange={(e) => handleChange('success_message', e.target.value)}
          placeholder="Enter success message"
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
} 
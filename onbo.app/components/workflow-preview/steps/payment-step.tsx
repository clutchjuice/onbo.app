import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaymentStepConfig {
  header?: string;
  description?: string;
  payment_link: string;
  button_text: string;
  success_message?: string;
}

interface PaymentStepProps {
  config: PaymentStepConfig;
  onComplete: (response: { paid: boolean }) => void;
  response?: { paid: boolean };
}

export function PaymentStep({ config, onComplete, response }: PaymentStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Ensure config has default values
  const safeConfig = {
    header: config?.header,
    description: config?.description,
    payment_link: config?.payment_link || '',
    button_text: config?.button_text || 'Pay Now',
    success_message: config?.success_message || 'Payment Successful!',
  };

  const handlePayment = () => {
    // Open Stripe payment link in a new tab
    window.open(safeConfig.payment_link, '_blank');
    
    // In a real implementation, you would listen for the payment completion
    // For now, we'll just mark it as complete when they click
    onComplete({ paid: true });
  };

  if (response?.paid) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-card rounded-xl border shadow-sm p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold mb-4">
              {safeConfig.success_message}
            </h2>
            <p className="text-muted-foreground">
              Your payment has been processed successfully.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-card rounded-xl border shadow-sm p-8">
        {safeConfig.header && (
          <h2 className="text-3xl font-semibold tracking-tight text-center mb-4">
            {safeConfig.header}
          </h2>
        )}
        
        {safeConfig.description && (
          <p className="text-muted-foreground text-center text-lg mb-8">
            {safeConfig.description}
          </p>
        )}

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handlePayment}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "min-w-[240px] h-14 text-lg font-medium rounded-full",
              "transition-all duration-300 ease-in-out",
              "bg-gradient-to-r from-primary to-primary/90",
              "hover:scale-105 hover:shadow-lg",
              "active:scale-95",
              isHovered && "shadow-lg"
            )}
            disabled={isProcessing}
          >
            <span className="flex items-center gap-2">
              {safeConfig.button_text}
              <svg 
                className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isHovered ? "transform translate-x-1" : ""
                )} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secured by Stripe
          </div>
        </div>
      </div>
    </div>
  );
} 
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addDays, format, parse, isBefore, isAfter, setHours, setMinutes } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

interface SchedulingStepConfig {
  header?: string;
  description?: string;
  embedCode?: string;
}

interface SchedulingStepProps {
  config: SchedulingStepConfig;
  onComplete: (response: { scheduled: boolean }) => void;
  response?: { scheduled: boolean };
}

export function SchedulingStep({ config, onComplete, response }: SchedulingStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Extract iframe src from embed code if it exists
  const getIframeSrc = () => {
    if (!config.embedCode) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(config.embedCode, 'text/html');
    const iframe = doc.querySelector('iframe');
    return iframe?.src;
  };

  const iframeSrc = getIframeSrc();

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="space-y-6 py-8">
      {config.header && (
        <h2 className="text-2xl font-semibold tracking-tight">
          {config.header}
        </h2>
      )}
      
      {config.description && (
        <p className="text-muted-foreground">
          {config.description}
        </p>
      )}

      {config.embedCode ? (
        <div className="relative w-full min-h-[600px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {iframeSrc ? (
            <iframe
              src={iframeSrc}
              className="w-full h-full min-h-[600px] border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="camera; microphone; autoplay; encrypted-media; fullscreen; clipboard-write"
            />
          ) : (
            <div 
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: config.embedCode }}
            />
          )}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/30">
              <div className="text-center text-red-600 dark:text-red-400">
                <h3 className="font-semibold">Failed to Load Calendar</h3>
                <p className="mt-1 text-sm">
                  There was an error loading the calendar. Please check your embed code.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
          <h3 className="font-semibold">Calendar Not Configured</h3>
          <p className="mt-1 text-sm">
            No calendar embed code has been provided. Please add your calendar embed code in the step settings.
          </p>
        </div>
      )}
    </div>
  );
} 
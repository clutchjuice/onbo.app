import { useEffect, useState } from 'react';

interface TextStepConfig {
  header?: string;
  subheader?: string;
  auto_advance?: {
    enabled: boolean;
    duration: number;
  };
}

interface TextStepProps {
  config: TextStepConfig;
  onComplete: (response: { viewed: boolean }) => void;
  response?: { viewed: boolean };
}

export function TextStep({ config, onComplete, response }: TextStepProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(
    config.auto_advance?.enabled ? config.auto_advance.duration : null
  );

  useEffect(() => {
    // Mark as viewed immediately
    if (!response?.viewed) {
      onComplete({ viewed: true });
    }

    // Handle auto-advance if enabled
    if (config.auto_advance?.enabled && timeLeft !== null) {
      // Start countdown
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timer);
            // Dispatch auto-advance event after a small delay to ensure cleanup
            setTimeout(() => {
              window.dispatchEvent(new Event('autoAdvance'));
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [config.auto_advance, timeLeft, onComplete, response?.viewed]);

  // Reset timer when config changes
  useEffect(() => {
    if (config.auto_advance?.enabled) {
      setTimeLeft(config.auto_advance.duration);
    }
  }, [config.auto_advance]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 h-full flex flex-col items-center justify-center text-center">
      {config.header && (
        <h2 className="text-2xl font-semibold mb-4">{config.header}</h2>
      )}
      {config.subheader && (
        <p className="text-muted-foreground">{config.subheader}</p>
      )}
    </div>
  );
} 
import { useEffect, useRef, useState } from 'react';

interface VideoStepConfig {
  header?: string;
  description?: string;
  source_type: 'url' | 'embed';
  url?: string;
  embed_code?: string;
  require_completion?: boolean;
}

interface VideoStepProps {
  config: VideoStepConfig;
  onComplete: (response: { watched: boolean }) => void;
  response?: { watched: boolean };
}

export function VideoStep({ config, onComplete, response }: VideoStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!config.require_completion && !response?.watched) {
      onComplete({ watched: true });
    }
  }, [config.require_completion, onComplete, response?.watched]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);

      if (progress > 90 && !response?.watched) {
        onComplete({ watched: true });
      }
    }
  };

  if (config.source_type === 'embed' && config.embed_code) {
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
        <div className="relative w-full pb-[56.25%]">
          <div 
            className="absolute inset-0"
            dangerouslySetInnerHTML={{ 
              __html: config.embed_code.replace(
                /<iframe/g, 
                '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"'
              ) 
            }}
          />
        </div>
      </div>
    );
  }

  if (config.source_type === 'url' && config.url) {
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
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          <video
            ref={videoRef}
            src={config.url}
            className="w-full h-full"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
        {config.require_completion && !response?.watched && (
          <div className="text-sm text-muted-foreground">
            Please watch the video to continue
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
      <h3 className="font-semibold">Invalid Video Configuration</h3>
      <p className="mt-1 text-sm">
        The video source is not properly configured.
      </p>
    </div>
  );
} 
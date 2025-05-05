import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentStepConfig {
  title?: string;
  header?: string;
  description?: string;
  source_type: 'upload' | 'url' | 'embed';
  url?: string;
  embed_code?: string;
  require_view?: boolean;
  allow_download?: boolean;
}

interface DocumentStepProps {
  config: DocumentStepConfig;
  onComplete: (response: { viewed: boolean }) => void;
  response?: { viewed: boolean };
}

export function DocumentStep({ config, onComplete, response }: DocumentStepProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!config.require_view && !response?.viewed) {
      onComplete({ viewed: true });
    }
  }, [config.require_view, onComplete, response?.viewed]);

  const handleView = () => {
    if (!response?.viewed) {
      onComplete({ viewed: true });
    }
  };

  const isPDF = config.url?.toLowerCase().endsWith('.pdf') || 
                config.source_type === 'upload';

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className={cn(
        "bg-card rounded-xl border shadow-sm overflow-hidden",
        isFullscreen && "fixed inset-4 z-50"
      )}>
        {(config.header || config.description) && (
          <div className="p-6 border-b">
            {config.header && (
              <h2 className="text-2xl font-semibold tracking-tight">
                {config.header}
              </h2>
            )}
            
            {config.description && (
              <p className="text-muted-foreground mt-2">
                {config.description}
              </p>
            )}
          </div>
        )}

        <div className="relative">
          {/* Toolbar */}
          <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
            {config.allow_download && (config.url || config.source_type === 'upload') && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={() => window.open(config.url, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/80 backdrop-blur-sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
          </div>

          {/* Document Display */}
          <div className={cn(
            "w-full bg-slate-100 dark:bg-slate-800",
            isFullscreen ? "h-[calc(100vh-8rem)]" : "aspect-[4/3]"
          )}>
            {config.source_type === 'embed' && config.embed_code ? (
              <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: config.embed_code }}
                onLoad={handleView}
              />
            ) : (config.source_type === 'url' || config.source_type === 'upload') && config.url ? (
              isPDF ? (
                <iframe
                  src={`${config.url}#toolbar=0`}
                  className="w-full h-full"
                  onLoad={handleView}
                  title={config.header || 'Document Preview'}
                />
              ) : (
                <iframe
                  src={config.url}
                  className="w-full h-full"
                  onLoad={handleView}
                  title={config.header || 'Document Preview'}
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <h3 className="font-semibold text-red-600 dark:text-red-400">
                    Invalid Document Configuration
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The document source is not properly configured.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {config.require_view && !response?.viewed && (
          <div className="p-4 border-t bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              Please view the document to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
import React from 'react';

export function ShareView({
  workflowStatus,
  publishLink
}: {
  workflowStatus: 'draft' | 'published',
  publishLink: string
}) {
  return (
    <div className="flex-1 p-4 overflow-y-auto flex justify-center bg-slate-50 dark:bg-slate-900/30">
      <div className="w-[800px] max-w-full">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Share Workflow</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Share Settings */}
          <div className="flex-1 min-w-[320px] bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-4">Share Settings</h3>
            {workflowStatus !== 'published' ? (
              <div className="text-sm text-muted-foreground">
                You need to <span className="font-semibold text-primary">publish your workflow</span> before you can invite onboardees or share the link.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">Share Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={publishLink}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded bg-slate-50 dark:bg-slate-800 text-sm"
                    onFocus={e => e.target.select()}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(publishLink);
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
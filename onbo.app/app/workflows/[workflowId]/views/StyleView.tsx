import React from 'react';
import { createClient } from '@/utils/supabase/client';

export function StyleView({
  branding,
  handleBrandingChange,
  defaultBranding,
  nodes,
  FileUpload,
  ColorField,
  Image,
  StepRenderer,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  params,
  toast
}: any) {

  // Synchronous handler for FileUpload
  const handleLogoUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop();
      const filePath = `${params.workflowId}/logo.${ext}`;
      console.log('Uploading to:', filePath, 'File:', file);
      const supabase = createClient();
      (async () => {
        const { error } = await supabase.storage.from('workflow-logos').upload(filePath, file, { upsert: true });
        if (error) {
          console.error('Supabase upload error:', error.message);
          toast.error('Failed to upload logo: ' + error.message);
          return;
        }
        const { data: urlData } = supabase.storage.from('workflow-logos').getPublicUrl(filePath);
        if (urlData?.publicUrl) {
          handleBrandingChange((prev: any) => {
            const updated = { ...prev, logo_url: urlData.publicUrl };
            supabase
              .from('workflows')
              .update({ draft_branding: updated })
              .eq('id', params.workflowId)
              .then(({ error: dbError }) => {
                if (dbError) toast.error('Failed to save logo to workflow');
              });
            return updated;
          });
        }
      })();
    } else {
      // Remove logo
      handleBrandingChange((prev: any) => {
        const updated = { ...prev, logo_url: '' };
        const supabase = createClient();
        supabase
          .from('workflows')
          .update({ draft_branding: updated })
          .eq('id', params.workflowId)
          .then(({ error: dbError }) => {
            if (dbError) toast.error('Failed to remove logo from workflow');
          });
        return updated;
      });
    }
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto flex justify-center bg-slate-50 dark:bg-slate-900/30">
      <div className="w-[1200px] max-w-full">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Workflow Style</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Style Settings */}
          <div className="flex-1 min-w-[320px] bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-4">Style Settings</h3>
            <Accordion type="multiple" defaultValue={[]} className="mb-4">
              <AccordionItem value="logo">
                <AccordionTrigger>Logo</AccordionTrigger>
                <AccordionContent>
                  {branding.logo_url ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <img
                        src={branding.logo_url}
                        alt="Logo"
                        className="h-24 object-contain"
                        style={{ maxWidth: 160 }}
                      />
                      <button
                        type="button"
                        className="px-4 py-1.5 rounded bg-red-500 text-white text-sm font-medium shadow hover:bg-red-600 transition-colors"
                        onClick={() => handleLogoUpload(null)}
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <FileUpload
                      onChange={handleLogoUpload}
                      allowedTypes=".png,.jpg,.jpeg"
                      maxFileSize={5}
                      allowMultiple={false}
                      className="w-full"
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="colors">
                <AccordionTrigger>Color Settings</AccordionTrigger>
                <AccordionContent>
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      className="text-xs px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium shadow-sm transition-colors"
                      onClick={() => handleBrandingChange((prev: any) => ({ ...prev, ...defaultBranding }))}
                    >
                      Restore Default
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorField
                      label="Background"
                      value={branding.background || '#F6F6F6'}
                      defaultValue="#F6F6F6"
                      onChange={(val: string) => handleBrandingChange((prev: any) => ({ ...prev, background: val }))}
                      showReset={false}
                    />
                    <ColorField
                      label="Primary Text"
                      value={branding.primaryText || '#232A41'}
                      defaultValue="#232A41"
                      onChange={(val: string) => handleBrandingChange((prev: any) => ({ ...prev, primaryText: val }))}
                      showReset={false}
                    />
                    <ColorField
                      label="Secondary Text"
                      value={branding.secondaryText || '#5E777E'}
                      defaultValue="#5E777E"
                      onChange={(val: string) => handleBrandingChange((prev: any) => ({ ...prev, secondaryText: val }))}
                      showReset={false}
                    />
                    <ColorField
                      label="Button Color"
                      value={branding.buttonColor || '#E38C00'}
                      defaultValue="#E38C00"
                      onChange={(val: string) => handleBrandingChange((prev: any) => ({ ...prev, buttonColor: val }))}
                      showReset={false}
                    />
                    <ColorField
                      label="Accent"
                      value={branding.accent || '#E38C00'}
                      defaultValue="#E38C00"
                      onChange={(val: string) => handleBrandingChange((prev: any) => ({ ...prev, accent: val }))}
                      showReset={false}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="themes">
                <AccordionTrigger>Themes</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                      {
                        id: 'arpeggio',
                        name: 'Arpeggio',
                        price: '$99',
                        image: '/themes/arpeggio.jpg',
                      },
                      {
                        id: 'accio',
                        name: 'Accio',
                        price: '$49',
                        image: '/themes/accio.jpg',
                      },
                      {
                        id: 'remixicon',
                        name: 'RemixIcon',
                        price: 'Free',
                        image: '/themes/remixicon.jpg',
                      },
                      {
                        id: 'noir',
                        name: 'Noir',
                        price: '$29',
                        image: '/themes/noir.jpg',
                      },
                      {
                        id: 'pastel',
                        name: 'Pastel',
                        price: '$39',
                        image: '/themes/pastel.jpg',
                      },
                      {
                        id: 'neon',
                        name: 'Neon',
                        price: 'Free',
                        image: '/themes/neon.jpg',
                      },
                    ].map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        className={
                          'rounded-xl overflow-hidden shadow-md border-2 transition-all flex flex-col bg-background ' +
                          (branding.theme === theme.id
                            ? 'border-primary ring-2 ring-primary'
                            : 'border-transparent hover:border-primary/40 hover:shadow-lg')
                        }
                        onClick={() => handleBrandingChange((prev: any) => ({ ...prev, theme: theme.id }))}
                      >
                        <div className="relative w-full aspect-[16/9] bg-muted">
                          <Image
                            src={theme.image}
                            alt={theme.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <div className="font-semibold text-base mb-1">{theme.name}</div>
                          <div className="text-sm text-muted-foreground">{theme.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          {/* Right: Workflow Preview */}
          <div className="flex-1 min-w-[320px] bg-white dark:bg-slate-900 rounded-lg shadow-md p-8 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-4">Workflow Preview</h3>
            <div
              className="h-[500px] flex items-center justify-center text-muted-foreground relative"
              style={{
                background: branding.background || '#F6F6F6',
                color: branding.primaryText || '#232A41',
              }}
            >
              {nodes && nodes.length > 0 ? (
                <div
                  className="w-full h-full flex flex-col items-center justify-center"
                  style={{
                    background: branding.background || '#F6F6F6',
                    color: branding.primaryText || '#232A41',
                    borderRadius: 16,
                    boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                    padding: 32,
                    maxWidth: 420,
                    margin: '0 auto',
                  }}
                >
                  {branding.logo_url && (
                    <img
                      src={branding.logo_url}
                      alt="Logo"
                      className="h-12 mb-6 object-contain"
                      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
                    />
                  )}
                  <div className="w-full mb-8">
                    <StepRenderer
                      step={{ ...nodes[0], type: nodes[0].type || '' }}
                      onResponse={() => {}}
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 rounded-md font-semibold text-base shadow-sm transition-colors"
                    style={{
                      background: branding.buttonColor || branding.accent || '#E38C00',
                      color: '#fff',
                      border: 'none',
                    }}
                    disabled
                  >
                    Next
                  </button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">No steps to preview.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
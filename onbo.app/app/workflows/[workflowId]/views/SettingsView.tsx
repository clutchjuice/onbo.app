import React from 'react';

export function SettingsView({
  workflowTitle,
  setWorkflowTitle,
  lastSavedWorkflowTitle,
  updateWorkflowTitle,
  workflowDescription,
  setWorkflowDescription,
  lastSavedWorkflowDescription,
  workflowStatus,
  setWorkflowStatus,
  lastSavedWorkflowStatus,
  branding,
  setBranding,
  lastSavedBranding,
  flowBehavior,
  setFlowBehavior,
  lastSavedFlowBehavior,
  accessSecurity,
  setAccessSecurity,
  lastSavedAccessSecurity,
  notifications,
  setNotifications,
  lastSavedNotifications,
  useWorkflowStore,
  handleBrandingChange,
  defaultBranding,
  params,
  createClient,
  toast,
  FileUpload,
  ColorField,
  Label,
  Input,
  Textarea,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Settings,
  Palette,
  GitBranch,
  Shield,
  Bell,
  Image,
  cn
}: any) {
  return (
    <div className="flex-1 p-4 overflow-y-auto flex justify-center bg-slate-50 dark:bg-slate-900/30">
      <div className="w-[800px] max-w-full">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Workflow Settings</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
        </div>
        <Accordion 
          type="single" 
          collapsible 
          className="space-y-4"
          defaultValue="basic"
        >
          {/* Basic Settings */}
          <AccordionItem 
            value="basic" 
            className="border-0 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-shadow"
          >
            <AccordionTrigger className="px-6 text-base font-medium hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#1260cc10]">
                  <Settings className="w-4 h-4 text-[#1260cc]" />
                </div>
                Basic Settings
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Workflow Name</Label>
                  <Input
                    value={workflowTitle}
                    onChange={e => {
                      const newValue = e.target.value;
                      setWorkflowTitle(newValue);
                      if (newValue !== lastSavedWorkflowTitle) {
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      } else {
                        useWorkflowStore.setState({ hasUnsavedChanges: false });
                      }
                    }}
                    onBlur={() => updateWorkflowTitle(workflowTitle)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the purpose of this workflow..."
                    value={workflowDescription}
                    onChange={e => {
                      const newValue = e.target.value;
                      setWorkflowDescription(newValue);
                      if (newValue !== lastSavedWorkflowDescription) {
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      } else {
                        useWorkflowStore.setState({ hasUnsavedChanges: false });
                      }
                    }}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Workflow Status</Label>
                  <RadioGroup
                    value={workflowStatus}
                    onValueChange={(value: 'draft' | 'published') => {
                      if (value !== workflowStatus) {
                        setWorkflowStatus(value);
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      }
                    }}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="draft" id="status-draft" />
                      <Label htmlFor="status-draft">Draft</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="published" id="status-published" />
                      <Label htmlFor="status-published">Published</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Flow Behavior */}
          <AccordionItem 
            value="behavior" 
            className="border-0 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-shadow"
          >
            <AccordionTrigger className="px-6 text-base font-medium hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#1260cc10]">
                  <GitBranch className="w-4 h-4 text-[#1260cc]" />
                </div>
                Flow Behavior
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="space-y-0.5">
                    <Label>Allow Back Navigation</Label>
                    <p className="text-sm text-muted-foreground">Let users revisit earlier steps</p>
                  </div>
                  <Switch
                    checked={flowBehavior.allow_back_navigation}
                    onCheckedChange={(checked: boolean) => {
                      if (checked !== flowBehavior.allow_back_navigation) {
                        setFlowBehavior((prev: any) => ({ ...prev, allow_back_navigation: checked }));
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="space-y-0.5">
                    <Label>Progress Indicator</Label>
                    <p className="text-sm text-muted-foreground">Show completion progress</p>
                  </div>
                  <Switch
                    checked={flowBehavior.show_progress_indicator}
                    onCheckedChange={(checked: boolean) => {
                      if (checked !== flowBehavior.show_progress_indicator) {
                        setFlowBehavior((prev: any) => ({ ...prev, show_progress_indicator: checked }));
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="space-y-0.5">
                    <Label>Save Progress</Label>
                    <p className="text-sm text-muted-foreground">Allow users to save and resume later</p>
                  </div>
                  <Switch
                    checked={flowBehavior.save_progress}
                    onCheckedChange={(checked: boolean) => {
                      if (checked !== flowBehavior.save_progress) {
                        setFlowBehavior((prev: any) => ({ ...prev, save_progress: checked }));
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2 py-2 border-t">
                  <Label>Completion Deadline</Label>
                  <p className="text-sm text-muted-foreground mb-2">Set a deadline for workflow completion</p>
                  <Input
                    type="datetime-local"
                    value={flowBehavior.completion_deadline || ''}
                    onChange={e => {
                      const newValue = e.target.value;
                      setFlowBehavior((prev: any) => ({ ...prev, completion_deadline: newValue }));
                      if (newValue !== flowBehavior.completion_deadline) {
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      }
                    }}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Access & Security */}
          <AccordionItem 
            value="security" 
            className="border-0 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-shadow"
          >
            <AccordionTrigger className="px-6 text-base font-medium hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#1260cc10]">
                  <Shield className="w-4 h-4 text-[#1260cc]" />
                </div>
                Access & Security
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="space-y-0.5">
                    <Label>Require Login</Label>
                    <p className="text-sm text-muted-foreground">Users must verify their identity</p>
                  </div>
                  <Switch
                    checked={accessSecurity.require_verification}
                    onCheckedChange={(checked: boolean) => {
                      if (checked !== accessSecurity.require_verification) {
                        setAccessSecurity((prev: any) => ({ ...prev, require_verification: checked }));
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2 py-2 border-t">
                  <Label>Limit Access To</Label>
                  <Select
                    value={accessSecurity.access_type}
                    onValueChange={(value: string) => {
                      if (value !== accessSecurity.access_type) {
                        setAccessSecurity((prev: any) => ({ ...prev, access_type: value }));
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Anyone with the link</SelectItem>
                      <SelectItem value="invite_only">Invited users only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="py-2 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <div className="space-y-0.5">
                      <Label>Password Protection</Label>
                      <p className="text-sm text-muted-foreground">Require a password to access</p>
                    </div>
                    <Switch
                      checked={accessSecurity.password_protection.enabled}
                      onCheckedChange={(checked: boolean) => {
                        if (checked !== accessSecurity.password_protection.enabled) {
                          setAccessSecurity((prev: any) => ({
                            ...prev,
                            password_protection: {
                              ...prev.password_protection,
                              enabled: checked
                            }
                          }));
                          useWorkflowStore.setState({ hasUnsavedChanges: true });
                        }
                      }}
                    />
                  </div>
                  {accessSecurity.password_protection.enabled && (
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={accessSecurity.password_protection.password}
                      onChange={e => {
                        const newValue = e.target.value;
                        setAccessSecurity((prev: any) => ({
                          ...prev,
                          password_protection: {
                            ...prev.password_protection,
                            password: newValue
                          }
                        }));
                        if (newValue !== accessSecurity.password_protection.password) {
                          useWorkflowStore.setState({ hasUnsavedChanges: true });
                        }
                      }}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Notifications */}
          <AccordionItem 
            value="notifications" 
            className="border-0 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-shadow"
          >
            <AccordionTrigger className="px-6 text-base font-medium hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#1260cc10]">
                  <Bell className="w-4 h-4 text-[#1260cc]" />
                </div>
                Notifications
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="space-y-0.5">
                    <Label>On Workflow Start</Label>
                    <p className="text-sm text-muted-foreground">Send email when workflow starts</p>
                  </div>
                  <Switch
                    checked={notifications.on_start}
                    onCheckedChange={(checked: boolean) => {
                      if (checked !== notifications.on_start) {
                        setNotifications((prev: any) => ({ ...prev, on_start: checked }));
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="space-y-0.5">
                    <Label>On Workflow Complete</Label>
                    <p className="text-sm text-muted-foreground">Send email when workflow is completed</p>
                  </div>
                  <Switch
                    checked={notifications.on_complete}
                    onCheckedChange={(checked: boolean) => {
                      if (checked !== notifications.on_complete) {
                        setNotifications((prev: any) => ({ ...prev, on_complete: checked }));
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="space-y-0.5">
                    <Label>On Step Complete</Label>
                    <p className="text-sm text-muted-foreground">Send email when any step is completed</p>
                  </div>
                  <Switch
                    checked={notifications.on_step_complete}
                    onCheckedChange={(checked: boolean) => {
                      if (checked !== notifications.on_step_complete) {
                        setNotifications((prev: any) => ({ ...prev, on_step_complete: checked }));
                        useWorkflowStore.setState({ hasUnsavedChanges: true });
                      }
                    }}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
} 
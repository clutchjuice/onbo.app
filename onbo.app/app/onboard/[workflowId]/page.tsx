"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { PreviewController } from '@/components/workflow-preview/preview-controller';
import { PreviewLayout } from '@/components/workflow-preview/preview-layout';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Utility to hash a string using SHA-256
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function OnboardWorkflow() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [workflow, setWorkflow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'checking' | 'login' | 'password' | 'authenticated'>('checking');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const loadWorkflow = async () => {
      try {
        const { data: workflow, error } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', params.workflowId)
          .eq('status', 'published')
          .single();

        if (error) {
          setError(error.message);
          toast.error('Failed to load workflow');
          return;
        }
        
        if (!workflow) {
          setError('Workflow not found or not published');
          toast.error('Workflow not found or not published');
          return;
        }

        // Map published_* columns to the expected workflow shape for PreviewController
        setWorkflow({
          ...workflow,
          steps: workflow.published_steps || [],
          flow_behavior: workflow.published_flow_behavior || {},
          branding: workflow.published_branding || {},
          access_security: workflow.published_access_security || {},
          notifications: workflow.published_notifications || {},
          name: workflow.published_name || '',
          description: workflow.published_description || '',
          status: workflow.published_status || '',
          connections: workflow.published_connections || [],
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load workflow';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflow();
  }, [params.workflowId, supabase]);

  useEffect(() => {
    if (!workflow) return;
    // Check if require_login or password protection is enabled
    const access = workflow.access_security || {};
    if (access.require_verification) {
      setAuthState('login');
    } else if (access.password_protection?.enabled) {
      setAuthState('password');
    } else {
      setAuthState('authenticated');
    }
  }, [workflow]);

  // Onboardee login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    // Look up onboardee by email and workflow
    const { data: onboardee, error } = await supabase
      .from('onboardees')
      .select('*')
      .eq('email', loginEmail)
      .eq('workflow_id', params.workflowId)
      .single();
    if (error || !onboardee) {
      setLoginError('Invalid email or password');
      return;
    }
    // Compare password using SHA-256
    const inputHash = await hashString(loginPassword);
    if (inputHash !== onboardee.password_hash) {
      setLoginError('Invalid email or password');
      return;
    }
    // Store onboardee session (localStorage)
    localStorage.setItem(`onboardee_${params.workflowId}`, onboardee.id);
    setAuthState('authenticated');
  };

  // Password protection handler
  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    const hash = workflow.access_security?.password_protection?.password || '';
    const inputHash = await hashString(passwordInput);
    if (inputHash !== hash) {
      setPasswordError('Incorrect password');
      return;
    }
    localStorage.setItem(`workflow_pw_${params.workflowId}`, 'true');
    setAuthState('authenticated');
  };

  // Check session on mount
  useEffect(() => {
    if (!workflow) return;
    const access = workflow.access_security || {};
    if (access.require_verification) {
      const onboardeeId = localStorage.getItem(`onboardee_${params.workflowId}`);
      if (onboardeeId) setAuthState('authenticated');
    } else if (access.password_protection?.enabled) {
      const pwOk = localStorage.getItem(`workflow_pw_${params.workflowId}`);
      if (pwOk) setAuthState('authenticated');
    }
  }, [workflow, params.workflowId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Error Loading Workflow</h2>
          <p className="text-muted-foreground mt-2">{error || 'The workflow could not be loaded.'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Require login form
  if (authState === 'login') {
    return (
      <div className="h-screen flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
          <h2 className="text-lg font-semibold">Sign In to Onboarding</h2>
          <Input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            required
          />
          {loginError && <div className="text-red-500 text-sm">{loginError}</div>}
          <Button type="submit" className="w-full">Sign In</Button>
        </form>
      </div>
    );
  }

  // Password protection form
  if (authState === 'password') {
    return (
      <div className="h-screen flex items-center justify-center">
        <form onSubmit={handlePassword} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4">
          <h2 className="text-lg font-semibold">Enter Workflow Password</h2>
          <Input
            type="password"
            placeholder="Password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            required
          />
          {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
          <Button type="submit" className="w-full">Continue</Button>
        </form>
      </div>
    );
  }

  // Authenticated: show workflow
  return (
    <PreviewLayout branding={workflow.branding}>
      <PreviewController workflow={workflow} />
    </PreviewLayout>
  );
} 
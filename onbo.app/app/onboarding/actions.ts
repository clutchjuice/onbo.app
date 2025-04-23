'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type OnboardingData = {
  niche: string
  customNiche: string
  referral_source: string
  customReferralSource: string
  organization_name: string
  organization_size: string
  use_case: string[]
}

export async function submitOnboarding(formData: OnboardingData) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (!user || userError) throw new Error('Authentication required')

    // First update the user's onboarding data
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        niche: formData.niche === 'other' ? null : formData.niche,
        custom_niche: formData.niche === 'other' ? formData.customNiche : null,
        referral_source: formData.referral_source === 'other' ? null : formData.referral_source,
        custom_referral_source: formData.referral_source === 'other' ? formData.customReferralSource : null,
        organization_name: formData.organization_name,
        organization_size: formData.organization_size,
        use_case: formData.use_case,
        onboarding_completed: true
      })
      .eq('id', user.id)

    if (userUpdateError) throw userUpdateError

    // Then create the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: formData.organization_name,
        owner_id: user.id,
        settings: {
          created_at: new Date().toISOString(),
          created_by: user.id
        }
      })
      .select()
      .single()

    if (workspaceError) throw workspaceError

    // Finally, create the workspace member record
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner'
      })

    if (memberError) throw memberError

    // Get current user's workspaces
    const { data: currentUserData, error: fetchWorkspacesError } = await supabase
      .from('users')
      .select('workspaces')
      .eq('id', user.id)
      .single()

    if (fetchWorkspacesError) throw fetchWorkspacesError

    // Update the user's workspaces array
    const { error: workspacesUpdateError } = await supabase
      .from('users')
      .update({
        workspaces: [...(currentUserData?.workspaces || []), workspace.id]
      })
      .eq('id', user.id)

    if (workspacesUpdateError) throw workspacesUpdateError

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Something went wrong. Please try again." 
    }
  }
} 
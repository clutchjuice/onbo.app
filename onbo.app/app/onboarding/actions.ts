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

    // Start a transaction by using a consistent timestamp
    const now = new Date().toISOString()

    // First create the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: formData.organization_name,
        created_at: now,
        updated_at: now,
        owner_id: user.id
      })
      .select()
      .single()

    if (workspaceError) throw workspaceError

    // Then create the workspace member record for the owner
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
        joined_at: now
      })

    if (memberError) throw memberError

    // Then update the user's profile with onboarding data and workspace
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        niche: formData.niche === 'other' ? null : formData.niche,
        custom_niche: formData.niche === 'other' ? formData.customNiche : null,
        referral_source: formData.referral_source === 'other' ? null : formData.referral_source,
        custom_referral_source: formData.referral_source === 'other' ? formData.customReferralSource : null,
        organization_size: formData.organization_size,
        use_case: formData.use_case,
        onboarding_completed: true,
        workspaces: [workspace.id],
        active_workspace: workspace.id
      })
      .eq('id', user.id)

    if (userUpdateError) throw userUpdateError

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
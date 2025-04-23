import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import OnboardingForm from './components/OnboardingForm'

export default async function OnboardingPage() {
  // Initialize Supabase client
  const supabase = await createClient()

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user's workspaces
  const { data: userData } = await supabase
    .from('users')
    .select('workspaces')
    .eq('id', user.id)
    .single()

  // If user has workspaces, redirect to dashboard
  if (userData?.workspaces && userData.workspaces.length > 0) {
    redirect('/dashboard')
  }

  return (
    <div className="flex-1 flex flex-col w-full justify-center">
      <OnboardingForm />
    </div>
  )
} 
import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (!code) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    const supabase = await createClient()
    
    // Exchange the code for a session and get user data
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error || !user) {
      console.error('Auth error:', error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    // Get the display name directly from user_metadata
    const displayName = user.user_metadata?.name || ''
    
    if (displayName) {
      // Split the display name into first and last name
      const nameParts = displayName.trim().split(/\s+/)
      const firstName = nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

      // Update or insert the user record
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('Error updating user profile:', upsertError)
      }
    }

    // Handle redirect based on environment
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }
}
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = await createClient()

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  // If no authenticated user, allow only public routes
  if (!user || userError) {
    // Add any public routes here
    const isPublicRoute = req.nextUrl.pathname === '/login' || 
                         req.nextUrl.pathname === '/signup' ||
                         req.nextUrl.pathname === '/' ||
                         req.nextUrl.pathname.startsWith('/auth/callback')
    
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return res
  }

  // Check if user has completed onboarding
  const { data: userData } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  const onboardingCompleted = userData?.onboarding_completed ?? false
  const isOnboardingRoute = req.nextUrl.pathname === '/onboarding'

  // If onboarding is not completed and trying to access any route except onboarding
  if (!onboardingCompleted && !isOnboardingRoute) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // If onboarding is completed and trying to access onboarding route
  if (onboardingCompleted && isOnboardingRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

// Add the paths that should be checked by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
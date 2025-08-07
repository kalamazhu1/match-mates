import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  
  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/events/create',
    '/profile',
    '/events/[id]/manage'
  ]
  
  // Define public routes that should always be accessible
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/terms',
    '/privacy',
    '/events' // Event listing page is public
  ]
  
  // Check if current path matches a protected route
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.includes('[id]')) {
      // Handle dynamic routes like /events/[id]/manage
      const regex = new RegExp(route.replace(/\[id\]/g, '[^/]+'))
      return regex.test(pathname)
    }
    return pathname.startsWith(route)
  })
  
  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/events' && pathname.startsWith('/events/') && !pathname.includes('/create') && !pathname.includes('/manage')) {
      // Allow event detail pages /events/[id] but not /events/create or /events/[id]/manage
      return pathname.match(/^\/events\/[^\/]+$/)
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
  
  // Update session and get user info
  const { response, user, error } = await updateSession(request)
  
  // If this is a protected route, check authentication
  if (isProtectedRoute) {
    // If user is not authenticated or there's an error, redirect to signin
    if (!user || error) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('redirectTo', pathname + search)
      return NextResponse.redirect(signInUrl)
    }
    
    // TODO: Add role-based access control for admin routes
    // For /events/[id]/manage routes, we could check if user is the event organizer
  }
  
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup')) && !pathname.includes('/callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
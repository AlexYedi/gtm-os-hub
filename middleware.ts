import { NextResponse, type NextRequest } from 'next/server'

// Cookie name inlined (not imported from lib/auth) so middleware stays free of the
// server-only / node:crypto modules. Must match COCKPIT_COOKIE in lib/auth.ts.
const COCKPIT_COOKIE = 'gtmu_cockpit'

// Coarse navigation gate for /cockpit/*. Presence-only — the real verification
// (token match) happens server-side in the page (isCockpitAuthed) and inside every
// Server Action (assertCockpit). Defense in depth: this is UX, not the security boundary.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/cockpit') && !pathname.startsWith('/cockpit/login')) {
    if (!req.cookies.get(COCKPIT_COOKIE)?.value) {
      const url = req.nextUrl.clone()
      url.pathname = '/cockpit/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = { matcher: ['/cockpit/:path*'] }

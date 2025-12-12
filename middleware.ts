import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Inline locales to avoid importing from i18n/request (reduces bundle size)
const locales = ['en', 'el'] as const;

// Create the i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
  // Enforce a single host (helps cookie consistency between apex/www) - prod only
  const canonicalHost = process.env.CANONICAL_HOST;
  if (
    process.env.NODE_ENV === "production" &&
    canonicalHost &&
    request.nextUrl.hostname !== canonicalHost
  ) {
    const url = new URL(request.url);
    url.hostname = canonicalHost;
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  // First, handle i18n routing
  const response = intlMiddleware(request);
  
  // Extract locale from pathname
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = pathname.split('/')[1];
  
  // Remove locale prefix for path checking
  const pathWithoutLocale = pathname.replace(`/${pathnameLocale}`, '') || '/';

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login", "/register", "/coupons", "/membership", "/community"];
  const isPublicPath = publicPaths.includes(pathWithoutLocale);

  // Get token (lighter than full auth() - doesn't import Prisma)
  // Try both AUTH_SECRET and NEXTAUTH_SECRET to avoid env mismatch in Edge
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    console.error('Missing AUTH_SECRET or NEXTAUTH_SECRET in middleware');
  }
  
  const token = await getToken({ 
    req: request,
    secret: secret,
    cookieName: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token'
  });

  // Redirect authenticated users away from login/register
  if (token && (pathWithoutLocale.includes("/login") || pathWithoutLocale.includes("/register"))) {
    return NextResponse.redirect(new URL(`/${pathnameLocale}`, request.url));
  }

  // Protect dashboard routes
  if (pathWithoutLocale.includes("/dashboard")) {
    if (!token) {
      // No token found - redirect to login
      const loginUrl = new URL(`/${pathnameLocale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control
    const userRole = token.role as string | undefined;
    
    // If role is missing from token, allow through (will be checked in page)
    if (!userRole) {
      return response;
    }
    
    if (pathWithoutLocale.includes("/dashboard/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${pathnameLocale}`, request.url));
    }

    if (pathWithoutLocale.includes("/dashboard/business") && userRole !== "BUSINESS") {
      return NextResponse.redirect(new URL(`/${pathnameLocale}`, request.url));
    }

    if (pathWithoutLocale.includes("/dashboard/user") && userRole !== "USER") {
      return NextResponse.redirect(new URL(`/${pathnameLocale}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


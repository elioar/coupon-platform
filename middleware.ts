import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { locales } from './i18n/request';

// Create the i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
  // First, handle i18n routing
  const response = intlMiddleware(request);
  
  // Extract locale from pathname
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = pathname.split('/')[1];
  
  // Remove locale prefix for path checking
  const pathWithoutLocale = pathname.replace(`/${pathnameLocale}`, '') || '/';

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login", "/register", "/coupons", "/membership"];
  const isPublicPath = publicPaths.includes(pathWithoutLocale);

  // Get session
  const session = await auth();

  // Redirect authenticated users away from login/register
  if (session && (pathWithoutLocale.includes("/login") || pathWithoutLocale.includes("/register"))) {
    return NextResponse.redirect(new URL(`/${pathnameLocale}`, request.url));
  }

  // Protect dashboard routes
  if (pathWithoutLocale.includes("/dashboard")) {
    if (!session) {
      const loginUrl = new URL(`/${pathnameLocale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control
    if (pathWithoutLocale.includes("/dashboard/admin") && session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${pathnameLocale}`, request.url));
    }

    if (pathWithoutLocale.includes("/dashboard/business") && session.user.role !== "BUSINESS") {
      return NextResponse.redirect(new URL(`/${pathnameLocale}`, request.url));
    }

    if (pathWithoutLocale.includes("/dashboard/user") && session.user.role !== "USER") {
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


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

  // Get token (lighter than full auth() - doesn't import Prisma)
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Redirect authenticated users away from login/register
  if (token && (pathWithoutLocale.includes("/login") || pathWithoutLocale.includes("/register"))) {
    return NextResponse.redirect(new URL(`/${pathnameLocale}`, request.url));
  }

  // Protect dashboard routes
  if (pathWithoutLocale.includes("/dashboard")) {
    if (!token) {
      const loginUrl = new URL(`/${pathnameLocale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control
    const userRole = token.role as string;
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


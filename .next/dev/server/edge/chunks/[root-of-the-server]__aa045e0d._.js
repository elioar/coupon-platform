(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__aa045e0d._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/Desktop/ELIO/coupon-platform/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$middleware$2f$middleware$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next-intl/dist/esm/development/middleware/middleware.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$auth$2f$jwt$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next-auth/jwt.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/@auth/core/jwt.js [middleware-edge] (ecmascript)");
;
;
;
// Inline locales to avoid importing from i18n/request (reduces bundle size)
const locales = [
    'en',
    'el'
];
// Create the i18n middleware
const intlMiddleware = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$middleware$2f$middleware$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["default"])({
    locales,
    defaultLocale: 'en',
    localePrefix: 'always'
});
async function middleware(request) {
    // First, handle i18n routing
    const response = intlMiddleware(request);
    // Extract locale from pathname
    const pathname = request.nextUrl.pathname;
    const pathnameLocale = pathname.split('/')[1];
    // Remove locale prefix for path checking
    const pathWithoutLocale = pathname.replace(`/${pathnameLocale}`, '') || '/';
    // Public paths that don't require authentication
    const publicPaths = [
        "/",
        "/login",
        "/register",
        "/coupons",
        "/membership"
    ];
    const isPublicPath = publicPaths.includes(pathWithoutLocale);
    // Get token (lighter than full auth() - doesn't import Prisma)
    const token = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f40$auth$2f$core$2f$jwt$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getToken"])({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });
    // Redirect authenticated users away from login/register
    if (token && (pathWithoutLocale.includes("/login") || pathWithoutLocale.includes("/register"))) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(`/${pathnameLocale}`, request.url));
    }
    // Protect dashboard routes
    if (pathWithoutLocale.includes("/dashboard")) {
        if (!token) {
            const loginUrl = new URL(`/${pathnameLocale}/login`, request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
        }
        // Role-based access control
        const userRole = token.role;
        if (pathWithoutLocale.includes("/dashboard/admin") && userRole !== "ADMIN") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(`/${pathnameLocale}`, request.url));
        }
        if (pathWithoutLocale.includes("/dashboard/business") && userRole !== "BUSINESS") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(`/${pathnameLocale}`, request.url));
        }
        if (pathWithoutLocale.includes("/dashboard/user") && userRole !== "USER") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(`/${pathnameLocale}`, request.url));
        }
    }
    return response;
}
const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__aa045e0d._.js.map
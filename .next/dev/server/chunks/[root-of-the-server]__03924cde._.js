module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[externals]/@prisma/client/scripts/default-index.js [external] (@prisma/client/scripts/default-index.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client/scripts/default-index.js", () => require("@prisma/client/scripts/default-index.js"));

module.exports = mod;
}),
"[project]/Desktop/ELIO/coupon-platform/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f40$prisma$2f$extension$2d$accelerate$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/@prisma/extension-accelerate/dist/index.js [app-route] (ecmascript)");
;
;
const globalForPrisma = globalThis;
function createPrismaClient() {
    const client = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
    // Only use Accelerate if PRISMA_ACCELERATE_URL is provided
    if (process.env.PRISMA_ACCELERATE_URL) {
        return client.$extends((0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f40$prisma$2f$extension$2d$accelerate$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["withAccelerate"])());
    }
    return client;
}
const prisma = globalForPrisma.prisma ?? createPrismaClient();
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/Desktop/ELIO/coupon-platform/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auth",
    ()=>auth,
    "handlers",
    ()=>handlers,
    "signIn",
    ()=>signIn,
    "signOut",
    ()=>signOut
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next-auth/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next-auth/providers/credentials.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/@auth/core/providers/credentials.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f40$auth$2f$prisma$2d$adapter$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/@auth/prisma-adapter/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
;
;
;
;
;
const userProfileSelection = {
    role: true,
    membershipExpiry: true,
    name: true,
    address: true,
    birthDate: true,
    phone: true,
    about: true,
    businessDescription: true,
    businessCategories: true,
    businessLocation: true,
    businessWebsite: true,
    businessInstagram: true,
    businessFacebook: true,
    businessTikTok: true,
    businessLatitude: true,
    businessLongitude: true
};
const { handlers, signIn, signOut, auth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])({
    adapter: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f40$auth$2f$prisma$2d$adapter$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PrismaAdapter"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"]),
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: "/login"
    },
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
            credentials: {
                email: {
                    label: "Email",
                    type: "email"
                },
                password: {
                    label: "Password",
                    type: "password"
                }
            },
            async authorize (credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });
                if (!user) {
                    return null;
                }
                const isPasswordValid = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(credentials.password, user.password);
                if (!isPasswordValid) {
                    return null;
                }
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
            }
        })
    ],
    callbacks: {
        async jwt ({ token, user, trigger, session }) {
            const hydrateTokenFromDb = async (userId)=>{
                const dbUser = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
                    where: {
                        id: userId
                    },
                    select: userProfileSelection
                });
                if (dbUser) {
                    token.role = dbUser.role;
                    token.membershipExpiry = dbUser.membershipExpiry?.toISOString() ?? null;
                    token.name = dbUser.name;
                    token.address = dbUser.address ?? null;
                    token.birthDate = dbUser.birthDate?.toISOString() ?? null;
                    token.phone = dbUser.phone ?? null;
                    token.about = dbUser.about ?? null;
                    token.businessDescription = dbUser.businessDescription ?? null;
                    token.businessCategories = dbUser.businessCategories ?? [];
                    token.businessLocation = dbUser.businessLocation ?? null;
                    token.businessWebsite = dbUser.businessWebsite ?? null;
                    token.businessInstagram = dbUser.businessInstagram ?? null;
                    token.businessFacebook = dbUser.businessFacebook ?? null;
                    token.businessTikTok = dbUser.businessTikTok ?? null;
                    token.businessLatitude = dbUser.businessLatitude ?? null;
                    token.businessLongitude = dbUser.businessLongitude ?? null;
                }
            };
            if (user && user.id) {
                token.id = user.id;
                token.email = user.email;
                await hydrateTokenFromDb(user.id);
            }
            if (trigger === "update" && token.id) {
                // When session is explicitly updated, prefer provided values to avoid extra query
                if (session?.name) {
                    token.name = session.name;
                }
                await hydrateTokenFromDb(token.id);
            }
            return token;
        },
        async session ({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.membershipExpiry = token.membershipExpiry ?? null;
                session.user.name = token.name ?? session.user.name;
                session.user.address = token.address ?? null;
                session.user.birthDate = token.birthDate ?? null;
                session.user.phone = token.phone ?? null;
                session.user.about = token.about ?? null;
                session.user.businessDescription = token.businessDescription ?? null;
                session.user.businessCategories = token.businessCategories ?? [];
                session.user.businessLocation = token.businessLocation ?? null;
                session.user.businessWebsite = token.businessWebsite ?? null;
                session.user.businessInstagram = token.businessInstagram ?? null;
                session.user.businessFacebook = token.businessFacebook ?? null;
                session.user.businessTikTok = token.businessTikTok ?? null;
                session.user.businessLatitude = token.businessLatitude ?? null;
                session.user.businessLongitude = token.businessLongitude ?? null;
            }
            return session;
        }
    }
});
}),
"[project]/Desktop/ELIO/coupon-platform/lib/client-utils.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Client-safe utility functions
// These functions don't import any server-side dependencies like Prisma or auth
__turbopack_context__.s([
    "isMember",
    ()=>isMember
]);
function isMember(user) {
    if (!user?.membershipExpiry) return false;
    return new Date(user.membershipExpiry) > new Date();
}
}),
"[project]/Desktop/ELIO/coupon-platform/lib/auth-helpers.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCurrentUser",
    ()=>getCurrentUser,
    "isCurrentUserMember",
    ()=>isCurrentUserMember,
    "requireAuth",
    ()=>requireAuth,
    "requireRole",
    ()=>requireRole
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$client$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/lib/client-utils.ts [app-route] (ecmascript)");
;
;
async function getCurrentUser() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"])();
    return session?.user;
}
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }
    return user;
}
async function requireRole(allowedRoles) {
    const user = await requireAuth();
    if (!allowedRoles.includes(user.role)) {
        throw new Error("Forbidden");
    }
    return user;
}
;
async function isCurrentUserMember() {
    const user = await getCurrentUser();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$client$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isMember"])(user ? {
        membershipExpiry: user.membershipExpiry
    } : null);
}
}),
"[project]/Desktop/ELIO/coupon-platform/app/api/admin/users/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/lib/auth-helpers.ts [app-route] (ecmascript) <locals>");
;
;
;
async function GET(request) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["requireRole"])([
            "ADMIN"
        ]);
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const where = {};
        if (role) {
            where.role = role;
        }
        const users = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                membershipExpiry: true,
                createdAt: true,
                _count: {
                    select: {
                        coupons: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            users
        });
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        if (error instanceof Error && error.message === "Forbidden") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Forbidden"
            }, {
                status: 403
            });
        }
        console.error("Error fetching users:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Internal server error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__03924cde._.js.map
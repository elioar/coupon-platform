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
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

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
    businessTikTok: true
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
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[project]/Desktop/ELIO/coupon-platform/lib/stripe.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MEMBERSHIP_DURATION_DAYS",
    ()=>MEMBERSHIP_DURATION_DAYS,
    "MEMBERSHIP_PRICE",
    ()=>MEMBERSHIP_PRICE,
    "stripe",
    ()=>stripe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$stripe$2f$esm$2f$stripe$2e$esm$2e$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/stripe/esm/stripe.esm.node.js [app-route] (ecmascript)");
;
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}
const stripe = new __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$stripe$2f$esm$2f$stripe$2e$esm$2e$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"](process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-10-29.clover",
    typescript: true
});
const MEMBERSHIP_PRICE = 1000; // €10.00 in cents
const MEMBERSHIP_DURATION_DAYS = 365; // 1 year
}),
"[project]/Desktop/ELIO/coupon-platform/app/api/membership/checkout/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/lib/auth-helpers.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$stripe$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/lib/stripe.ts [app-route] (ecmascript)");
;
;
;
async function POST(request) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$auth$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["requireAuth"])();
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$stripe$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stripe"]) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables."
            }, {
                status: 503
            });
        }
        // Create Stripe checkout session
        const session = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$stripe$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stripe"].checkout.sessions.create({
            payment_method_types: [
                'card'
            ],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'CouponMe Annual Membership',
                            description: 'Unlock unlimited access to all coupon codes for one year'
                        },
                        unit_amount: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$lib$2f$stripe$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MEMBERSHIP_PRICE"]
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: `${("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000'}/en/membership?success=true`,
            cancel_url: `${("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000'}/en/membership?canceled=true`,
            client_reference_id: user.id,
            metadata: {
                userId: user.id,
                type: 'membership'
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        console.error("Error creating checkout session:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Internal server error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7b406004._.js.map
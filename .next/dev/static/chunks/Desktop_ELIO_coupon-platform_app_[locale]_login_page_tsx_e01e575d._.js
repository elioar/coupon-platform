(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$auth$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next-auth/react.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function LoginPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const locale = params.locale;
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])("auth.login");
    const tCommon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"])("common");
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        email: "",
        password: ""
    });
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$auth$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["signIn"])("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false
            });
            if (result?.error) {
                setError(t("error"));
            } else {
                router.push(`/${locale}`);
                router.refresh();
            }
        } catch (err) {
            setError(t("error"));
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12 dark:bg-zinc-950",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-zinc-950 dark:via-emerald-950 dark:to-green-950"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute -left-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-400/20 blur-3xl dark:from-green-600/10 dark:to-emerald-600/10"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-gradient-to-br from-teal-400/20 to-green-400/20 blur-3xl dark:from-teal-600/10 dark:to-green-600/10"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-emerald-300/15 to-green-300/15 blur-3xl dark:from-emerald-700/10 dark:to-green-700/10"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 opacity-30 dark:opacity-20",
                        style: {
                            backgroundImage: `radial-gradient(circle, rgb(34, 197, 94) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                            backgroundPosition: '0 0, 20px 20px'
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 opacity-10 dark:opacity-5",
                        style: {
                            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgb(34, 197, 94) 10px,
              rgb(34, 197, 94) 11px
            )`
                        }
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 73,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        animate: {
                            y: [
                                0,
                                -20,
                                0
                            ],
                            rotate: [
                                0,
                                5,
                                -5,
                                0
                            ]
                        },
                        transition: {
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                        },
                        className: "absolute left-10 top-20",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            whileHover: {
                                scale: 1.1,
                                rotate: 5
                            },
                            className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-400/20 backdrop-blur-sm shadow-lg ring-2 ring-green-200/50 dark:ring-green-800/50",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "h-8 w-8 text-green-600 dark:text-green-400",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                    lineNumber: 104,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                lineNumber: 103,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                            lineNumber: 99,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        animate: {
                            y: [
                                0,
                                -25,
                                0
                            ],
                            rotate: [
                                0,
                                -5,
                                5,
                                0
                            ]
                        },
                        transition: {
                            duration: 7,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1.5
                        },
                        className: "absolute right-20 top-40",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            whileHover: {
                                scale: 1.1,
                                rotate: -5
                            },
                            className: "flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-green-400/20 backdrop-blur-sm shadow-lg ring-2 ring-emerald-200/50 dark:ring-emerald-800/50",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "h-7 w-7 text-emerald-600 dark:text-emerald-400",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                    lineNumber: 127,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                lineNumber: 126,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                            lineNumber: 122,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 109,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        animate: {
                            y: [
                                0,
                                -18,
                                0
                            ],
                            rotate: [
                                0,
                                3,
                                -3,
                                0
                            ]
                        },
                        transition: {
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 2
                        },
                        className: "absolute bottom-32 left-1/4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            whileHover: {
                                scale: 1.1,
                                rotate: 3
                            },
                            className: "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm shadow-lg ring-2 ring-green-300/50 dark:ring-green-700/50",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "h-6 w-6 text-green-600 dark:text-green-400",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                    lineNumber: 150,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                lineNumber: 149,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                            lineNumber: 145,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        animate: {
                            scale: [
                                1,
                                1.3,
                                1
                            ],
                            opacity: [
                                0.6,
                                1,
                                0.6
                            ],
                            rotate: [
                                0,
                                180,
                                360
                            ]
                        },
                        transition: {
                            duration: 3,
                            repeat: Infinity,
                            delay: 0.5,
                            ease: "easeInOut"
                        },
                        className: "absolute top-1/4 right-1/3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "h-6 w-6 text-green-400/60 dark:text-green-500/40",
                            fill: "currentColor",
                            viewBox: "0 0 20 20",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                lineNumber: 171,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                            lineNumber: 170,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 156,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        animate: {
                            scale: [
                                1,
                                1.2,
                                1
                            ],
                            opacity: [
                                0.6,
                                1,
                                0.6
                            ],
                            rotate: [
                                0,
                                -180,
                                -360
                            ]
                        },
                        transition: {
                            duration: 4,
                            repeat: Infinity,
                            delay: 1,
                            ease: "easeInOut"
                        },
                        className: "absolute bottom-1/3 left-1/3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "h-5 w-5 text-emerald-400/60 dark:text-emerald-500/40",
                            fill: "currentColor",
                            viewBox: "0 0 20 20",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                lineNumber: 190,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                            lineNumber: 189,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 175,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        animate: {
                            scale: [
                                1,
                                1.4,
                                1
                            ],
                            opacity: [
                                0.6,
                                1,
                                0.6
                            ],
                            rotate: [
                                0,
                                90,
                                180,
                                270,
                                360
                            ]
                        },
                        transition: {
                            duration: 3.5,
                            repeat: Infinity,
                            delay: 1.5,
                            ease: "easeInOut"
                        },
                        className: "absolute top-1/2 right-1/5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "h-4 w-4 text-teal-400/60 dark:text-teal-500/40",
                            fill: "currentColor",
                            viewBox: "0 0 20 20",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                            }, void 0, false, {
                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                lineNumber: 209,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                            lineNumber: 208,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 194,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        animate: {
                            scale: [
                                1,
                                1.1,
                                1
                            ],
                            opacity: [
                                0.3,
                                0.5,
                                0.3
                            ]
                        },
                        transition: {
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        },
                        className: "absolute right-1/4 top-1/4 h-32 w-32 rounded-full border-4 border-green-300/30 dark:border-green-700/30"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 214,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        animate: {
                            scale: [
                                1,
                                1.15,
                                1
                            ],
                            opacity: [
                                0.3,
                                0.6,
                                0.3
                            ]
                        },
                        transition: {
                            duration: 5,
                            repeat: Infinity,
                            delay: 1,
                            ease: "easeInOut"
                        },
                        className: "absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full border-4 border-emerald-300/30 dark:border-emerald-700/30"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 226,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        animate: {
                            scale: [
                                1,
                                1.2,
                                1
                            ],
                            opacity: [
                                0.3,
                                0.5,
                                0.3
                            ]
                        },
                        transition: {
                            duration: 3.5,
                            repeat: Infinity,
                            delay: 2,
                            ease: "easeInOut"
                        },
                        className: "absolute top-1/3 right-1/3 h-16 w-16 rounded-full border-4 border-teal-300/30 dark:border-teal-700/30"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                        lineNumber: 239,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 w-full max-w-5xl",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-8 lg:grid-cols-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            initial: {
                                opacity: 0,
                                x: -30
                            },
                            animate: {
                                opacity: 1,
                                x: 0
                            },
                            transition: {
                                duration: 0.6,
                                ease: "easeOut"
                            },
                            className: "hidden flex-col justify-center space-y-6 lg:flex lg:pr-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        opacity: 0,
                                        y: 20
                                    },
                                    animate: {
                                        opacity: 1,
                                        y: 0
                                    },
                                    transition: {
                                        duration: 0.5,
                                        delay: 0.2
                                    },
                                    className: "space-y-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                            initial: {
                                                scale: 0
                                            },
                                            animate: {
                                                scale: 1
                                            },
                                            transition: {
                                                duration: 0.4,
                                                delay: 0.3,
                                                type: "spring"
                                            },
                                            className: "inline-block",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].span, {
                                                whileHover: {
                                                    scale: 1.05
                                                },
                                                className: "inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-1.5 text-sm font-bold text-white shadow-lg",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].svg, {
                                                        animate: {
                                                            rotate: [
                                                                0,
                                                                10,
                                                                -10,
                                                                0
                                                            ]
                                                        },
                                                        transition: {
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            repeatDelay: 3
                                                        },
                                                        className: "h-4 w-4",
                                                        fill: "currentColor",
                                                        viewBox: "0 0 20 20",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                d: "M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                lineNumber: 286,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                fillRule: "evenodd",
                                                                d: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941a2.305 2.305 0 01-1.676-.662C6.602 13.765 6 12.99 6 12c0-.99.602-1.765 1.324-2.246A4.535 4.535 0 009 9.092V7.151c.22.071.412.164.567.267C9.93 7.66 10 7.886 10 8c0 .114-.07.34-.433.582A2.305 2.305 0 019 8.849v1.698a4.535 4.535 0 001.676-.662C11.398 9.765 12 8.99 12 8c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 009 5.092V4.151a2.305 2.305 0 011.676.662C11.398 5.235 12 6.01 12 7c0 .99-.602 1.765-1.324 2.246-.48.32-1.054.545-1.676.662v1.941a2.305 2.305 0 001.676-.662C11.398 10.765 12 9.99 12 9c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 009 5.092V3.151z",
                                                                clipRule: "evenodd"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                lineNumber: 287,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                        lineNumber: 279,
                                                        columnNumber: 19
                                                    }, this),
                                                    t("saveMoreBadge")
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                lineNumber: 275,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                            lineNumber: 269,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].h2, {
                                            initial: {
                                                opacity: 0,
                                                y: 10
                                            },
                                            animate: {
                                                opacity: 1,
                                                y: 0
                                            },
                                            transition: {
                                                duration: 0.5,
                                                delay: 0.4
                                            },
                                            className: "text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 lg:text-5xl",
                                            children: t("welcomeTitle")
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                            lineNumber: 292,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                                            initial: {
                                                opacity: 0,
                                                y: 10
                                            },
                                            animate: {
                                                opacity: 1,
                                                y: 0
                                            },
                                            transition: {
                                                duration: 0.5,
                                                delay: 0.5
                                            },
                                            className: "text-lg font-medium text-zinc-700 dark:text-zinc-300",
                                            children: t("welcomeDescription")
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                            lineNumber: 300,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                    lineNumber: 263,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-4",
                                    children: [
                                        {
                                            key: "feature1",
                                            title: t("feature1Title"),
                                            description: t("feature1Description"),
                                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "h-6 w-6 text-white",
                                                fill: "none",
                                                viewBox: "0 0 24 24",
                                                stroke: "currentColor",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 319,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                lineNumber: 318,
                                                columnNumber: 21
                                            }, this),
                                            gradient: "from-green-400 to-emerald-500",
                                            blur: "bg-green-200/50 dark:bg-green-900/50"
                                        },
                                        {
                                            key: "feature2",
                                            title: t("feature2Title"),
                                            description: t("feature2Description"),
                                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "h-6 w-6 text-white",
                                                fill: "none",
                                                viewBox: "0 0 24 24",
                                                stroke: "currentColor",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 331,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                lineNumber: 330,
                                                columnNumber: 21
                                            }, this),
                                            gradient: "from-emerald-400 to-green-500",
                                            blur: "bg-emerald-200/50 dark:bg-emerald-900/50"
                                        },
                                        {
                                            key: "feature3",
                                            title: t("feature3Title"),
                                            description: t("feature3Description"),
                                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "h-6 w-6 text-white",
                                                fill: "none",
                                                viewBox: "0 0 24 24",
                                                stroke: "currentColor",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 343,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                lineNumber: 342,
                                                columnNumber: 21
                                            }, this),
                                            gradient: "from-green-500 to-emerald-600",
                                            blur: "bg-green-200/50 dark:bg-green-900/50"
                                        }
                                    ].map((feature, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                            initial: {
                                                opacity: 0,
                                                x: -20
                                            },
                                            animate: {
                                                opacity: 1,
                                                x: 0
                                            },
                                            transition: {
                                                duration: 0.5,
                                                delay: 0.6 + index * 0.1
                                            },
                                            whileHover: {
                                                y: -5,
                                                scale: 1.02
                                            },
                                            className: "group relative overflow-hidden rounded-xl bg-white/80 p-4 shadow-md backdrop-blur-sm transition-all hover:shadow-lg dark:bg-zinc-800/80",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                    animate: {
                                                        scale: [
                                                            1,
                                                            1.2,
                                                            1
                                                        ],
                                                        opacity: [
                                                            0.5,
                                                            0.8,
                                                            0.5
                                                        ]
                                                    },
                                                    transition: {
                                                        duration: 3,
                                                        repeat: Infinity,
                                                        delay: index * 0.5
                                                    },
                                                    className: `absolute -right-4 -top-4 h-16 w-16 rounded-full ${feature.blur} blur-xl`
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 358,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "relative flex items-start gap-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                            whileHover: {
                                                                rotate: [
                                                                    0,
                                                                    -10,
                                                                    10,
                                                                    -10,
                                                                    0
                                                                ],
                                                                scale: 1.1
                                                            },
                                                            transition: {
                                                                duration: 0.5
                                                            },
                                                            className: `flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-md`,
                                                            children: feature.icon
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                            lineNumber: 371,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "font-bold text-zinc-900 dark:text-zinc-50",
                                                                    children: feature.title
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                    lineNumber: 379,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm text-zinc-600 dark:text-zinc-400",
                                                                    children: feature.description
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                    lineNumber: 382,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                            lineNumber: 378,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 370,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, feature.key, true, {
                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                            lineNumber: 350,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                    lineNumber: 311,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                            lineNumber: 257,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-center lg:justify-end",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full max-w-md",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        opacity: 0,
                                        y: 20,
                                        scale: 0.95
                                    },
                                    animate: {
                                        opacity: 1,
                                        y: 0,
                                        scale: 1
                                    },
                                    transition: {
                                        duration: 0.5,
                                        delay: 0.3,
                                        ease: "easeOut"
                                    },
                                    className: "rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-900 sm:p-8",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                            initial: {
                                                opacity: 0,
                                                y: -10
                                            },
                                            animate: {
                                                opacity: 1,
                                                y: 0
                                            },
                                            transition: {
                                                duration: 0.5,
                                                delay: 0.4
                                            },
                                            className: "mb-6 text-center sm:mb-8",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                    className: "text-2xl font-semibold text-zinc-900 dark:text-zinc-50",
                                                    children: t("title")
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 409,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-2 text-sm text-zinc-600 dark:text-zinc-400",
                                                    children: t("subtitle")
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 412,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                            lineNumber: 403,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                            onSubmit: handleSubmit,
                                            className: "space-y-5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                                    mode: "wait",
                                                    children: error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                        initial: {
                                                            opacity: 0,
                                                            y: -10,
                                                            scale: 0.95
                                                        },
                                                        animate: {
                                                            opacity: 1,
                                                            y: 0,
                                                            scale: 1
                                                        },
                                                        exit: {
                                                            opacity: 0,
                                                            y: -10,
                                                            scale: 0.95
                                                        },
                                                        transition: {
                                                            duration: 0.2
                                                        },
                                                        className: "rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400",
                                                        children: error
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                        lineNumber: 421,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 419,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                    initial: {
                                                        opacity: 0,
                                                        x: -20
                                                    },
                                                    animate: {
                                                        opacity: 1,
                                                        x: 0
                                                    },
                                                    transition: {
                                                        duration: 0.4,
                                                        delay: 0.5
                                                    },
                                                    className: "space-y-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            htmlFor: "email",
                                                            className: "block text-sm font-medium text-zinc-700 dark:text-zinc-300",
                                                            children: t("email")
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                            lineNumber: 439,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].input, {
                                                            whileFocus: {
                                                                scale: 1.01
                                                            },
                                                            transition: {
                                                                duration: 0.2
                                                            },
                                                            id: "email",
                                                            type: "email",
                                                            required: true,
                                                            value: formData.email,
                                                            onChange: (e)=>setFormData({
                                                                    ...formData,
                                                                    email: e.target.value
                                                                }),
                                                            className: "block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500",
                                                            placeholder: "you@example.com"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                            lineNumber: 445,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 433,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                    initial: {
                                                        opacity: 0,
                                                        x: -20
                                                    },
                                                    animate: {
                                                        opacity: 1,
                                                        x: 0
                                                    },
                                                    transition: {
                                                        duration: 0.4,
                                                        delay: 0.6
                                                    },
                                                    className: "space-y-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center justify-between",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    htmlFor: "password",
                                                                    className: "block text-sm font-medium text-zinc-700 dark:text-zinc-300",
                                                                    children: t("password")
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                    lineNumber: 467,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                                    whileHover: {
                                                                        scale: 1.05
                                                                    },
                                                                    whileTap: {
                                                                        scale: 0.95
                                                                    },
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                        href: `/${locale}/forgot-password`,
                                                                        className: "text-sm text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300",
                                                                        children: t("forgotPassword")
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                        lineNumber: 474,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                    lineNumber: 473,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                            lineNumber: 466,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].input, {
                                                            whileFocus: {
                                                                scale: 1.01
                                                            },
                                                            transition: {
                                                                duration: 0.2
                                                            },
                                                            id: "password",
                                                            type: "password",
                                                            required: true,
                                                            value: formData.password,
                                                            onChange: (e)=>setFormData({
                                                                    ...formData,
                                                                    password: e.target.value
                                                                }),
                                                            className: "block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500",
                                                            placeholder: "••••••••"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                            lineNumber: 482,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 460,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].button, {
                                                    type: "submit",
                                                    disabled: loading,
                                                    whileHover: !loading ? {
                                                        scale: 1.02,
                                                        y: -2
                                                    } : {},
                                                    whileTap: !loading ? {
                                                        scale: 0.98
                                                    } : {},
                                                    className: "relative w-full overflow-hidden rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-900",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].span, {
                                                            animate: {
                                                                x: loading ? "0%" : [
                                                                    "-100%",
                                                                    "100%"
                                                                ]
                                                            },
                                                            transition: {
                                                                duration: loading ? 0 : 3,
                                                                repeat: loading ? 0 : Infinity,
                                                                repeatDelay: loading ? 0 : 2,
                                                                ease: "linear"
                                                            },
                                                            className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                            lineNumber: 504,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "relative z-10 flex items-center justify-center",
                                                            children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "flex items-center justify-center gap-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].svg, {
                                                                        animate: {
                                                                            rotate: 360
                                                                        },
                                                                        transition: {
                                                                            duration: 1,
                                                                            repeat: Infinity,
                                                                            ease: "linear"
                                                                        },
                                                                        className: "h-4 w-4",
                                                                        fill: "none",
                                                                        viewBox: "0 0 24 24",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                                className: "opacity-25",
                                                                                cx: "12",
                                                                                cy: "12",
                                                                                r: "10",
                                                                                stroke: "currentColor",
                                                                                strokeWidth: "4"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                                lineNumber: 526,
                                                                                columnNumber: 29
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                className: "opacity-75",
                                                                                fill: "currentColor",
                                                                                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                                lineNumber: 534,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                        lineNumber: 519,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    tCommon("loading")
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                                lineNumber: 518,
                                                                columnNumber: 25
                                                            }, this) : t("submit")
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                            lineNumber: 516,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                    lineNumber: 497,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                            lineNumber: 418,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                            initial: {
                                                opacity: 0
                                            },
                                            animate: {
                                                opacity: 1
                                            },
                                            transition: {
                                                duration: 0.4,
                                                delay: 0.7
                                            },
                                            className: "mt-6 text-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-zinc-600 dark:text-zinc-400",
                                                children: [
                                                    t("noAccount"),
                                                    " ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].span, {
                                                        whileHover: {
                                                            scale: 1.05
                                                        },
                                                        whileTap: {
                                                            scale: 0.95
                                                        },
                                                        className: "inline-block",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                            href: `/${locale}/register`,
                                                            className: "font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300",
                                                            children: t("registerLink")
                                                        }, void 0, false, {
                                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                            lineNumber: 563,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                        lineNumber: 558,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                                lineNumber: 556,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                            lineNumber: 550,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                    lineNumber: 396,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                                lineNumber: 394,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                            lineNumber: 393,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                    lineNumber: 255,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
                lineNumber: 254,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/login/page.tsx",
        lineNumber: 51,
        columnNumber: 5
    }, this);
}
_s(LoginPage, "4MXXqXYbyshBHOvUbPkNH7m3MkU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"],
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslations"]
    ];
});
_c = LoginPage;
var _c;
__turbopack_context__.k.register(_c, "LoginPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Desktop_ELIO_coupon-platform_app_%5Blocale%5D_login_page_tsx_e01e575d._.js.map
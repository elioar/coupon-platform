(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/ELIO/coupon-platform/components/ThemeProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider,
    "useTheme",
    ()=>useTheme
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const ThemeContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function ThemeProvider({ children }) {
    _s();
    const [theme, setTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "ThemeProvider.useState": ()=>{
            // Initialize from localStorage if available
            if ("TURBOPACK compile-time truthy", 1) {
                const stored = localStorage.getItem("theme");
                if (stored && [
                    "light",
                    "dark",
                    "system"
                ].includes(stored)) {
                    return stored;
                }
            }
            return "system";
        }
    }["ThemeProvider.useState"]);
    const [resolvedTheme, setResolvedTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "ThemeProvider.useState": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                const stored = localStorage.getItem("theme");
                if (stored === "dark") return "dark";
                if (stored === "light") return "light";
                // System or no preference
                return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
            //TURBOPACK unreachable
            ;
        }
    }["ThemeProvider.useState"]);
    // Apply theme immediately when it changes or on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const root = window.document.documentElement;
            // Remove both classes first to ensure clean state
            root.classList.remove("light", "dark");
            let resolved;
            if (theme === "system") {
                const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                resolved = systemTheme;
                root.classList.add(systemTheme);
            } else {
                resolved = theme;
                root.classList.add(theme);
            }
            // Force a reflow to ensure the class is applied
            root.offsetHeight;
            setResolvedTheme(resolved);
            // Save to localStorage
            try {
                localStorage.setItem("theme", theme);
            } catch (e) {
            // Ignore localStorage errors
            }
        }
    }["ThemeProvider.useEffect"], [
        theme
    ]);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            setMounted(true);
        }
    }["ThemeProvider.useEffect"], []);
    // Listen for system theme changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            if (!mounted || theme !== "system") return;
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handleChange = {
                "ThemeProvider.useEffect.handleChange": ()=>{
                    const root = window.document.documentElement;
                    root.classList.remove("light", "dark");
                    const systemTheme = mediaQuery.matches ? "dark" : "light";
                    root.classList.add(systemTheme);
                    setResolvedTheme(systemTheme);
                }
            }["ThemeProvider.useEffect.handleChange"];
            mediaQuery.addEventListener("change", handleChange);
            return ({
                "ThemeProvider.useEffect": ()=>mediaQuery.removeEventListener("change", handleChange)
            })["ThemeProvider.useEffect"];
        }
    }["ThemeProvider.useEffect"], [
        theme,
        mounted
    ]);
    // Always provide context, even before mounting
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeContext.Provider, {
        value: {
            theme,
            setTheme,
            resolvedTheme
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/Desktop/ELIO/coupon-platform/components/ThemeProvider.tsx",
        lineNumber: 98,
        columnNumber: 5
    }, this);
}
_s(ThemeProvider, "QEwu/KxGBm0jCOWBliFYr/8Dz44=");
_c = ThemeProvider;
function useTheme() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ThemeContext);
    if (context === undefined) {
        // Return default values if ThemeProvider is not available (shouldn't happen, but safety check)
        return {
            theme: "system",
            setTheme: ()=>{},
            resolvedTheme: "light"
        };
    }
    return context;
}
_s1(useTheme, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "ThemeProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/ELIO/coupon-platform/app/[locale]/layout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LocaleLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$shared$2f$NextIntlClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__NextIntlClientProvider$3e$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js [app-client] (ecmascript) <export default as NextIntlClientProvider>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$auth$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next-auth/react.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$components$2f$ThemeProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/ELIO/coupon-platform/components/ThemeProvider.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function LocaleLayout({ children, params }) {
    _s();
    // Unwrap the params Promise
    const { locale } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["use"])(params);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LocaleLayout.useEffect": ()=>{
            async function loadMessages() {
                const msgs = (await __turbopack_context__.f({
                    "@/messages/el.json": {
                        id: ()=>"[project]/Desktop/ELIO/coupon-platform/messages/el.json (json, async loader)",
                        module: ()=>__turbopack_context__.A("[project]/Desktop/ELIO/coupon-platform/messages/el.json (json, async loader)")
                    },
                    "@/messages/en.json": {
                        id: ()=>"[project]/Desktop/ELIO/coupon-platform/messages/en.json (json, async loader)",
                        module: ()=>__turbopack_context__.A("[project]/Desktop/ELIO/coupon-platform/messages/en.json (json, async loader)")
                    }
                }).import(`@/messages/${locale}.json`)).default;
                setMessages(msgs);
            }
            loadMessages();
        }
    }["LocaleLayout.useEffect"], [
        locale
    ]);
    if (!messages) {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$components$2f$ThemeProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeProvider"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$auth$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SessionProvider"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$ELIO$2f$coupon$2d$platform$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$shared$2f$NextIntlClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__NextIntlClientProvider$3e$__["NextIntlClientProvider"], {
                locale: locale,
                messages: messages,
                children: children
            }, void 0, false, {
                fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/layout.tsx",
                lineNumber: 34,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/layout.tsx",
            lineNumber: 33,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Desktop/ELIO/coupon-platform/app/[locale]/layout.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_s(LocaleLayout, "w/jO2s54SlYWlYMKGDfZRvIpaDU=");
_c = LocaleLayout;
var _c;
__turbopack_context__.k.register(_c, "LocaleLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Desktop_ELIO_coupon-platform_fef43108._.js.map
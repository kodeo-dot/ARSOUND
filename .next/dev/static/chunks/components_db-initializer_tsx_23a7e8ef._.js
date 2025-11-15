(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/db-initializer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DbInitializer",
    ()=>DbInitializer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
function DbInitializer() {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DbInitializer.useEffect": ()=>{
            const initializeDatabase = {
                "DbInitializer.useEffect.initializeDatabase": async ()=>{
                    try {
                        const response = await fetch("/api/init", {
                            method: "GET",
                            cache: "no-store"
                        });
                        if (response.ok) {
                            const data = await response.json();
                            console.log("[v0] Database ready:", data.message);
                        }
                    } catch (error) {
                        console.error("[v0] Database init error:", error);
                    // Silently fail - database may already be initialized
                    }
                }
            }["DbInitializer.useEffect.initializeDatabase"];
            initializeDatabase();
        }
    }["DbInitializer.useEffect"], []);
    return null;
}
_s(DbInitializer, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = DbInitializer;
var _c;
__turbopack_context__.k.register(_c, "DbInitializer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=components_db-initializer_tsx_23a7e8ef._.js.map
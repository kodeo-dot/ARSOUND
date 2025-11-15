module.exports = [
"[project]/lib/supabase/server-client.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createServerClient",
    ()=>createServerClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
;
async function createServerClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://ebkcbcgpwmapjtrwojkm.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia2NiY2dwd21hcGp0cndvamttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjAzNTUsImV4cCI6MjA3ODI5NjM1NX0.2a2C8NrVVrd_ouIDyCLH0mJGh8SvT7d_6OfAq6dy3TE"), {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {
                // Ignore cookie set errors in Server Components
                }
            }
        }
    });
}
}),
"[project]/app/plans/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40be870f8359042ca77e28750b5f416e2aa76019f9":"selectPlan","602a987240095d3728e5c1a475bf3528455f3497e5":"purchasePack"},"",""] */ __turbopack_context__.s([
    "purchasePack",
    ()=>purchasePack,
    "selectPlan",
    ()=>selectPlan
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server-client.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
async function selectPlan(planId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return {
            success: false,
            message: "Por favor inicia sesión para continuar"
        };
    }
    try {
        if (!planId || planId === "free") {
            return {
                success: false,
                message: "Plan inválido"
            };
        }
        const response = await fetch(`${("TURBOPACK compile-time value", "http://localhost:3000")}/api/mercadopago/create-preference`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                planType: planId
            })
        });
        const text = await response.text();
        if (!response.ok) {
            console.error("[v0] Mercado Pago API error (raw):", text);
            return {
                success: false,
                message: "Error al crear la preferencia de pago. Intenta de nuevo."
            };
        }
        const data = JSON.parse(text);
        if (!data.init_point) {
            console.error("[v0] No init_point in response:", data);
            return {
                success: false,
                message: "Error al procesar el pago. Intenta de nuevo."
            };
        }
        return {
            success: true,
            init_point: data.init_point,
            preferenceId: data.preference_id
        };
    } catch (error) {
        console.error("[v0] Error in selectPlan:", error);
        return {
            success: false,
            message: "Error al crear la preferencia de pago"
        };
    }
}
async function purchasePack(packId, discountCode) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return {
            success: false,
            message: "Por favor inicia sesión para continuar"
        };
    }
    try {
        const response = await fetch(`${("TURBOPACK compile-time value", "http://localhost:3000")}/api/mercadopago/create-preference`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                packId,
                discountCode: discountCode || null
            })
        });
        const text = await response.text();
        if (!response.ok) {
            console.error("[v0] Mercado Pago API error:", text);
            return {
                success: false,
                message: "Error al crear la preferencia de pago. Intenta de nuevo."
            };
        }
        const data = JSON.parse(text);
        if (!data.init_point) {
            console.error("[v0] No init_point in response:", data);
            return {
                success: false,
                message: "Error al procesar el pago. Intenta de nuevo."
            };
        }
        return {
            success: true,
            init_point: data.init_point,
            preferenceId: data.preference_id
        };
    } catch (error) {
        console.error("[v0] Error in purchasePack:", error);
        return {
            success: false,
            message: "Error al crear la preferencia de pago"
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    selectPlan,
    purchasePack
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(selectPlan, "40be870f8359042ca77e28750b5f416e2aa76019f9", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(purchasePack, "602a987240095d3728e5c1a475bf3528455f3497e5", null);
}),
"[project]/.next-internal/server/app/plans/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/plans/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plans$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/plans/actions.ts [app-rsc] (ecmascript)");
;
}),
"[project]/.next-internal/server/app/plans/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/plans/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "40be870f8359042ca77e28750b5f416e2aa76019f9",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plans$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["selectPlan"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$plans$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$app$2f$plans$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/plans/page/actions.js { ACTIONS_MODULE0 => "[project]/app/plans/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plans$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/plans/actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_643c263c._.js.map
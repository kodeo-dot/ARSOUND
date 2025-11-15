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
"[project]/lib/supabase/server-client.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createServerClient",
    ()=>createServerClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
async function createServerClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://ebkcbcgpwmapjtrwojkm.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVia2NiY2dwd21hcGp0cndvamttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjAzNTUsImV4cCI6MjA3ODI5NjM1NX0.2a2C8NrVVrd_ouIDyCLH0mJGh8SvT7d_6OfAq6dy3TE"), {
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
"[project]/app/api/mercadopago/create-preference/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server-client.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;
        if (!accessToken || !publicKey) {
            console.error("[v0] Mercado Pago credentials not configured");
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Error al crear la preferencia de pago. Revisá las credenciales de Mercado Pago."
            }, {
                status: 500
            });
        }
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "No autorizado"
            }, {
                status: 401
            });
        }
        const body = await request.json();
        const { packId, planType, discountCode } = body;
        // Validate required fields
        if (!packId && !planType) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Se requiere packId o planType"
            }, {
                status: 400
            });
        }

        const APP_URL = process.env.NEXT_PUBLIC_APP_URL; // ej: "https://arsound.com"
        if (!APP_URL || !APP_URL.startsWith("http")) {
        throw new Error(
            "APP_URL no está definido o no tiene https:// (NEXT_PUBLIC_APP_URL o APP_URL)"
        );
        }
        const preferenceData = {
            back_urls: {
                success: `${APP_URL}/success`,
                failure: `${APP_URL}/failure`,
                pending: `${APP_URL}/pending`,
            },
            auto_return: "approved",
            notification_url: `${APP_URL}/api/webhooks/mercadopago`,
            payer: {
                email: user.email
            }
        };


        // Handle pack purchase
        if (packId) {
            const { data: pack, error: packError } = await supabase.from("packs").select("id, title, price, user_id").eq("id", packId).single();
            if (packError || !pack) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Pack no encontrado"
                }, {
                    status: 404
                });
            }
            let finalPrice = pack.price;
            // Apply discount code if provided
            if (discountCode) {
                const { data: discount, error: discountError } = await supabase.from("discount_codes").select("*").eq("pack_id", packId).eq("code", discountCode.toUpperCase()).single();
                if (!discountError && discount) {
                    finalPrice = pack.price * (1 - discount.discount_percent / 100);
                }
            }
            preferenceData.items = [
                {
                    id: pack.id,
                    title: pack.title,
                    quantity: 1,
                    unit_price: finalPrice,
                    currency_id: "ARS"
                }
            ];
            preferenceData.external_reference = `pack_${user.id}_${packId}`;
            preferenceData.metadata = {
                type: "pack_purchase",
                pack_id: packId,
                buyer_id: user.id,
                seller_id: pack.user_id,
                discount_code: discountCode || null
            };
        }
        // Handle plan subscription
        if (planType) {
            const planPrices = {
                de_0_a_hit: 5000,
                studio_plus: 15000
            };
            const price = planPrices[planType];
            if (!price) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Plan inválido"
                }, {
                    status: 400
                });
            }
            preferenceData.items = [
                {
                    id: planType,
                    title: `Plan ARSOUND - ${planType === "de_0_a_hit" ? "De 0 a Hit" : "Studio Plus"}`,
                    quantity: 1,
                    unit_price: price,
                    currency_id: "ARS"
                }
            ];
            preferenceData.external_reference = `plan_${user.id}_${planType}`;
            preferenceData.metadata = {
                type: "plan_subscription",
                plan_type: planType,
                user_id: user.id
            };
        }
        try {
            const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify(preferenceData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("[v0] Mercado Pago API error:", response.status, errorData);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Error al crear la preferencia de pago. Revisá las credenciales de Mercado Pago."
                }, {
                    status: 401
                });
            }
            const preference = await response.json();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                init_point: preference.init_point,
                preference_id: preference.id
            });
        } catch (apiError) {
            console.error("[v0] Error calling Mercado Pago API:", apiError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Error al crear la preferencia de pago. Revisá las credenciales de Mercado Pago."
            }, {
                status: 500
            });
        }
    } catch (error) {
        console.error("[v0] Error creating Mercado Pago preference:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Error al crear preferencia de pago"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7dc103f0._.js.map
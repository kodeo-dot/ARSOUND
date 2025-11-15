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
"[project]/lib/plans.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PLAN_BADGES",
    ()=>PLAN_BADGES,
    "PLAN_FEATURES",
    ()=>PLAN_FEATURES,
    "canEditPack",
    ()=>canEditPack,
    "canUploadPack",
    ()=>canUploadPack,
    "getMaxDiscountPercent",
    ()=>getMaxDiscountPercent,
    "getMaxFileSizeInBytes",
    ()=>getMaxFileSizeInBytes,
    "getMaxFileSizeMB",
    ()=>getMaxFileSizeMB,
    "getMaxFreeDownloads",
    ()=>getMaxFreeDownloads,
    "getPlanBadge",
    ()=>getPlanBadge,
    "getPlanCommission",
    ()=>getPlanCommission,
    "getPlanMaxPrice",
    ()=>getPlanMaxPrice,
    "hasPlanBadge",
    ()=>hasPlanBadge
]);
const PLAN_FEATURES = {
    free: {
        maxPacksPerMonth: null,
        maxTotalPacks: 3,
        maxPrice: 15000,
        maxFileSize: 80,
        commission: 0.15,
        canUseDiscountCodes: false,
        canAccessFullStats: false,
        featuredPriority: 0,
        canEditAfterDays: 15,
        canPinPack: false,
        canAddExternalLinks: false,
        maxFreeDownloads: 10,
        maxDiscountPercent: 10
    },
    de_0_a_hit: {
        maxPacksPerMonth: 10,
        maxTotalPacks: null,
        maxPrice: 65000,
        maxFileSize: 250,
        commission: 0.1,
        canUseDiscountCodes: true,
        canAccessFullStats: true,
        featuredPriority: 1,
        canEditAfterDays: null,
        canPinPack: false,
        canAddExternalLinks: false,
        maxFreeDownloads: null,
        maxDiscountPercent: 50
    },
    studio_plus: {
        maxPacksPerMonth: null,
        maxTotalPacks: null,
        maxPrice: null,
        maxFileSize: 500,
        commission: 0.03,
        canUseDiscountCodes: true,
        canAccessFullStats: true,
        featuredPriority: 2,
        canEditAfterDays: null,
        canPinPack: true,
        canAddExternalLinks: true,
        maxFreeDownloads: null,
        maxDiscountPercent: 100
    }
};
const PLAN_BADGES = {
    free: null,
    de_0_a_hit: {
        icon: "⚡",
        label: "De 0 a Hit",
        color: "text-orange-500"
    },
    studio_plus: {
        icon: "👑",
        label: "Studio Plus",
        color: "text-purple-500"
    }
};
function getPlanBadge(planType) {
    return PLAN_BADGES[planType];
}
function hasPlanBadge(planType) {
    return PLAN_BADGES[planType] !== null;
}
function getMaxDiscountPercent(planType) {
    return PLAN_FEATURES[planType].maxDiscountPercent;
}
function getMaxFileSizeInBytes(planType) {
    return PLAN_FEATURES[planType].maxFileSize * 1024 * 1024 // Convert MB to bytes
    ;
}
function getMaxFileSizeMB(planType) {
    return PLAN_FEATURES[planType].maxFileSize;
}
function canUploadPack(currentPlan, totalPacks, packsThisMonth) {
    const features = PLAN_FEATURES[currentPlan];
    if (features.maxTotalPacks !== null && totalPacks >= features.maxTotalPacks) {
        return {
            canUpload: false,
            reason: `Has alcanzado el límite de ${features.maxTotalPacks} packs totales del plan ${currentPlan.toUpperCase()}`
        };
    }
    if (features.maxPacksPerMonth !== null && packsThisMonth >= features.maxPacksPerMonth) {
        return {
            canUpload: false,
            reason: `Has alcanzado el límite de ${features.maxPacksPerMonth} packs por mes del plan ${currentPlan.toUpperCase()}`
        };
    }
    return {
        canUpload: true
    };
}
function canEditPack(currentPlan, packCreatedAt) {
    const features = PLAN_FEATURES[currentPlan];
    if (features.canEditAfterDays === null) {
        return {
            canEdit: true
        };
    }
    const daysSinceCreation = Math.floor((Date.now() - packCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation > features.canEditAfterDays) {
        return {
            canEdit: false,
            reason: `El plan ${currentPlan.toUpperCase()} solo permite editar packs durante los primeros ${features.canEditAfterDays} días`
        };
    }
    return {
        canEdit: true
    };
}
function getPlanCommission(planType) {
    return PLAN_FEATURES[planType].commission;
}
function getPlanMaxPrice(planType) {
    return PLAN_FEATURES[planType].maxPrice;
}
function getMaxFreeDownloads(planType) {
    return PLAN_FEATURES[planType].maxFreeDownloads;
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
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$plans$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/plans.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
/**
 * Helper to get the origin URL dynamically from request headers
 * Falls back to environment variable if headers unavailable
 */ async function getOrigin() {
    const appUrl = ("TURBOPACK compile-time value", "https://localhost:3000");
    console.log("[v0] NEXT_PUBLIC_APP_URL value:", appUrl);
    if (appUrl && appUrl.trim().length > 0 && appUrl.startsWith("http")) {
        console.log("[v0] Using NEXT_PUBLIC_APP_URL:", appUrl);
        return appUrl;
    }
    try {
        const headersList = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["headers"])();
        const host = headersList.get("host");
        const proto = headersList.get("x-forwarded-proto") || "http";
        let finalProto = proto;
        if (host?.includes("localhost") || host?.includes("127.0.0.1")) {
            finalProto = "http";
            console.log("[v0] Detected localhost, forcing HTTP protocol");
        }
        if (host) {
            const origin = `${finalProto}://${host}`;
            console.log("[v0] Constructed origin from headers:", origin);
            return origin;
        }
    } catch (e) {
        console.log("[v0] Could not read headers, falling back to default");
    }
    const fallback = "http://localhost:3000";
    console.log("[v0] Using fallback origin:", fallback);
    return fallback;
}
/**
 * Server action to create Mercado Pago preference for plan selection
 * Now fully on server - no fetch call needed
 */ async function createMercadoPagoPreference(planType) {
    const testMode = process.env.MERCADO_PAGO_TEST_MODE === "true";
    const accessToken = testMode ? process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN : process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const publicKey = testMode ? process.env.MERCADO_PAGO_TEST_PUBLIC_KEY : process.env.MERCADO_PAGO_PUBLIC_KEY;
    if (!accessToken || !publicKey) {
        console.error("[v0] Mercado Pago credentials not configured. TestMode:", testMode);
        return {
            success: false,
            message: "Error al configurar el pago. Contacta con soporte."
        };
    }
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return {
            success: false,
            message: "Por favor inicia sesión para continuar"
        };
    }
    try {
        const planPrices = {
            de_0_a_hit: 5000,
            de_0_a_hit_monthly: 5000,
            studio_plus: 15000,
            studio_plus_monthly: 15000
        };
        const price = planPrices[planType];
        if (!price) {
            return {
                success: false,
                message: "Plan inválido"
            };
        }
        const origin = await getOrigin();
        console.log("[v0] Final origin being used:", origin);
        const preferenceData = {
            back_urls: {
                success: `${origin}/payment/success`,
                failure: `${origin}/payment/failure`,
                pending: `${origin}/payment/pending`
            },
            notification_url: `${origin}/api/webhooks/mercadopago`,
            auto_return: "approved",
            payer: {
                email: user.email
            },
            items: [
                {
                    id: planType,
                    title: `Plan ARSOUND - ${planType.includes("de_0") ? "De 0 a Hit" : "Studio Plus"}`,
                    quantity: 1,
                    unit_price: price,
                    currency_id: "ARS"
                }
            ],
            external_reference: `plan_${user.id}_${planType}`,
            metadata: {
                type: "plan_subscription",
                plan_type: planType,
                user_id: user.id,
                test_mode: testMode
            }
        };
        console.log("[v0] Preference data being sent:", JSON.stringify(preferenceData, null, 2));
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
            console.error("[v0] Mercado Pago API error:", errorData);
            return {
                success: false,
                message: "Error al crear la preferencia de pago. Revisá las credenciales."
            };
        }
        const preference = await response.json();
        if (!preference.init_point) {
            console.error("[v0] Mercado Pago response missing init_point:", preference);
            return {
                success: false,
                message: "Error al procesar el pago. Intenta de nuevo."
            };
        }
        return {
            success: true,
            init_point: preference.init_point,
            preferenceId: preference.id
        };
    } catch (error) {
        console.error("[v0] Error in createMercadoPagoPreference:", error);
        return {
            success: false,
            message: "Error al crear la preferencia de pago"
        };
    }
}
async function selectPlan(planId) {
    if (!planId || planId === "free") {
        return {
            success: false,
            message: "Plan inválido"
        };
    }
    return createMercadoPagoPreference(planId);
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
    const testMode = process.env.MERCADO_PAGO_TEST_MODE === "true";
    const accessToken = testMode ? process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN : process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const publicKey = testMode ? process.env.MERCADO_PAGO_TEST_PUBLIC_KEY : process.env.MERCADO_PAGO_PUBLIC_KEY;
    if (!accessToken || !publicKey) {
        console.error("[v0] Mercado Pago credentials not configured. TestMode:", testMode);
        return {
            success: false,
            message: "Error al configurar el pago. Contacta con soporte."
        };
    }
    try {
        const { data: pack, error: packError } = await supabase.from("packs").select("id, title, price, user_id, discount_percent, has_discount").eq("id", packId).single();
        if (packError || !pack) {
            return {
                success: false,
                message: "Pack no encontrado"
            };
        }
        const { data: sellerProfile, error: sellerError } = await supabase.from("profiles").select("plan").eq("id", pack.user_id).single();
        if (sellerError || !sellerProfile) {
            return {
                success: false,
                message: "No se pudo obtener información del vendedor"
            };
        }
        const sellerPlan = sellerProfile.plan || "free";
        const commission = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$plans$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PLAN_FEATURES"][sellerPlan].commission;
        let finalPrice = pack.price;
        let appliedDiscountPercent = 0;
        if (discountCode) {
            const { data: discountData, error: discountError } = await supabase.from("discount_codes").select("*").eq("pack_id", packId).eq("code", discountCode.toUpperCase()).single();
            if (!discountError && discountData) {
                if (discountData.expires_at && new Date(discountData.expires_at) < new Date()) {
                    return {
                        success: false,
                        message: "El código de descuento ha expirado"
                    };
                }
                if (discountData.max_uses && discountData.uses_count >= discountData.max_uses) {
                    return {
                        success: false,
                        message: "El código ha alcanzado el límite de usos"
                    };
                }
                appliedDiscountPercent = discountData.discount_percent;
                finalPrice = Math.floor(pack.price * (1 - appliedDiscountPercent / 100));
            }
        }
        const commissionAmount = Math.floor(finalPrice * commission);
        const sellerEarnings = finalPrice - commissionAmount;
        const origin = await getOrigin();
        console.log("[v0] Final origin being used:", origin);
        const preferenceData = {
            back_urls: {
                success: `${origin}/payment/success`,
                failure: `${origin}/payment/failure`,
                pending: `${origin}/payment/pending`
            },
            notification_url: `${origin}/api/webhooks/mercadopago`,
            auto_return: "approved",
            payer: {
                email: user.email
            },
            items: [
                {
                    id: pack.id,
                    title: pack.title,
                    quantity: 1,
                    unit_price: finalPrice,
                    currency_id: "ARS"
                }
            ],
            external_reference: `pack_${user.id}_${packId}`,
            marketplace_fee: commissionAmount,
            transfer_data: {
                amount: sellerEarnings,
                receiver_account_id: null
            },
            metadata: {
                type: "pack_purchase",
                pack_id: packId,
                buyer_id: user.id,
                seller_id: pack.user_id,
                seller_plan: sellerPlan,
                commission_percent: commission,
                commission_amount: commissionAmount,
                seller_earnings: sellerEarnings,
                final_price: finalPrice,
                discount_percent: appliedDiscountPercent,
                discount_code: discountCode || null,
                test_mode: testMode
            }
        };
        console.log("[v0] Preference data being sent:", JSON.stringify(preferenceData, null, 2));
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
            console.error("[v0] Mercado Pago API error:", errorData);
            return {
                success: false,
                message: "Error al crear la preferencia de pago. Intenta de nuevo."
            };
        }
        const preference = await response.json();
        if (!preference.init_point) {
            console.error("[v0] No init_point in response:", preference);
            return {
                success: false,
                message: "Error al procesar el pago. Intenta de nuevo."
            };
        }
        return {
            success: true,
            init_point: preference.init_point,
            preferenceId: preference.id
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
"[project]/.next-internal/server/app/pack/[id]/checkout/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/plans/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plans$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/plans/actions.ts [app-rsc] (ecmascript)");
;
;
}),
"[project]/.next-internal/server/app/pack/[id]/checkout/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/plans/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "40be870f8359042ca77e28750b5f416e2aa76019f9",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plans$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["selectPlan"],
    "602a987240095d3728e5c1a475bf3528455f3497e5",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plans$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["purchasePack"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$pack$2f5b$id$5d2f$checkout$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$app$2f$plans$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/pack/[id]/checkout/page/actions.js { ACTIONS_MODULE0 => "[project]/app/plans/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$plans$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/plans/actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_12729e4d._.js.map
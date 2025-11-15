module.exports = [
"[project]/app/plans/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40be870f8359042ca77e28750b5f416e2aa76019f9":"selectPlan","602a987240095d3728e5c1a475bf3528455f3497e5":"purchasePack"},"",""] */ __turbopack_context__.s([
    "purchasePack",
    ()=>purchasePack,
    "selectPlan",
    ()=>selectPlan
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@/lib/supabase/server-client'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module '@/lib/plans'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
/**
 * Helper to get the origin URL dynamically from request headers
 */ async function getOrigin() {
    const headersList = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["headers"])();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    return `${protocol}://${host}`;
}
/**
 * Server action to create Mercado Pago preference for plan selection
 * Now fully on server - no fetch call needed
 */ async function createMercadoPagoPreference(planType) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;
    if (!accessToken || !publicKey) {
        console.error("[v0] Mercado Pago credentials not configured");
        return {
            success: false,
            message: "Error al configurar el pago. Contacta con soporte."
        };
    }
    const supabase = await createServerClient();
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
                user_id: user.id
            }
        };
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
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return {
            success: false,
            message: "Por favor inicia sesión para continuar"
        };
    }
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;
    if (!accessToken || !publicKey) {
        console.error("[v0] Mercado Pago credentials not configured");
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
        const commission = PLAN_FEATURES[sellerPlan].commission;
        let finalPrice = pack.price;
        if (pack.has_discount && pack.discount_percent) {
            finalPrice = Math.floor(pack.price * (1 - pack.discount_percent / 100));
        }
        const commissionAmount = Math.floor(finalPrice * commission);
        const sellerEarnings = finalPrice - commissionAmount;
        const origin = await getOrigin();
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
                discount_percent: pack.has_discount ? pack.discount_percent : 0
            }
        };
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

//# sourceMappingURL=_7f9bd88e._.js.map
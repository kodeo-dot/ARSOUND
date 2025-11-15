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
"[project]/lib/plans-actions.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40a228cd9b35a00699a217dad9249b3860d69cd7e8":"testChangePlan","40ce11cd416688d65f94af4ac7bd01a474ad1fae41":"getUserPlan","70717983cfed9e4331e58948bc081250fae6180c9f":"updateUserPlan"},"",""] */ __turbopack_context__.s([
    "getUserPlan",
    ()=>getUserPlan,
    "testChangePlan",
    ()=>testChangePlan,
    "updateUserPlan",
    ()=>updateUserPlan
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server-client.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-route] (ecmascript)");
;
;
async function updateUserPlan(userId, planType, expiresAt) {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
        // Deactivate all existing plans for this user
        const { error: deactivateError } = await supabase.from("user_plans").update({
            is_active: false
        }).eq("user_id", userId);
        if (deactivateError) {
            console.error("[v0] Error deactivating plans:", deactivateError);
            return {
                success: false,
                error: deactivateError.message
            };
        }
        // Insert new plan
        const { error: insertError } = await supabase.from("user_plans").insert({
            user_id: userId,
            plan_type: planType,
            is_active: true,
            started_at: new Date().toISOString(),
            expires_at: expiresAt ? expiresAt.toISOString() : null
        });
        if (insertError) {
            console.error("[v0] Error inserting new plan:", insertError);
            return {
                success: false,
                error: insertError.message
            };
        }
        return {
            success: true
        };
    } catch (error) {
        console.error("[v0] Error updating user plan:", error);
        return {
            success: false,
            error: error.message || "Unknown error"
        };
    }
}
async function getUserPlan(userId) {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
        const { data, error } = await supabase.rpc("get_user_plan", {
            p_user_id: userId
        });
        if (error) {
            console.error("[v0] Error fetching user plan:", error);
            return {
                plan: "free",
                error: error.message
            };
        }
        return {
            plan: data?.plan_type || "free"
        };
    } catch (error) {
        console.error("[v0] Error getting user plan:", error);
        return {
            plan: "free",
            error: error.message || "Unknown error"
        };
    }
}
async function testChangePlan(planType) {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return {
                success: false,
                error: "No authenticated user"
            };
        }
        return await updateUserPlan(user.id, planType, null);
    } catch (error) {
        return {
            success: false,
            error: error.message || "Unknown error"
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    updateUserPlan,
    getUserPlan,
    testChangePlan
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(updateUserPlan, "70717983cfed9e4331e58948bc081250fae6180c9f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(getUserPlan, "40ce11cd416688d65f94af4ac7bd01a474ad1fae41", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(testChangePlan, "40a228cd9b35a00699a217dad9249b3860d69cd7e8", null);
}),
"[project]/lib/plans.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/app/api/packs/upload/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server-client.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$plans$2d$actions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/plans-actions.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$plans$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/plans.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
;
;
;
async function POST(request) {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        const body = await request.json();
        const { title, description, genre, bpm, price, tags, cover_image_url, demo_audio_url, file_url, has_discount, discount_percent, discountCode, discountType } = body;
        console.log("[v0] Upload request received:", {
            title,
            user_id: user.id,
            price
        });
        if (!title || !description || !genre || price === undefined || !file_url) {
            const missingFields = [];
            if (!title) missingFields.push("title");
            if (!description) missingFields.push("description");
            if (!genre) missingFields.push("genre");
            if (price === undefined) missingFields.push("price");
            if (!file_url) missingFields.push("file_url");
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Validation failed",
                details: `Missing required fields: ${missingFields.join(", ")}`,
                missingFields
            }, {
                status: 400
            });
        }
        if (!file_url.startsWith("https://")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Invalid file URL",
                details: "file_url must be a full HTTPS URL from Supabase Storage"
            }, {
                status: 400
            });
        }
        // Get user plan
        const { plan, error: planError } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$plans$2d$actions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserPlan"])(user.id);
        if (planError) {
            console.error("[v0] Error getting user plan:", planError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Could not verify user plan",
                details: planError
            }, {
                status: 500
            });
        }
        console.log("User plan:", plan);
        const planLimits = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$plans$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PLAN_FEATURES"][plan];
        const priceNum = Number.parseInt(price);
        if (priceNum > 0) {
            const { data: profile, error: profileError } = await supabase.from("profiles").select("mp_connected").eq("id", user.id).single();
            if (profileError || !profile?.mp_connected) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Mercado Pago not connected",
                    details: "Necesitás conectar tu cuenta de Mercado Pago para vender packs. Andá a tu perfil para conectarla."
                }, {
                    status: 403
                });
            }
        }
        if (plan === "free") {
            // FREE plan: check TOTAL packs limit (3 total)
            const { data: totalPacks, error: totalError } = await supabase.rpc("count_total_packs", {
                p_user_id: user.id
            });
            console.log("[v0] FREE plan - Total packs:", totalPacks, "/ Limit:", planLimits.maxTotalPacks);
            if (totalError) {
                console.error("[v0] Error checking total packs:", totalError);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Could not verify upload limit",
                    details: "Failed to check your upload quota"
                }, {
                    status: 500
                });
            }
            if (planLimits.maxTotalPacks !== null && (totalPacks || 0) >= planLimits.maxTotalPacks) {
                console.log("[v0] Upload blocked: FREE plan limit reached");
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Upload limit reached",
                    details: `Alcanzaste tu límite de ${planLimits.maxTotalPacks} packs totales en el plan FREE. Mejorá tu plan para subir más.`,
                    current: totalPacks,
                    limit: planLimits.maxTotalPacks
                }, {
                    status: 403
                });
            }
            console.log("[v0] FREE plan validation passed");
        } else if (plan === "de_0_a_hit") {
            // DE_0_A_HIT plan: check MONTHLY packs limit (10 per month)
            const { data: packsThisMonth, error: statsError } = await supabase.rpc("count_packs_this_month", {
                p_user_id: user.id
            });
            console.log("[v0] DE_0_A_HIT plan - Packs this month:", packsThisMonth, "/ Limit:", planLimits.maxPacksPerMonth);
            if (statsError) {
                console.error("[v0] Error checking monthly packs:", statsError);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Could not verify upload limit",
                    details: "Failed to check your monthly upload quota"
                }, {
                    status: 500
                });
            }
            if (planLimits.maxPacksPerMonth !== null && (packsThisMonth || 0) >= planLimits.maxPacksPerMonth) {
                console.log("[v0] Upload blocked: DE_0_A_HIT monthly limit reached");
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Upload limit reached",
                    details: `Alcanzaste tu límite de ${planLimits.maxPacksPerMonth} packs por mes en el plan De 0 a Hit. Esperá al próximo mes o mejorá tu plan.`,
                    current: packsThisMonth,
                    limit: planLimits.maxPacksPerMonth
                }, {
                    status: 403
                });
            }
            console.log("[v0] DE_0_A_HIT plan validation passed");
        } else if (plan === "studio_plus") {
            // STUDIO_PLUS: no limits
            console.log("[v0] STUDIO_PLUS plan - no limits, validation passed");
        }
        if (planLimits.maxPrice !== null && priceNum > planLimits.maxPrice) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Price exceeds limit",
                details: `El precio máximo para tu plan ${plan} es $${planLimits.maxPrice.toLocaleString()} ARS.`,
                current: priceNum,
                limit: planLimits.maxPrice
            }, {
                status: 403
            });
        }
        if (has_discount && discount_percent) {
            const maxDiscount = planLimits.maxDiscountPercent;
            if (Number.parseInt(discount_percent) > maxDiscount) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Discount exceeds limit",
                    details: `Tu plan ${plan} permite máximo ${maxDiscount}% de descuento.`,
                    current: discount_percent,
                    limit: maxDiscount
                }, {
                    status: 403
                });
            }
        }
        console.log("[v0] All validations passed, creating pack...");
        let packData = {
            user_id: user.id,
            title,
            description,
            genre,
            bpm: bpm || null,
            price: priceNum,
            cover_image_url: cover_image_url || null,
            demo_audio_url,
            file_url,
            tags: tags || [],
            has_discount: has_discount || false,
            discount_percent: has_discount ? Number.parseInt(discount_percent) : 0
        };
        // Try with archived column first
        let { data: pack, error: packError } = await supabase.from("packs").insert({
            ...packData,
            archived: false
        }).select().single();
        // If archived column doesn't exist, try without it
        if (packError && packError.code === '42703') {
            console.log("[v0] Archived column doesn't exist yet, inserting without it");
            const result = await supabase.from("packs").insert(packData).select().single();
            pack = result.data;
            packError = result.error;
        }
        if (packError) {
            console.error("[v0] Error inserting pack:", packError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Failed to create pack",
                details: `Database error: ${packError.message}`,
                code: packError.code
            }, {
                status: 500
            });
        }
        console.log("[v0] Pack created successfully:", pack?.id);
        if (has_discount && discountCode && pack?.id) {
            console.log("[v0] Creating discount code:", {
                code: discountCode,
                pack_id: pack.id,
                discount_percent: Number.parseInt(discount_percent),
                type: discountType
            });
            const { error: discountError } = await supabase.from("discount_codes").insert({
                pack_id: pack.id,
                code: discountCode.toUpperCase(),
                discount_percent: Number.parseInt(discount_percent),
                for_all_users: discountType === "all",
                for_first_purchase: discountType === "first",
                for_followers: discountType === "followers",
                max_uses: null,
                expires_at: null
            });
            if (discountError) {
                console.error("[v0] Error creating discount code:", discountError);
            } else {
                console.log("[v0] Discount code created successfully");
            }
        }
        const { error: updateError } = await supabase.rpc("increment", {
            table_name: "profiles",
            row_id: user.id,
            column_name: "packs_count"
        });
        if (updateError) {
            console.error("[v0] Error updating packs_count:", updateError);
        }
        console.log("[v0] Upload complete successfully!");
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            pack,
            message: "Pack uploaded successfully"
        });
    } catch (error) {
        console.error("[v0] Upload error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Internal server error",
            details: error.message || "An unexpected error occurred during upload"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c72244e9._.js.map
module.exports=[18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},34640,e=>{"use strict";var t=e.i(47909),r=e.i(74017),i=e.i(96250),a=e.i(59756),n=e.i(61916),o=e.i(14444),s=e.i(37092),d=e.i(69741),l=e.i(16795),u=e.i(87718),E=e.i(95169),p=e.i(47587),c=e.i(66012),T=e.i(70101),_=e.i(26937),R=e.i(10372),N=e.i(93695);e.i(52474);var A=e.i(5232),m=e.i(59607),x=e.i(89171);let L=[`CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    avatar_url text,
    bio text,
    display_name text,
    plan text DEFAULT 'free' CHECK (plan IN ('free', 'de-0-a-hit', 'studio-plus')),
    followers_count integer DEFAULT 0,
    total_sales integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
  );`,`CREATE TABLE IF NOT EXISTS public.packs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    genre text,
    bpm text,
    price integer DEFAULT 0,
    cover_image_url text,
    demo_audio_url text,
    file_url text,
    tags text[] DEFAULT '{}'::text[],
    has_discount boolean DEFAULT false,
    discount_percent integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    downloads_count integer DEFAULT 0,
    total_plays integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
  );`,`CREATE TABLE IF NOT EXISTS public.pack_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, pack_id)
  );`,`CREATE TABLE IF NOT EXISTS public.purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    discount_amount integer DEFAULT 0,
    platform_commission integer DEFAULT 0,
    creator_earnings integer DEFAULT 0,
    status text DEFAULT 'completed',
    payment_method text,
    mercado_pago_payment_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
  );`,`CREATE TABLE IF NOT EXISTS public.pack_downloads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
    downloaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, pack_id)
  );`,`CREATE TABLE IF NOT EXISTS public.discount_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
    code text NOT NULL,
    discount_percent integer NOT NULL,
    expires_at timestamp with time zone,
    max_uses integer,
    uses_count integer DEFAULT 0,
    for_all_users boolean DEFAULT true,
    for_first_purchase boolean DEFAULT false,
    for_followers boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(pack_id, code)
  );`,`CREATE TABLE IF NOT EXISTS public.followers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(follower_id, following_id)
  );`,`CREATE OR REPLACE FUNCTION public.can_download_free_pack(p_user_id uuid, p_pack_id uuid)
  RETURNS boolean AS $$
  DECLARE
    pack_price integer;
    user_plan text;
    download_count integer;
    month_start timestamp;
  BEGIN
    SELECT price INTO pack_price FROM public.packs WHERE id = p_pack_id;
    
    IF pack_price IS NULL THEN
      RETURN false;
    END IF;
    
    IF pack_price > 0 THEN
      SELECT COUNT(*) INTO download_count FROM public.purchases 
      WHERE buyer_id = p_user_id AND pack_id = p_pack_id;
      RETURN download_count > 0;
    ELSE
      SELECT plan INTO user_plan FROM public.profiles WHERE id = p_user_id;
      
      IF user_plan = 'free' THEN
        month_start := DATE_TRUNC('month', NOW());
        SELECT COUNT(*) INTO download_count FROM public.pack_downloads 
        WHERE user_id = p_user_id AND downloaded_at >= month_start;
        RETURN download_count < 10;
      END IF;
      RETURN true;
    END IF;
  END;
  $$ LANGUAGE plpgsql;`];async function C(){try{for(let e of(await (0,m.createServerClient)(),L))try{let[t]=e.split(/\s+/).filter(e=>e);"CREATE"===t&&console.log("[v0] Initializing database schema...")}catch(e){console.error("[v0] Error in init script:",e)}return x.NextResponse.json({success:!0,message:"Database initialization check complete",timestamp:new Date().toISOString()})}catch(e){return console.error("[v0] Init error:",e),x.NextResponse.json({success:!1,error:"Database initialization failed"},{status:500})}}e.s(["GET",()=>C],86673);var h=e.i(86673);let U=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/init/route",pathname:"/api/init",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/init/route.ts",nextConfigOutput:"",userland:h}),{workAsyncStorage:f,workUnitAsyncStorage:g,serverHooks:D}=U;function w(){return(0,i.patchFetch)({workAsyncStorage:f,workUnitAsyncStorage:g})}async function F(e,t,i){U.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let m="/api/init/route";m=m.replace(/\/index$/,"")||"/";let x=await U.prepare(e,t,{srcPage:m,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:L,params:C,nextConfig:h,parsedUrl:f,isDraftMode:g,prerenderManifest:D,routerServerContext:w,isOnDemandRevalidate:F,revalidateOnlyGenerated:O,resolvedPathname:S,clientReferenceManifest:b,serverActionsManifest:v}=x,I=(0,d.normalizeAppPath)(m),k=!!(D.dynamicRoutes[I]||D.routes[S]),y=async()=>((null==w?void 0:w.render404)?await w.render404(e,t,f,!1):t.end("This page could not be found"),null);if(k&&!g){let e=!!D.routes[S],t=D.dynamicRoutes[I];if(t&&!1===t.fallback&&!e){if(h.experimental.adapterPath)return await y();throw new N.NoFallbackError}}let P=null;!k||U.isDev||g||(P="/index"===(P=S)?"/":P);let M=!0===U.isDev||!k,H=k&&!M;v&&b&&(0,o.setReferenceManifestsSingleton)({page:m,clientReferenceManifest:b,serverActionsManifest:v,serverModuleMap:(0,s.createServerModuleMap)({serverActionsManifest:v})});let q=e.method||"GET",z=(0,n.getTracer)(),j=z.getActiveScopeSpan(),K={params:C,prerenderManifest:D,renderOpts:{experimental:{authInterrupts:!!h.experimental.authInterrupts},cacheComponents:!!h.cacheComponents,supportsDynamicResponse:M,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:h.cacheLife,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,i)=>U.onRequestError(e,t,i,w)},sharedContext:{buildId:L}},Y=new l.NodeNextRequest(e),B=new l.NodeNextResponse(t),$=u.NextRequestAdapter.fromNodeNextRequest(Y,(0,u.signalFromNodeResponse)(t));try{let o=async e=>U.handle($,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=z.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==E.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let i=r.get("next.route");if(i){let t=`${q} ${i}`;e.setAttributes({"next.route":i,"http.route":i,"next.span_name":t}),e.updateName(t)}else e.updateName(`${q} ${m}`)}),s=!!(0,a.getRequestMeta)(e,"minimalMode"),d=async a=>{var n,d;let l=async({previousCacheEntry:r})=>{try{if(!s&&F&&O&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await o(a);e.fetchMetrics=K.renderOpts.fetchMetrics;let d=K.renderOpts.pendingWaitUntil;d&&i.waitUntil&&(i.waitUntil(d),d=void 0);let l=K.renderOpts.collectedTags;if(!k)return await (0,c.sendResponse)(Y,B,n,K.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,T.toNodeOutgoingHttpHeaders)(n.headers);l&&(t[R.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,i=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:A.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:i}}}}catch(t){throw(null==r?void 0:r.isStale)&&await U.onRequestError(e,t,{routerKind:"App Router",routePath:m,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:F})},w),t}},u=await U.handleResponse({req:e,nextConfig:h,cacheKey:P,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:D,isRoutePPREnabled:!1,isOnDemandRevalidate:F,revalidateOnlyGenerated:O,responseGenerator:l,waitUntil:i.waitUntil,isMinimalMode:s});if(!k)return null;if((null==u||null==(n=u.value)?void 0:n.kind)!==A.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(d=u.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",F?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),g&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let E=(0,T.fromNodeOutgoingHttpHeaders)(u.value.headers);return s&&k||E.delete(R.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||E.get("Cache-Control")||E.set("Cache-Control",(0,_.getCacheControlHeader)(u.cacheControl)),await (0,c.sendResponse)(Y,B,new Response(u.value.body,{headers:E,status:u.value.status||200})),null};j?await d(j):await z.withPropagatedContext(e.headers,()=>z.trace(E.BaseServerSpan.handleRequest,{spanName:`${q} ${m}`,kind:n.SpanKind.SERVER,attributes:{"http.method":q,"http.target":e.url}},d))}catch(t){if(t instanceof N.NoFallbackError||await U.onRequestError(e,t,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:F})}),k)throw t;return await (0,c.sendResponse)(Y,B,new Response(null,{status:500})),null}}e.s(["handler",()=>F,"patchFetch",()=>w,"routeModule",()=>U,"serverHooks",()=>D,"workAsyncStorage",()=>f,"workUnitAsyncStorage",()=>g],34640)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__2a6fc48c._.js.map
# 🗄️ Inicialización de Base de Datos - ARSOUND

## ⚠️ PROBLEMA ACTUAL

Las tablas de la base de datos **NO EXISTEN** en tu Supabase. Por eso:
- El contador de descargas no se actualiza
- Las descargas restantes no se decrementan
- El sistema de planes no funciona

## ✅ SOLUCIÓN

Debes copiar y ejecutar los scripts SQL en **Supabase SQL Editor**.

### Paso 1: Accede a Supabase SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. En el menú izquierdo, haz clic en **SQL Editor**
3. Haz clic en el botón **+ New Query**

### Paso 2: Ejecuta los Scripts SQL

Copia y pega **CADA UNO** de estos scripts EN ORDEN en el SQL Editor:

---

## Script 1: Crear tabla `profiles`

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  display_name text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'de-0-a-hit', 'studio-plus')),
  followers_count integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  packs_count integer DEFAULT 0,
  total_plays integer DEFAULT 0,
  total_likes_received integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_plan_idx ON public.profiles(plan);
\`\`\`

Después de ejecutar, haz clic en **Run** (o Ctrl+Enter).

---

## Script 2: Crear tabla `packs`

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price integer DEFAULT 0,
  cover_image_url text,
  demo_audio_url text,
  file_url text NOT NULL,
  genre text,
  bpm integer,
  tags text[],
  has_discount boolean DEFAULT false,
  discount_percent integer DEFAULT 0,
  downloads_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  plays_count integer DEFAULT 0,
  musical_key text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS packs_user_id_idx ON public.packs(user_id);
CREATE INDEX IF NOT EXISTS packs_price_idx ON public.packs(price);
CREATE INDEX IF NOT EXISTS packs_genre_idx ON public.packs(genre);
\`\`\`

---

## Script 3: Crear tabla `pack_likes`

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.pack_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, pack_id)
);

ALTER TABLE public.pack_likes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS pack_likes_user_id_idx ON public.pack_likes(user_id);
CREATE INDEX IF NOT EXISTS pack_likes_pack_id_idx ON public.pack_likes(pack_id);
\`\`\`

---

## Script 4: Crear tabla `purchases`

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES public.packs(id),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id),
  seller_id uuid NOT NULL REFERENCES public.profiles(id),
  amount integer NOT NULL,
  commission integer NOT NULL,
  mercadopago_payment_id text UNIQUE,
  stripe_payment_id text UNIQUE,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text DEFAULT 'mercadopago',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS purchases_buyer_id_idx ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS purchases_seller_id_idx ON public.purchases(seller_id);
CREATE INDEX IF NOT EXISTS purchases_pack_id_idx ON public.purchases(pack_id);
\`\`\`

---

## Script 5: Crear tabla `pack_downloads`

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.pack_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pack_downloads ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS pack_downloads_user_id_idx ON public.pack_downloads(user_id);
CREATE INDEX IF NOT EXISTS pack_downloads_pack_id_idx ON public.pack_downloads(pack_id);
CREATE INDEX IF NOT EXISTS pack_downloads_created_at_idx ON public.pack_downloads(created_at);
\`\`\`

---

## Script 6: Crear tabla `discount_codes`

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent integer NOT NULL,
  max_uses integer,
  current_uses integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS discount_codes_code_idx ON public.discount_codes(code);
\`\`\`

---

## Script 7: Crear tabla `followers`

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS followers_follower_id_idx ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS followers_following_id_idx ON public.followers(following_id);
\`\`\`

---

## Script 8: Crear Funciones RPC

\`\`\`sql
-- Función para verificar si se puede descargar (free plan)
CREATE OR REPLACE FUNCTION public.can_download_free_pack(
  p_user_id uuid,
  p_pack_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_user_plan text;
  v_pack_price integer;
  v_current_downloads integer;
  v_limit integer;
BEGIN
  -- Obtener plan del usuario
  SELECT plan INTO v_user_plan FROM public.profiles WHERE id = p_user_id;
  
  -- Obtener precio del pack
  SELECT price INTO v_pack_price FROM public.packs WHERE id = p_pack_id;
  
  -- Si el pack no es gratis, permitir (es compra)
  IF v_pack_price > 0 THEN
    RETURN jsonb_build_object('can_download', true);
  END IF;
  
  -- Contar descargas del mes actual
  SELECT COUNT(*) INTO v_current_downloads 
  FROM public.pack_downloads 
  WHERE user_id = p_user_id 
  AND created_at >= date_trunc('month', CURRENT_DATE);
  
  -- Definir límite según plan
  v_limit := CASE v_user_plan
    WHEN 'free' THEN 10
    WHEN 'de-0-a-hit' THEN 50
    WHEN 'studio-plus' THEN 99999
    ELSE 10
  END;
  
  RETURN jsonb_build_object(
    'can_download', v_current_downloads < v_limit,
    'current_downloads', v_current_downloads,
    'limit', v_limit,
    'message', CASE 
      WHEN v_current_downloads >= v_limit THEN 'Alcanzaste tu límite de descargas'
      ELSE NULL
    END,
    'reason', CASE 
      WHEN v_current_downloads >= v_limit THEN 'limit_exceeded'
      ELSE NULL
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar contadores
CREATE OR REPLACE FUNCTION public.increment(
  table_name text,
  row_id uuid,
  column_name text
)
RETURNS void AS $$
BEGIN
  IF table_name = 'packs' AND column_name = 'downloads_count' THEN
    UPDATE public.packs SET downloads_count = downloads_count + 1 WHERE id = row_id;
  ELSIF table_name = 'packs' AND column_name = 'plays_count' THEN
    UPDATE public.packs SET plays_count = plays_count + 1 WHERE id = row_id;
  ELSIF table_name = 'profiles' AND column_name = 'total_plays' THEN
    UPDATE public.profiles SET total_plays = total_plays + 1 WHERE id = row_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener oferta activa
CREATE OR REPLACE FUNCTION public.get_active_offer(p_pack_id uuid)
RETURNS TABLE (
  discount_percent integer,
  discount_reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((packs.price * 15) / 100, 0)::integer,
    'Oferta por compra recurrente'::text
  FROM public.packs
  WHERE id = p_pack_id;
END;
$$ LANGUAGE plpgsql;
\`\`\`

---

## ✅ Después de ejecutar todos los scripts:

1. Vuelve a tu app en v0
2. Recarga la página (`F5`)
3. Intenta descargar un pack gratis
4. El contador debe actualizarse ✅

---

## 🆘 Troubleshooting

### Error: "relation already exists"
- **Solución**: Ignora este error, significa que la tabla ya existe

### Las tablas se crean pero sigue sin funcionar
- **Verifica**: 
  - Los scripts ejecutaron sin errores (chequea la terminal en rojo)
  - Tu usuario está autenticado en la app
  - El pack tiene `price = 0`

### Error al descargar: "Could not find the table"
- **Solución**: Los scripts no se ejecutaron correctamente. Repite desde el Paso 2.

---

## 📋 Checklist Final

- [ ] Accediste a Supabase SQL Editor
- [ ] Ejecutaste los 8 scripts en orden
- [ ] No hay errores en rojo (warnings en amarillo están OK)
- [ ] Recargaste la app
- [ ] Probaste descargar un pack gratis
- [ ] El contador de descargas aumentó ✅
</parameter>

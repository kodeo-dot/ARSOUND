import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createAdminClient } from "@/lib/supabase/server-client"; // Ajustá esta ruta a tu proyecto

export async function createPackPreference(packId: string, buyerId: string, buyerEmail: string) {
  // Inicializamos el cliente de Supabase con el rol de admin para poder leer el token del vendedor
  const adminSupabase = await createAdminClient();

  // 1. Buscamos los datos del pack y el TOKEN DEL VENDEDOR
  const { data: pack, error: packError } = await adminSupabase
    .from("packs")
    .select(`
      *,
      profiles:user_id (mp_seller_token, plan)
    `)
    .eq("id", packId)
    .single();

  if (packError || !pack) throw new Error("Pack no encontrado");

  // Cast para TypeScript (asumiendo que profiles es un objeto y no un array)
  const sellerProfile = pack.profiles as any; 
  const sellerToken = sellerProfile?.mp_seller_token;

  if (!sellerToken) {
    throw new Error("El productor aún no vinculó su cuenta de Mercado Pago.");
  }

  // 2. Calculamos la comisión
  // (Asegurate de tener definida getCommissionByPlan o importarla)
  const commissionPercent = 0.15; // Ejemplo fijo o usá tu función
  const commissionAmount = Math.round(pack.price * commissionPercent);

  // 3. Inicializamos MP con el TOKEN DEL VENDEDOR
  const client = new MercadoPagoConfig({ 
    accessToken: sellerToken 
  });

  const preference = new Preference(client);

  // 4. Creamos la preferencia
  const result = await preference.create({
    body: {
      items: [
        {
          id: pack.id,
          title: pack.title,
          unit_price: Number(pack.price),
          quantity: 1,
          currency_id: "ARS"
        }
      ],
      marketplace_fee: commissionAmount, 
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/profile?payment=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/profile?payment=failed`
      },
      auto_return: "approved",
    }
  });

  return { init_point: result.init_point, preference_id: result.id };
}
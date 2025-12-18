# ARSOUND Payment Integration Setup

This guide helps you configure the Mercado Pago integration for ARSOUND.

## Prerequisites

- Mercado Pago account (sign up at: https://www.mercadopago.com.ar)
- Test credentials for development
- Production credentials for live environment

## Step 1: Get Your Credentials

### For Testing (Development)

1. Log in to your Mercado Pago account
2. Navigate to **Settings** → **Credentials**
3. Under **Test** tab, you'll find:
   - **Access Token (Bearer Token)** - Use this for API calls
   - **Public Key** - Use this for frontend (if needed)

### For Production (Live)

1. Log in to your Mercado Pago account
2. Navigate to **Settings** → **Credentials**
3. Under **Production** tab, you'll find:
   - **Access Token (Bearer Token)**
   - **Public Key**

## Step 2: Add Environment Variables

Add the following to your `.env.local` file (create it if it doesn't exist):

```env
# Mercado Pago Credentials - Development/Testing
MERCADO_PAGO_ACCESS_TOKEN=TEST_YOUR_ACCESS_TOKEN_HERE
MERCADO_PAGO_PUBLIC_KEY=TEST_YOUR_PUBLIC_KEY_HERE

# App URL (for payment redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Production Deployment

When deploying to Vercel:

1. Go to your project settings in Vercel
2. Navigate to **Environment Variables**
3. Add the production credentials:
   - `MERCADO_PAGO_ACCESS_TOKEN` (production token)
   - `MERCADO_PAGO_PUBLIC_KEY` (production key)

## Step 3: Configure Webhooks

Webhooks notify your app when payments are completed. This is critical for pack purchases and plan upgrades.

1. In Mercado Pago dashboard, go to **Settings** → **Webhooks**
2. Add a webhook for payment notifications:
   - **URL**: `https://your-domain.com/api/webhooks/mercadopago`
   - **Events**: Select "payment.created", "payment.updated"

3. For local testing, use services like:
   - [ngrok](https://ngrok.com/) - tunnels localhost to a public URL
   - [LocalTunnel](https://localtunnel.me/)

Example with ngrok:
```bash
ngrok http 3000
# Then use: https://your-ngrok-url.ngrok.io/api/webhooks/mercadopago
```

## Step 4: Test Payment Flow

### Test Pack Purchase

1. Create a test pack at `/upload`
2. Click checkout
3. You should be redirected to Mercado Pago
4. Use test card: `4111 1111 1111 1111`
5. Expiry: `11/25` (any future date)
6. CVV: `123` (any 3 digits)

After approval, you should:
- See success page
- Find purchase record in database
- Check webhook was processed

### Test Plan Upgrade

1. Go to `/plans`
2. Select a plan and click subscribe
3. Follow the test payment flow above

## Commission System

ARSOUND charges different commissions based on user plan:

- **Free Plan**: 15% commission
- **De 0 a Hit**: 10% commission
- **Studio Plus**: 3% commission

When a pack is purchased:
1. Buyer pays full amount
2. Platform takes commission
3. Seller receives: `amount - commission`

This is calculated in:
- `/app/api/webhooks/mercadopago/route.ts` - On payment approval
- `/lib/plans.ts` - Commission rates are defined here

## Download System

### Free Packs
- Download directly without payment
- Free users limited to 10 downloads/month
- Paid users have unlimited downloads

### Paid Packs
- User must complete payment first
- After approval, pack becomes available for download
- Downloads tracked in `pack_downloads` table

## Troubleshooting

### Error: "Error al crear la preferencia de pago"

**Cause**: Missing or invalid credentials
**Solution**: 
1. Check `.env.local` has correct tokens
2. Verify credentials in Mercado Pago dashboard
3. Test credentials are not expired

### Payment webhook not firing

**Cause**: Webhook not configured or URL unreachable
**Solution**:
1. Verify webhook URL in Mercado Pago settings
2. Use ngrok for local testing
3. Check webhook logs in Mercado Pago dashboard

### "No se puede contactar a Mercado Pago"

**Cause**: Network/API issue
**Solution**:
1. Check internet connection
2. Verify API is not down: https://status.mercadopago.com
3. Check firewall/proxy settings

## API Reference

### Create Payment Preference

```typescript
POST /api/mercadopago/create-preference
{
  packId?: string,        // For pack purchase
  planType?: string,      // For plan upgrade (de_0_a_hit | studio_plus)
  discountCode?: string   // Optional discount code
}
```

Response:
```json
{
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "preference_id": "..."
}
```

### Webhook Payload

```json
{
  "type": "payment",
  "data": {
    "id": "payment_id_123"
  }
}
```

## Security Notes

- Never commit `.env.local` to git (it's in `.gitignore`)
- Rotate credentials regularly
- Use production tokens only in production
- Enable webhook signature verification (recommended)

## Support

For Mercado Pago issues:
- Documentation: https://developers.mercadopago.com/
- Status: https://status.mercadopago.com
- Support: https://www.mercadopago.com.ar/ayuda

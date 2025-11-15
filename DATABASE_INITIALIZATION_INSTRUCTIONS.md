# ARSOUND Database Initialization

## Important: Your Database is Empty

The Supabase integration shows 0 tables. You need to initialize the database before the app will work.

## Quick Setup (Recommended)

### Option 1: Run the Complete SQL Script

1. Go to your **Supabase Project**
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire content of `scripts/100_init_database_complete.sql`
5. Click **Run**

This will create:
- profiles table
- packs table
- pack_likes table
- pack_downloads table
- pack_plays table
- purchases table (IMPORTANT for payment tracking)
- discount_codes table
- pack_offers table
- followers table
- user_plans table
- All necessary indexes
- Row Level Security (RLS) policies
- Mercado Pago integration fields (mp_connected, mp_access_token, mp_user_id)

### Option 2: Run Individual Migration Scripts (if Option 1 fails)

In the Supabase SQL Editor, run these scripts in order:

1. `scripts/100_init_database_complete.sql` - Complete initialization

OR run these individually:

1. `scripts/001_create_profiles_table.sql`
2. `scripts/002_create_packs_table.sql`
3. `scripts/003_create_pack_likes_table.sql`
4. `scripts/004_create_purchases_table.sql`
5. `scripts/005_create_pack_downloads_table.sql`
6. `scripts/006_create_discount_codes_table.sql`
7. `scripts/007_create_followers_table.sql`

## Verify Installation

After running the script:

1. Go to **Supabase Dashboard** > **SQL Editor** > **Tables**
2. You should see:
   - profiles
   - packs
   - pack_likes
   - pack_downloads
   - pack_plays
   - purchases
   - discount_codes
   - pack_offers
   - followers
   - user_plans

## Critical Tables for Payment Flow

### purchases table
- Tracks all pack purchases
- Records buyer_id, pack_id, amount, commission, and earnings
- Links to mercado_pago_payment_id for payment verification
- **Required for downloads to work after payment**

### profiles table
- Stores user information and plan
- **IMPORTANT**: mp_connected, mp_access_token, mp_user_id fields required for Mercado Pago connection
- total_sales field tracks seller earnings

### packs table
- downloads_count: incremented each time a pack is purchased
- total_plays: tracks user plays for statistics

## Troubleshooting

### "Table already exists" error
- This is fine! It means the table was already created. You can safely ignore it.
- If you want to reset everything, use `DROP TABLE IF EXISTS` commands, but this will delete all data.

### Still seeing "0 tables"
1. Refresh your browser
2. Go to Supabase Dashboard > Project > Tables
3. Verify tables are actually created

### Payment webhook not working
- Ensure `purchases` table exists with correct schema
- Check `mercado_pago_payment_id` field exists and is UNIQUE
- Verify webhook URL in Mercado Pago is set to: `https://yourdomain.com/api/webhooks/mercadopago`

## After Database Setup

The app will now support:
1. User registration and profiles
2. Pack uploads and downloads
3. Payment processing with Mercado Pago
4. Seller statistics and earnings tracking
5. User subscriptions and plans

## Next Steps

1. Test user registration by creating an account
2. Verify profiles table has your user
3. Test pack upload
4. Test payment flow with Mercado Pago test credentials
5. Check purchases table for successful transactions
</parameter>

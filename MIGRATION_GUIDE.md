# ARSOUND Database Migration Guide

## Overview
This guide walks through setting up the ARSOUND database with all critical fixes implemented.

## Prerequisites
- Supabase project set up and connected
- Environment variables configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)
- Mercado Pago account and credentials configured

## Migration Steps

### Step 1: Initialize Core Database Schema
Execute this script in Supabase SQL editor:
```
./scripts/init-database-v2.sql
```

**What this does**:
- Creates all necessary tables (profiles, packs, purchases, etc.)
- Sets up proper foreign keys and constraints
- Creates performance indexes
- Enables Row Level Security (RLS)
- Sets up basic RLS policies

### Step 2: Create RPC Functions
Execute this script in Supabase SQL editor:
```
./scripts/create-rpc-functions.sql
```

**What this does**:
- `get_packs_this_month` - Count monthly uploads
- `get_remaining_uploads` - Check upload quota
- `can_download_pack` - Verify download permission
- `get_download_limit` - Check download quota
- `increment_counter` - Safely update pack counters
- `get_user_purchases` - Retrieve user purchase history
- `get_seller_earnings` - Calculate seller earnings

### Step 3: Set Up Storage RLS Policies
Execute this script in Supabase SQL editor:
```
./scripts/lib/supabase/setup-storage-rls.sql
```

**What this does**:
- Enables RLS on storage buckets
- Creates policies for avatars bucket (public readable, user-writable)
- Creates policies for samplepacks bucket (public readable, user-writable)
- Allows deletion of own files

### Step 4: Create Purchase Tables & Triggers
Execute this script in Supabase SQL editor:
```
./scripts/create-purchase-tables.sql
```

**What this does**:
- Ensures purchases table has all required columns
- Creates indexes for fast queries
- Sets up RLS policies for purchases
- Creates trigger to update pack download count
- Creates helper functions for earnings tracking

### Step 5: Verify Bucket Configuration
In Supabase Dashboard:

1. **Go to Storage → Buckets**
2. **Create/Verify `samplepacks` bucket**:
   - Set to Public
   - Max upload size: 500MB
3. **Create/Verify `avatars` bucket**:
   - Set to Public
   - Max upload size: 5MB

### Step 6: Deploy Application Code
```bash
# Update these files in your project:
- app/api/packs/upload/route.ts (NEW)
- app/api/avatars/upload/route.ts (NEW)
- app/api/mercadopago/create-preference/route.ts (UPDATED)
- app/api/webhooks/mercadopago/route.ts (UPDATED)
- app/api/packs/[id]/download/route.ts (UPDATED)
- components/avatar-upload.tsx (UPDATED)
- components/pack-card.tsx (UPDATED)
- components/profile-limits-card.tsx (UPDATED)
- lib/supabase/avatar-url.ts (NEW)
```

### Step 7: Test the System
1. **Sign up and create a profile**
2. **Test avatar upload** - Upload an image, verify it displays
3. **Test pack upload** - Upload a sample pack, verify file storage
4. **Test download limits**:
   - Create a free pack
   - Try downloading as free user (should allow up to 10/month)
   - Verify counter increments
5. **Test upload limits**:
   - Free plan should allow 3 packs/month
   - Verify quota display in profile
6. **Test Mercado Pago payment**:
   - Create a paid pack
   - Complete a test purchase
   - Verify purchase recorded in database
   - Verify commission calculation

## Rollback Plan
If issues occur:

1. **Database**: Create new Supabase project and re-run scripts
2. **Code**: Revert to previous git commit
3. **Storage**: Clear storage buckets if corrupted

## Troubleshooting

### Avatar not displaying
- Check `getAvatarUrl()` returns correct URL
- Verify avatars bucket is public
- Check CORS settings: ensure `crossOrigin="anonymous"` on img tags

### Upload errors showing `{}`
- Check browser console for actual error message
- Verify Supabase credentials are correct
- Ensure storage buckets exist and are public
- Check RLS policies aren't blocking uploads

### Download limits not working
- Verify RPC function `can_download_pack` exists
- Check `pack_downloads` table has records
- Ensure user plan is set correctly
- Verify date calculations for month boundaries

### Mercado Pago payments not recording
- Check webhook URL is accessible
- Verify access token is correct
- Check Mercado Pago account settings
- Review webhook logs in Mercado Pago dashboard

## Performance Optimization
After migration:

1. Create indexes (already in init-database-v2.sql)
2. Enable query caching where applicable
3. Use RPC functions for complex queries
4. Monitor database performance
5. Consider query optimization if needed

## Security Checklist
- ✅ RLS policies enabled on all tables
- ✅ Storage bucket RLS policies configured
- ✅ Mercado Pago credentials in environment variables
- ✅ API routes validate user authentication
- ✅ Commission calculations server-side
- ✅ File uploads validated for type and size

## Next Steps
1. Monitor system for errors and unusual activity
2. Set up automated backups
3. Configure uptime monitoring
4. Prepare seller payout workflow
5. Plan analytics dashboard implementation

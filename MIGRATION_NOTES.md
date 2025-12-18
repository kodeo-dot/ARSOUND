# Migration Notes for Username vs Display Name

## Overview
The platform has been migrated to use `username` as the primary display name throughout the application, instead of the auto-generated `display_name` field.

## Changes Made

### 1. Database Changes
- **`002_profile_trigger.sql`**: Updated the trigger to only generate `username` from metadata, not `display_name`
- **`011_remove_display_name_usage.sql`**: Added deprecation comment to the `display_name` column
- The `display_name` column is kept in the database for backwards compatibility but is no longer used

### 2. Backend Changes
- **Signup flow**: No longer saves `display_name` when creating new users
- **Profile queries**: Removed `display_name` from most SELECT queries

### 3. Frontend Changes
Updated all components to use `username` instead of `display_name`:
- `app/signup/page.tsx` - Removed display_name from registration
- `app/profile/page.tsx` - Shows username only
- `app/profile/[username]/page.tsx` - Shows username with @ prefix
- `app/pack/[id]/page.tsx` - Shows pack creator's username
- `app/pack/[id]/checkout/page.tsx` - Shows username in order summary
- `app/producers/page.tsx` - Displays and searches by username only
- `components/featured-producers.tsx` - Shows username
- `components/pack-card.tsx` - Shows pack creator's username
- `components/pack-grid.tsx` - Filters by username only

## For Existing Users

### Users with display_name but without proper username:
If you have existing users where `display_name` was generated from email (e.g., "beniigle8"), but they haven't set a proper username:
1. They can update their username from their profile page
2. The username field now accepts alphanumeric characters and underscores only
3. Maximum 12 characters

### Data Cleanup (Optional):
If you want to clean up old `display_name` values, you can run:
```sql
UPDATE public.profiles SET display_name = NULL WHERE display_name IS NOT NULL;
```

## Testing Checklist
- [x] New user signup creates username only
- [x] Profile pages show username
- [x] Pack detail pages show creator username
- [x] Producer listings show username
- [x] Search filters work with username
- [x] Checkout flow shows username
- [x] Existing users can still log in and see their profiles

## Rollback Plan
If you need to rollback:
1. Restore the original `002_profile_trigger.sql` to generate `display_name` again
2. Update frontend components to use `display_name || username` pattern
3. Run a script to populate `display_name` for users who don't have it
</markdown>

-- Add archived column to packs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'packs' 
    AND column_name = 'archived'
  ) THEN
    ALTER TABLE public.packs ADD COLUMN archived BOOLEAN DEFAULT false;
    
    -- Create index for better query performance
    CREATE INDEX idx_packs_archived ON public.packs(archived) WHERE archived = true;
    
    -- Add comment
    COMMENT ON COLUMN public.packs.archived IS 'Marks packs as archived (hidden but not deleted), used for plan downgrades';
  END IF;
END $$;

-- Create a function to handle plan downgrades
CREATE OR REPLACE FUNCTION handle_plan_downgrade(
  p_user_id UUID,
  p_new_plan TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_current_plan TEXT;
  v_packs_count INTEGER;
  v_new_limit INTEGER;
  v_packs_to_archive UUID[];
  v_archived_count INTEGER := 0;
BEGIN
  -- Get current plan
  SELECT plan INTO v_current_plan FROM profiles WHERE id = p_user_id;
  v_current_plan := COALESCE(v_current_plan, 'free');
  
  -- Determine new plan limits
  IF p_new_plan = 'free' THEN
    v_new_limit := 3;
  ELSIF p_new_plan = 'de_0_a_hit' THEN
    v_new_limit := 10;
  ELSE
    v_new_limit := NULL; -- unlimited
  END IF;
  
  -- If new plan has unlimited packs, no need to archive
  IF v_new_limit IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'archived_count', 0,
      'message', 'New plan has unlimited packs'
    );
  END IF;
  
  -- Count active packs
  SELECT COUNT(*) INTO v_packs_count
  FROM packs
  WHERE user_id = p_user_id
    AND COALESCE(is_deleted, false) = false
    AND COALESCE(archived, false) = false;
  
  -- If user has more packs than limit, archive oldest ones
  IF v_packs_count > v_new_limit THEN
    -- Get IDs of packs to archive (oldest first, keep newest)
    SELECT ARRAY_AGG(id) INTO v_packs_to_archive
    FROM (
      SELECT id
      FROM packs
      WHERE user_id = p_user_id
        AND COALESCE(is_deleted, false) = false
        AND COALESCE(archived, false) = false
      ORDER BY created_at ASC
      LIMIT (v_packs_count - v_new_limit)
    ) AS oldest_packs;
    
    -- Archive the packs
    UPDATE packs
    SET archived = true
    WHERE id = ANY(v_packs_to_archive);
    
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
      'success', true,
      'archived_count', v_archived_count,
      'packs_before', v_packs_count,
      'packs_after', v_new_limit,
      'message', format('Archived %s packs due to plan downgrade', v_archived_count)
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'archived_count', 0,
      'message', 'User has fewer packs than new limit, no archiving needed'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_plan_downgrade(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION handle_plan_downgrade IS 'Handles plan downgrades by archiving excess packs. Free plan: 3 total, de_0_a_hit: 10 total, studio_plus: unlimited';

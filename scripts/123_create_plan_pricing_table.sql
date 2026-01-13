-- Create table for dynamic plan pricing
CREATE TABLE IF NOT EXISTS plan_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL UNIQUE,
  base_price integer NOT NULL,
  current_price integer NOT NULL,
  is_discounted boolean DEFAULT false,
  discount_label text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default plan prices
INSERT INTO plan_pricing (plan_id, base_price, current_price, is_discounted)
VALUES 
  ('de_0_a_hit', 5000, 5000, false),
  ('studio_plus', 15000, 15000, false)
ON CONFLICT (plan_id) DO NOTHING;

-- Function to update plan pricing
CREATE OR REPLACE FUNCTION update_plan_pricing(
  p_plan_id text,
  p_new_price integer
) RETURNS void AS $$
DECLARE
  v_base_price integer;
BEGIN
  -- Get the base price
  SELECT base_price INTO v_base_price
  FROM plan_pricing
  WHERE plan_id = p_plan_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found: %', p_plan_id;
  END IF;
  
  -- Update the pricing
  UPDATE plan_pricing
  SET 
    current_price = p_new_price,
    is_discounted = (p_new_price < v_base_price),
    discount_label = CASE 
      WHEN p_new_price < v_base_price THEN 
        CONCAT(ROUND((1 - (p_new_price::numeric / v_base_price::numeric)) * 100), '% OFF')
      ELSE NULL
    END,
    updated_at = now()
  WHERE plan_id = p_plan_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get current plan pricing
CREATE OR REPLACE FUNCTION get_plan_pricing()
RETURNS TABLE (
  plan_id text,
  base_price integer,
  current_price integer,
  is_discounted boolean,
  discount_label text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.plan_id,
    pp.base_price,
    pp.current_price,
    pp.is_discounted,
    pp.discount_label
  FROM plan_pricing pp;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE plan_pricing ENABLE ROW LEVEL SECURITY;

-- Public can read pricing
CREATE POLICY "Anyone can read plan pricing"
  ON plan_pricing
  FOR SELECT
  USING (true);

-- Only admins can update pricing
CREATE POLICY "Only admins can update plan pricing"
  ON plan_pricing
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

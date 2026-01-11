-- Create a table to log payment webhook attempts for debugging
CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  external_reference TEXT,
  status TEXT,
  metadata JSONB,
  parsed_metadata JSONB,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_payment_id ON public.payment_webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_created_at ON public.payment_webhook_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs (you can adjust this)
CREATE POLICY "payment_webhook_logs_select" ON public.payment_webhook_logs
  FOR SELECT
  TO authenticated
  USING (false); -- Change to true if you want users to see logs

COMMENT ON TABLE public.payment_webhook_logs IS 'Logs all payment webhook attempts for debugging failed plan activations';

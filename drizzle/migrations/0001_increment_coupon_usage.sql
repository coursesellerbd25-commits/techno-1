CREATE OR REPLACE FUNCTION public.increment_coupon_usage(_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE code = _code AND is_active = true;
$$;

REVOKE ALL ON FUNCTION public.increment_coupon_usage(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(text) TO service_role;
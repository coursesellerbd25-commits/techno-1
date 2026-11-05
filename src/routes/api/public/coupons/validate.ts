import { createFileRoute } from "@tanstack/react-router";

/**
 * Coupon preview endpoint. Final coupon validation always happens again
 * inside the order-creation endpoint before an order is accepted.
 */
export const Route = createFileRoute("/api/public/coupons/validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const body = (await request.json()) as { code?: string; subtotal?: number };
          const code = typeof body.code === "string" ? body.code.trim().toUpperCase().slice(0, 40) : "";
          const subtotal = Number(body.subtotal);
          if (!code || !Number.isFinite(subtotal) || subtotal <= 0) {
            return Response.json({ ok: false, message: "কুপন কোড ও অর্ডারের মূল্য সঠিক নয়।" }, { status: 400 });
          }

          const { data: coupon } = await supabaseAdmin
            .from("coupons")
            .select("code, discount_type, discount_value, min_order_amount, max_uses, used_count, starts_at, expires_at, is_active")
            .eq("code", code)
            .maybeSingle();

          const now = Date.now();
          if (!coupon || !coupon.is_active) {
            return Response.json({ ok: false, message: "কুপন কোডটি সঠিক নয়।" });
          }
          if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
            return Response.json({ ok: false, message: "কুপনটি এখনো চালু হয়নি।" });
          }
          if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
            return Response.json({ ok: false, message: "কুপনটির মেয়াদ শেষ হয়ে গেছে।" });
          }
          if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
            return Response.json({ ok: false, message: "কুপনটির ব্যবহার সীমা শেষ।" });
          }
          if (subtotal < Number(coupon.min_order_amount)) {
            return Response.json(
              { ok: false, message: `এই কুপনের জন্য ন্যূনতম ৳${Number(coupon.min_order_amount).toLocaleString("en-IN")} মূল্যের অর্ডার প্রয়োজন।` }
            );
          }

          const discount =
            coupon.discount_type === "percent"
              ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
              : Math.min(Number(coupon.discount_value), subtotal);

          return Response.json({
            ok: true,
            discount,
            message: `কুপন প্রয়োগ হয়েছে — ছাড় ৳${discount.toLocaleString("en-IN")}`,
          });
        } catch (err) {
          console.error("coupon validate error", err);
          return Response.json({ ok: false, message: "কুপন যাচাই করা যায়নি।" }, { status: 500 });
        }
      },
    },
  },
});

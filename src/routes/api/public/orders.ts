import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const admin = supabaseAdmin as ReturnType<
            typeof createClient<Database>
          >;

          const body = (await request.json()) as CreateOrderBody | null;
          if (!body) return json({ ok: false, message: "অনুরোধ সঠিক নয়।" }, 400);

          // --- Validate items ---
          if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
            return json({ ok: false, message: "কার্টের তথ্য সঠিক নয়।" }, 400);
          }
          const items = body.items.map((it) => ({
            product_id: String(it.product_id),
            qty: Math.floor(Number(it.qty)),
          }));
          if (
            items.some(
              (it) =>
                !UUID_RE.test(it.product_id) ||
                !Number.isInteger(it.qty) ||
                it.qty < 1 ||
                it.qty > 10
            )
          ) {
            return json({ ok: false, message: "পণ্যের তথ্য সঠিক নয়।" }, 400);
          }

          // --- Validate customer ---
          const c = body.customer ?? ({} as CreateOrderBody["customer"]);
          const name = str(c.customer_name, 100);
          const phone = str(c.customer_phone, 11);
          const email = c.customer_email ? str(c.customer_email, 255) : null;
          const division = str(c.division, 20);
          const district = str(c.district, 50);
          const area = c.area ? str(c.area, 100) : null;
          const address = str(c.address, 300);
          const notes = c.notes ? str(c.notes, 500) : null;

          if (name.length < 2) return json({ ok: false, message: "সম্পূর্ণ নাম লিখুন।" }, 400);
          if (!/^01[3-9]\d{8}$/.test(phone))
            return json({ ok: false, message: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।" }, 400);
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return json({ ok: false, message: "সঠিক ইমেইল ঠিকানা দিন।" }, 400);
          if (!division || !district)
            return json({ ok: false, message: "বিভাগ ও জেলা নির্বাচন করুন।" }, 400);
          if (address.length < 10)
            return json({ ok: false, message: "বিস্তারিত ডেলivery ঠিকানা লিখুন।" }, 400);

          const payment_method = body.payment_method;
          if (!["cod", "bkash", "nagad"].includes(payment_method))
            return json({ ok: false, message: "পেমেন্ট মাধ্যম নির্বাচন করুন।" }, 400);
          const bkash_trx_id =
            body.bkash_trx_id && /^[A-Za-z0-9]{6,30}$/.test(body.bkash_trx_id.trim())
              ? body.bkash_trx_id.trim()
              : null;

          // Zone decided server-side from the district, never from the client.
          const delivery_zone = district === "ঢাকা" ? "inside_dhaka" : "outside_dhaka";

          // --- Verify the caller's session (optional: guests allowed) ---
          let userId: string | null = null;
          const authHeader = request.headers.get("Authorization");
          if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);
            if (token && !token.startsWith("sb_")) {
              const { data } = await admin.auth.getUser(token);
              userId = data.user?.id ?? null;
            }
          }

          // --- Re-read prices & stock from the database ---
          const { data: products, error: prodErr } = await admin
            .from("products")
            .select("id, name_bn, model, price, stock_qty, is_active, product_images(url, sort_order)")
            .in("id", items.map((i) => i.product_id))
            .eq("is_active", true);

          if (prodErr || !products) {
            return json({ ok: false, message: "পণ্যের তথ্য যাচাই করা যায়নি।" }, 500);
          }
          const byId = new Map(products.map((p) => [p.id, p]));

          const lines: OrderLine[] = [];
          let subtotal = 0;
          for (const it of items) {
            const p = byId.get(it.product_id);
            if (!p) return json({ ok: false, message: "কিছু পণ্য এখন পাওয়া যাচ্ছে না।" }, 409);
            if (p.stock_qty < it.qty)
              return json(
                { ok: false, message: `"${p.name_bn}" স্টকে মাত্র ${p.stock_qty}টি আছে। পরিমাণ কমিয়ে চেষ্টা করুন।` },
                409
              );
            const price = Number(p.price);
            subtotal += price * it.qty;
            const img = (p.product_images ?? []).sort((a, b) => a.sort_order - b.sort_order)[0];
            lines.push({
              product_id: p.id,
              product_name: p.name_bn,
              product_model: p.model,
              image_url: img?.url ?? null,
              unit_price: price,
              quantity: it.qty,
              line_total: price * it.qty,
            });
          }

          // --- Validate coupon server-side ---
          let couponCode: string | null = null;
          let discount = 0;
          if (body.coupon_code) {
            const code = str(body.coupon_code, 40).toUpperCase();
            const { data: coupon } = await admin
              .from("coupons")
              .select("code, discount_type, discount_value, min_order_amount, max_uses, used_count, starts_at, expires_at, is_active")
              .eq("code", code)
              .maybeSingle();
            const now = Date.now();
            const valid =
              coupon &&
              coupon.is_active &&
              (!coupon.starts_at || new Date(coupon.starts_at).getTime() <= now) &&
              (!coupon.expires_at || new Date(coupon.expires_at).getTime() >= now) &&
              (coupon.max_uses === null || coupon.used_count < coupon.max_uses) &&
              subtotal >= Number(coupon.min_order_amount);
            if (valid && coupon) {
              discount =
                coupon.discount_type === "percent"
                  ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
                  : Math.min(Number(coupon.discount_value), subtotal);
              couponCode = coupon.code;
            }
          }

          // --- Delivery fee from server settings ---
          const { data: settingRow } = await admin
            .from("settings")
            .select("value")
            .eq("key", "delivery")
            .maybeSingle();
          const d = (settingRow?.value ?? {}) as Record<string, number>;
          const baseFee = delivery_zone === "inside_dhaka"
            ? d["inside_dhaka_fee"] ?? 80
            : d["outside_dhaka_fee"] ?? 150;
          const deliveryFee = subtotal >= (d["free_delivery_min"] ?? 5000) ? 0 : baseFee;

          const total = Math.max(0, subtotal - discount) + deliveryFee;
          const order_number = `TN${Date.now().toString(36).toUpperCase()}${Math.random()
            .toString(36)
            .slice(2, 5)
            .toUpperCase()}`;

          // --- Create the order ---
          const payment_status =
            payment_method === "cod" ? "pending" : "awaiting_verification";

          const { data: order, error: orderErr } = await admin
            .from("orders")
            .insert({
              order_number,
              user_id: userId,
              customer_name: name,
              customer_phone: phone,
              customer_email: email,
              division,
              district,
              area,
              address,
              notes,
              subtotal,
              delivery_fee: deliveryFee,
              discount_amount: discount,
              total,
              coupon_code: couponCode,
              delivery_zone,
              payment_method,
              payment_status,
              bkash_trx_id,
              status: "pending",
            })
            .select("id, order_number, total, subtotal, delivery_fee, discount_amount, payment_method, division, district, address")
            .single();

          if (orderErr || !order) {
            console.error("order insert failed", orderErr);
            return json({ ok: false, message: "অর্ডার করা যায়নি, আবার চেষ্টা করুন।" }, 500);
          }

          // --- Insert order items ---
          const { error: itemsErr } = await admin.from("order_items").insert(
            lines.map((l) => ({ ...l, order_id: order.id }))
          );
          if (itemsErr) {
            console.error("order items insert failed", itemsErr);
            await admin.from("orders").delete().eq("id", order.id);
            return json({ ok: false, message: "অর্ডার করা যায়নি, আবার চেষ্টা করুন।" }, 500);
          }

          // --- Decrement stock with a guarded update (prevents overselling) ---
          for (const l of lines) {
            const { data: updated, error: stockErr } = await admin
              .from("products")
              .update({ stock_qty: (byId.get(l.product_id)!.stock_qty - l.quantity) })
              .eq("id", l.product_id)
              .gte("stock_qty", l.quantity)
              .select("id");
            if (stockErr || !updated || updated.length === 0) {
              // Roll back the order; the stock check failed for a concurrent purchase.
              await admin.from("order_items").delete().eq("order_id", order.id);
              await admin.from("orders").delete().eq("id", order.id);
              return json(
                { ok: false, message: `"${l.product_name}" স্টক শেষ হয়ে গেছে। দুঃখিত!` },
                409
              );
            }
            await admin.from("inventory_logs").insert({
              product_id: l.product_id,
              delta: -l.quantity,
              reason: "order_placed",
              order_id: order.id,
            });
          }

          if (couponCode) {
            // The generated Database types may lag behind new SQL functions.
            type RpcFn = (fn: string, args?: Record<string, unknown>) => PromiseLike<unknown>;
            await (admin.rpc as unknown as RpcFn)("increment_coupon_usage", { _code: couponCode });
          }

          await admin.from("analytics_events").insert({
            event_type: "order_completed",
            user_id: userId,
            metadata: { order_number, total, payment_method, item_count: lines.length },
          });

          return json({
            ok: true,
            order: {
              order_number: order.order_number,
              total: Number(order.total),
              subtotal: Number(order.subtotal),
              delivery_fee: Number(order.delivery_fee),
              discount_amount: Number(order.discount_amount),
              payment_method: order.payment_method,
              division: order.division,
              district: order.district,
              address: order.address,
            },
          });
        } catch (err) {
          console.error("order error", err);
          return json({ ok: false, message: "সার্ভার সমস্যা — আবার চেষ্টা করুন।" }, 500);
        }
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CreateOrderBody = {
  items: { product_id: string; qty: number }[];
  customer: {
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    division: string;
    district: string;
    area: string | null;
    address: string;
    notes: string | null;
  };
  coupon_code: string | null;
  payment_method: "cod" | "bkash" | "nagad";
  bkash_trx_id: string | null;
};

type OrderLine = {
  product_id: string;
  product_name: string;
  product_model: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

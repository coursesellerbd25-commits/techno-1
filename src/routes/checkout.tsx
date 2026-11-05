import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { formatBn, useCart } from "@/lib/cart";
import { getStoreConfig } from "@/lib/store-config.functions";
import { BD_DIVISIONS, districtsFor } from "@/lib/bd-locations";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "অর্ডার সম্পন্ন করুন — Techno" },
      { name: "description", content: "নিবন্ধন ছাড়াই, মাত্র কয়েক ধাপে আপনার অর্ডার সম্পন্ন করুন।" },
      { property: "og:title", content: "অর্ডার সম্পন্ন করুন — Techno" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

type PaymentMethod = "cod" | "bkash" | "nagad";

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { data: config } = useQuery({ queryKey: ["store-config"], queryFn: () => getStoreConfig() });

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    division: "",
    district: "",
    area: "",
    address: "",
    notes: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [coupon, setCoupon] = useState("");
  const [bkashTrx, setBkashTrx] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);

  const isDhaka = form.district === "ঢাকা";
  const delivery = config?.delivery;
  const baseFee = isDhaka ? delivery?.inside_dhaka_fee ?? 80 : delivery?.outside_dhaka_fee ?? 150;
  const deliveryFee = subtotal >= (delivery?.free_delivery_min ?? 5000) ? 0 : baseFee;
  const discount = couponApplied?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  const canPay =
    payment === "cod" ||
    (payment === "bkash" && !!config?.bkash_number) ||
    (payment === "nagad" && !!config?.nagad_number);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function applyCoupon() {
    const code = coupon.trim().slice(0, 40);
    if (!code) return;
    // Server-side validation happens at order creation; here we only preview.
    try {
      const res = await fetch("/api/public/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal, items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })) }),
      });
      const data = (await res.json()) as { ok: boolean; discount?: number; message: string };
      if (data.ok && data.discount !== undefined) {
        setCouponApplied({ code: code.toUpperCase(), discount: data.discount });
        toast.success(data.message);
      } else {
        setCouponApplied(null);
        toast.error(data.message);
      }
    } catch {
      toast.error("কুপন যাচাই করা যায়নি, আবার চেষ্টা করুন।");
    }
  }

  function validate(): string | null {
    if (form.customer_name.trim().length < 2 || form.customer_name.trim().length > 100)
      return "সম্পূর্ণ নাম লিখুন (২-১০০ অক্ষর)।";
    if (!/^01[3-9]\d{8}$/.test(form.customer_phone.trim()))
      return "সঠিক মোবাইল নম্বর লিখুন (যেমন: 01712345678)।";
    if (form.customer_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email.trim()))
      return "সঠিক ইমেইল ঠিকানা লিখুন অথবা ঘরটি খালি রাখুন।";
    if (!form.division) return "বিভাগ নির্বাচন করুন।";
    if (!form.district) return "জেলা নির্বাচন করুন।";
    if (form.address.trim().length < 10 || form.address.trim().length > 300)
      return "বিস্তারিত ডেলিভারি ঠিকানা লিখুন (কমপক্ষে ১০ অক্ষর)।";
    if (form.area.trim().length > 100) return "এলাকার নাম খুব বড়।";
    if (form.notes.trim().length > 500) return "অর্ডার নোট খুব বড়।";
    if (!canPay) return "এই পেমেন্ট মাধ্যমটি এখনো চালু হয়নি।";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
          customer: {
            customer_name: form.customer_name.trim(),
            customer_phone: form.customer_phone.trim(),
            customer_email: form.customer_email.trim() || null,
            division: form.division,
            district: form.district,
            area: form.area.trim() || null,
            address: form.address.trim(),
            notes: form.notes.trim() || null,
          },
          coupon_code: couponApplied?.code ?? null,
          payment_method: payment,
          bkash_trx_id: payment === "cod" ? null : bkashTrx.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        order?: { order_number: string; total: number; payment_method: PaymentMethod; delivery_fee: number; discount_amount: number; subtotal: number; district: string; division: string; address: string };
      };
      if (!data.ok || !data.order) {
        toast.error(data.message ?? "অর্ডার করা যায়নি, আবার চেষ্টা করুন।");
        setSubmitting(false);
        return;
      }
      clear();
      // Hand the summary to the confirmation page via sessionStorage.
      sessionStorage.setItem("techno_last_order", JSON.stringify(data.order));
      navigate({ to: "/order-confirmation" });
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা — অর্ডার করা যায়নি, আবার চেষ্টা করুন।");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <AnnouncementBar message={null} />
        <Header />
        <main className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">অর্ডার করার জন্য কার্টে পণ্য যোগ করুন।</p>
          <Link to="/products" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            পণ্য দেখুন
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <>
      <AnnouncementBar message={null} />
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-bold">অর্ডার সম্পন্ন করুন</h1>
        <p className="mt-1 text-sm text-muted-foreground">নিবন্ধন ছাড়াই অর্ডার করতে পারবেন।</p>

        <form onSubmit={submit} className="mt-6 grid gap-6">
          {/* Customer info */}
          <fieldset className="rounded-xl border bg-card p-5">
            <legend className="px-2 text-sm font-semibold">ডেলিভারি তথ্য</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="co-name" className="mb-1 block text-sm">সম্পূর্ণ নাম <span className="text-destructive">*</span></label>
                <input id="co-name" className={inputClass} value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} maxLength={100} required />
              </div>
              <div>
                <label htmlFor="co-phone" className="mb-1 block text-sm">মোবাইল নম্বর <span className="text-destructive">*</span></label>
                <input id="co-phone" className={inputClass} value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value.replace(/[^\d]/g, "").slice(0, 11))} placeholder="01XXXXXXXXX" inputMode="numeric" required />
              </div>
              <div>
                <label htmlFor="co-email" className="mb-1 block text-sm">ইমেইল (ঐচ্ছিক)</label>
                <input id="co-email" type="email" className={inputClass} value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} maxLength={255} />
              </div>
              <div>
                <label htmlFor="co-division" className="mb-1 block text-sm">বিভাগ <span className="text-destructive">*</span></label>
                <select
                  id="co-division"
                  className={inputClass}
                  value={form.division}
                  onChange={(e) => {
                    set("division", e.target.value);
                    set("district", "");
                  }}
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  {BD_DIVISIONS.map((d) => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="co-district" className="mb-1 block text-sm">জেলা <span className="text-destructive">*</span></label>
                <select
                  id="co-district"
                  className={inputClass}
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                  disabled={!form.division}
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  {districtsFor(form.division).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="co-area" className="mb-1 block text-sm">এলাকা / উপজেলা</label>
                <input id="co-area" className={inputClass} value={form.area} onChange={(e) => set("area", e.target.value)} maxLength={100} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-address" className="mb-1 block text-sm">বিস্তারিত ঠিকানা <span className="text-destructive">*</span></label>
                <textarea id="co-address" className={inputClass} rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} maxLength={300} required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-notes" className="mb-1 block text-sm">অর্ডার নোট (ঐচ্ছিক)</label>
                <textarea id="co-notes" className={inputClass} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={500} />
              </div>
            </div>
          </fieldset>

          {/* Payment */}
          <fieldset className="rounded-xl border bg-card p-5">
            <legend className="px-2 text-sm font-semibold">পেমেন্ট মাধ্যম</legend>
            <div className="grid gap-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary">
                <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} className="mt-1 h-4 w-4 accent-[var(--primary)]" />
                <div>
                  <p className="text-sm font-medium">ক্যাশ অন ডেলিভারি (COD)</p>
                  <p className="text-xs text-muted-foreground">পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 rounded-lg border p-3 ${config?.bkash_number ? "cursor-pointer has-[:checked]:border-primary" : "opacity-60"}`}>
                <input type="radio" name="payment" checked={payment === "bkash"} onChange={() => setPayment("bkash")} disabled={!config?.bkash_number} className="mt-1 h-4 w-4 accent-[var(--primary)]" />
                <div>
                  <p className="text-sm font-medium">bKash</p>
                  {config?.bkash_number ? (
                    <p className="text-xs text-muted-foreground">
                      {config.bkash_number} নম্বরে টাকা পাঠিয়ে নিচে TrxID লিখুন।
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">শীঘ্রই চালু হবে (মার্চেন্ট নম্বর যুক্ত হয়নি)।</p>
                  )}
                </div>
              </label>
              <label className={`flex items-start gap-3 rounded-lg border p-3 ${config?.nagad_number ? "cursor-pointer has-[:checked]:border-primary" : "opacity-60"}`}>
                <input type="radio" name="payment" checked={payment === "nagad"} onChange={() => setPayment("nagad")} disabled={!config?.nagad_number} className="mt-1 h-4 w-4 accent-[var(--primary)]" />
                <div>
                  <p className="text-sm font-medium">Nagad</p>
                  {config?.nagad_number ? (
                    <p className="text-xs text-muted-foreground">
                      {config.nagad_number} নম্বরে টাকা পাঠিয়ে নিচে TrxID লিখুন।
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">শীঘ্রই চালু হবে (মার্চেন্ট নম্বর যুক্ত হয়নি)।</p>
                  )}
                </div>
              </label>
              {(payment === "bkash" || payment === "nagad") && (
                <div>
                  <label htmlFor="co-trx" className="mb-1 block text-sm">TrxID (ঐচ্ছিক — পরেও দেওয়া যাবে)</label>
                  <input id="co-trx" className={inputClass} value={bkashTrx} onChange={(e) => setBkashTrx(e.target.value)} maxLength={30} />
                </div>
              )}
            </div>
          </fieldset>

          {/* Summary */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">অর্ডার সারসংক্ষেপ</h2>
            <ul className="mt-3 grid gap-1.5 text-sm">
              {items.map((i) => (
                <li key={i.product_id} className="flex justify-between gap-4">
                  <span className="line-clamp-1 text-muted-foreground">{i.name_bn} × {i.qty}</span>
                  <span>{formatBn(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="কুপন কোড (যদি থাকে)"
                aria-label="কুপন কোড"
                maxLength={40}
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
              />
              <button type="button" onClick={applyCoupon} className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90">
                প্রয়োগ
              </button>
            </div>
            <div className="mt-4 grid gap-2 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">সাবটোটাল</span>
                <span className="font-medium">{formatBn(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>কুপন ছাড় ({couponApplied?.code})</span>
                  <span className="font-medium">-{formatBn(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">ডেলিভারি চার্জ ({isDhaka ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"})</span>
                <span className="font-medium">{deliveryFee === 0 ? "বিনামূল্যে" : formatBn(deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <span>সর্বমোট</span>
                <span>{formatBn(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isDhaka ? "৪৮ ঘণ্টার" : "৭২ ঘণ্টার"} মধ্যে ডেলিভারির সম্ভাব্য সময় (আনুমানিক)।
                চূড়ান্ত মূল্য অর্ডার গ্রহণের সময় সার্ভারে যাচাই করা হবে।
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "অর্ডার প্রক্রিয়াধীন..." : "অর্ডার নিশ্চিত করুন"}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatBn, useCart } from "@/lib/cart";
import { getStoreConfig } from "@/lib/store-config.functions";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "শপিং কার্ট — Techno" },
      { name: "description", content: "আপনার শপিং কার্টে সংরক্ষিত পণ্যগুলো দেখুন ও অর্ডার করুন।" },
      { property: "og:title", content: "শপিং কার্ট — Techno" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, removeItem, subtotal } = useCart();
  const [zone, setZone] = useState<"inside_dhaka" | "outside_dhaka">("inside_dhaka");
  const { data: config } = useQuery({ queryKey: ["store-config"], queryFn: () => getStoreConfig() });

  const delivery = config?.delivery;
  const baseFee = zone === "inside_dhaka"
    ? delivery?.inside_dhaka_fee ?? 80
    : delivery?.outside_dhaka_fee ?? 150;
  const deliveryFee = subtotal >= (delivery?.free_delivery_min ?? 5000) ? 0 : baseFee;
  const total = subtotal + deliveryFee;

  return (
    <>
      <AnnouncementBar message={null} />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-xl font-bold">শপিং কার্ট</h1>

        {items.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-xl border bg-card py-16 text-center">
            <ShoppingCart className="mb-2 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">আপনার কার্ট এখনো খালি।</p>
            <Link
              to="/products"
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              কেনাকাটা শুরু করুন
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-3">
              {items.map((item) => (
                <div key={item.product_id} className="flex items-center gap-4 rounded-xl border bg-card p-3">
                  <Link
                    to="/products/$slug"
                    params={{ slug: item.slug }}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-aqua-soft"
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name_bn} className="h-full w-full object-cover" loading="lazy" />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to="/products/$slug" params={{ slug: item.slug }} className="line-clamp-2 text-sm font-medium hover:text-primary">
                      {item.name_bn}
                    </Link>
                    {item.brand_name && <p className="text-xs text-muted-foreground">{item.brand_name}</p>}
                    <p className="price-tag mt-1 text-base">{formatBn(item.price)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center rounded-md border">
                      <button
                        type="button"
                        onClick={() => setQty(item.product_id, item.qty - 1)}
                        className="grid h-8 w-8 place-items-center"
                        aria-label="পরিমাণ কমান"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(item.product_id, item.qty + 1)}
                        className="grid h-8 w-8 place-items-center"
                        aria-label="পরিমাণ বাড়ান"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatBn(item.price * item.qty)}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product_id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`${item.name_bn} সরান`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/products" className="text-sm text-primary hover:underline">
                ← কেনাকাটা চালিয়ে যান
              </Link>
            </div>

            <aside className="h-fit rounded-xl border bg-card p-5">
              <h2 className="font-semibold">অর্ডার সারসংক্ষেপ</h2>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">সাবটোটাল</span>
                  <span className="font-medium">{formatBn(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-muted-foreground" htmlFor="cart-zone">ডেলিভারি এলাকা</label>
                  <select
                    id="cart-zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value as "inside_dhaka" | "outside_dhaka")}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="inside_dhaka">ঢাকার ভেতরে</option>
                    <option value="outside_dhaka">ঢাকার বাইরে</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                  <span className="font-medium">{deliveryFee === 0 ? "বিনামূল্যে" : formatBn(deliveryFee)}</span>
                </div>
                {subtotal < (delivery?.free_delivery_min ?? 5000) && delivery?.free_delivery_min && (
                  <p className="text-xs text-muted-foreground">
                    {formatBn(delivery.free_delivery_min - subtotal)} টাকার আরও কেনাকাটা করলে ডেলিভারি ফ্রি!
                  </p>
                )}
                <div className="mt-2 flex justify-between border-t pt-3 text-base font-bold">
                  <span>সর্বমোট</span>
                  <span>{formatBn(total)}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="mt-5 block rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                অর্ডার সম্পন্ন করুন
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                কুপন কোড চেকআউট পেজে ব্যবহার করা যাবে
              </p>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

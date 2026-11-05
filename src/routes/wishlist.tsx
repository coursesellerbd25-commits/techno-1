import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingCart, Trash2 } from "lucide-react";
import { formatBn, useCart, useWishlist } from "@/lib/cart";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { ProductCard } from "@/components/store/ProductCard";
import type { ProductCard as ProductCardData } from "@/lib/catalog.functions";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "পছন্দের তালিকা — Techno" },
      { name: "description", content: "আপনার সংরক্ষিত পছন্দের পণ্যের তালিকা।" },
      { property: "og:title", content: "পছন্দের তালিকা — Techno" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { items, remove } = useWishlist();
  const { addItem } = useCart();

  return (
    <>
      <AnnouncementBar message={null} />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-xl font-bold">পছন্দের তালিকা</h1>
        {items.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-xl border bg-card py-16 text-center">
            <p className="text-sm text-muted-foreground">আপনার পছন্দের তালিকা এখনো খালি।</p>
            <Link
              to="/products"
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              পণ্য দেখুন
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-4 rounded-xl border bg-card p-3"
              >
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
                  <Link
                    to="/products/$slug"
                    params={{ slug: item.slug }}
                    className="line-clamp-1 text-sm font-medium hover:text-primary"
                  >
                    {item.name_bn}
                  </Link>
                  <p className="price-tag mt-1 text-base">{formatBn(item.price)}</p>
                  <p className={`text-xs ${item.stock_qty > 0 ? "text-primary" : "text-destructive"}`}>
                    {item.stock_qty > 0 ? "স্টকে আছে" : "স্টকে নেই"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={item.stock_qty <= 0}
                    onClick={() => {
                      addItem({
                        product_id: item.product_id,
                        slug: item.slug,
                        name_bn: item.name_bn,
                        model: null,
                        brand_name: item.brand_name,
                        price: item.price,
                        image_url: item.image_url,
                        stock_qty: item.stock_qty,
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> কার্টে যোগ
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.product_id)}
                    className="grid h-9 w-9 place-items-center rounded-md border text-muted-foreground hover:text-destructive"
                    aria-label={`${item.name_bn} পছন্দের তালিকা থেকে সরান`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

// Keep the type in use for future server-synced wishlist
export type WishlistProduct = ProductCardData;

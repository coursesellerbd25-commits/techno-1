import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Heart,
  ImageOff,
  Minus,
  Plus,
  RotateCcw,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { getProductBySlug } from "@/lib/catalog.functions";
import { discountPercent, formatBn, useCart, useWishlist } from "@/lib/cart";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { ProductGrid } from "@/components/store/ProductCard";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: params.slug });
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name_bn ?? "পণ্য"} — Techno` },
      {
        name: "description",
        content:
          loaderData?.short_desc_bn ??
          `${loaderData?.name_bn ?? "পণ্য"} কিনুন Techno থেকে সাশ্রয়ী দামে। দেশজুড়ে ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা।`,
      },
      { property: "og:title", content: `${loaderData?.name_bn ?? "পণ্য"} — Techno` },
      {
        property: "og:description",
        content: loaderData?.short_desc_bn ?? loaderData?.name_bn ?? "Techno",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductDetailPage,
  notFoundComponent: () => (
    <div className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
      <p className="text-lg font-semibold">পণ্যটি পাওয়া যায়নি</p>
      <p className="mt-2 text-sm text-muted-foreground">পণ্যটি হয়তো সরিয়ে ফেলা হয়েছে বা লিংকটি ভুল।</p>
      <Link to="/products" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        সকল পণ্য দেখুন
      </Link>
    </div>
  ),
});

function ProductDetailPage() {
  const product = Route.useLoaderData();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const discount = discountPercent(product.price, product.original_price);
  const inStock = product.stock_qty > 0;
  const wishlisted = has(product.id);

  const cartItem = {
    product_id: product.id,
    slug: product.slug,
    name_bn: product.name_bn,
    model: product.model,
    brand_name: product.brand_name,
    price: product.price,
    image_url: product.images[0] ?? null,
    stock_qty: product.stock_qty,
  };

  function buyNow() {
    addItem(cartItem, qty);
    navigate({ to: "/cart" });
  }

  return (
    <>
      <AnnouncementBar message={null} />
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 lg:pb-10">
        <nav className="text-xs text-muted-foreground" aria-label="ব্রেডক্রাম্ব">
          <Link to="/" className="hover:text-primary">হোম</Link>
          <span className="mx-1">/</span>
          {product.category_slug && (
            <>
              <Link to="/products" search={{ category: product.category_slug }} className="hover:text-primary">
                {product.category_name}
              </Link>
              <span className="mx-1">/</span>
            </>
          )}
          <span className="text-foreground">{product.name_bn}</span>
        </nav>

        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <button
              type="button"
              onClick={() => product.images[0] && setGalleryOpen(true)}
              className="block aspect-square w-full overflow-hidden rounded-xl bg-aqua-soft"
              aria-label="ছবি বড় করে দেখুন"
            >
              {product.images[activeImage] ?? product.images[0] ? (
                <img
                  src={product.images[activeImage] ?? product.images[0]}
                  alt={product.name_bn}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-muted-foreground/60">
                  <ImageOff className="h-12 w-12" />
                </div>
              )}
            </button>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === activeImage ? "border-primary" : "border-transparent"}`}
                    aria-label={`ছবি ${i + 1}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-sm text-muted-foreground">
              {product.brand_name ?? "ব্র্যান্ড"}
              {product.model ? ` · মডেল: ${product.model}` : ""}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-snug">{product.name_bn}</h1>
            {product.short_desc_bn && (
              <p className="mt-2 text-sm text-muted-foreground">{product.short_desc_bn}</p>
            )}

            <div className="mt-4 flex items-baseline gap-3">
              <span className="price-tag text-3xl text-brand-deep">{formatBn(product.price)}</span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatBn(product.original_price)}
                  </span>
                  {discount > 0 && (
                    <span className="rounded bg-promo px-2 py-0.5 text-sm font-semibold text-promo-foreground">
                      {discount}% ছাড়
                    </span>
                  )}
                </>
              )}
            </div>

            <p className={`mt-3 text-sm font-medium ${inStock ? "text-primary" : "text-destructive"}`}>
              {inStock ? "স্টকে আছে" : "স্টকে নেই"}
            </p>

            {inStock && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-md border">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-10 w-10 place-items-center"
                    aria-label="পরিমাণ কমান"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(q + 1, product.stock_qty, 10))}
                    className="grid h-10 w-10 place-items-center"
                    aria-label="পরিমাণ বাড়ান"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => addItem(cartItem, qty)}
                  className="flex items-center gap-2 rounded-md border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                  <ShoppingCart className="h-4 w-4" /> কার্টে যোগ করুন
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  এখনই কিনুন
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toggle({
                      product_id: product.id,
                      slug: product.slug,
                      name_bn: product.name_bn,
                      brand_name: product.brand_name,
                      price: product.price,
                      image_url: product.images[0] ?? null,
                      stock_qty: product.stock_qty,
                    })
                  }
                  className="grid h-10 w-10 place-items-center rounded-md border"
                  aria-label={wishlisted ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় সংরক্ষণ করুন"}
                  aria-pressed={wishlisted}
                >
                  <Heart className={`h-4 w-4 ${wishlisted ? "fill-promo text-promo" : ""}`} />
                </button>
              </div>
            )}

            {/* Delivery / warranty / return info */}
            <div className="mt-6 grid gap-3 rounded-xl border bg-card p-4 text-sm sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">ডেলিভারি</p>
                  <p className="text-xs text-muted-foreground">ঢাকার ভেতরে ৪৮ ঘণ্টা, ঢাকার বাইরে ৭২ ঘণ্টার মধ্যে (আনুমানিক)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">ওয়ারেন্টি</p>
                  <p className="text-xs text-muted-foreground">
                    {product.warranty_months
                      ? `${product.warranty_months} মাসের ওয়ারেন্টি`
                      : "ওয়ারেন্টি প্রযোজ্য নয়"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">রিটার্ন</p>
                  <p className="text-xs text-muted-foreground">ত্রুটিপূর্ণ পণ্যে ৭ দিনের রিটার্ন</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specs */}
        {product.specs.length > 0 && (
          <section className="mt-10">
            <h2 className="section-title">টেকনিক্যাল স্পেসিফিকেশন</h2>
            <table className="mt-4 w-full max-w-2xl overflow-hidden rounded-xl border text-sm">
              <tbody>
                {product.specs.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                    <th scope="row" className="w-40 px-4 py-2.5 text-left font-medium">{s.label}</th>
                    <td className="px-4 py-2.5">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Description */}
        {product.description_bn && (
          <section className="mt-10 max-w-3xl">
            <h2 className="section-title">বিস্তারিত বিবরণ</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description_bn}</p>
          </section>
        )}

        {/* Related */}
        {product.related.length > 0 && (
          <section className="mt-12">
            <h2 className="section-title">সম্পর্কিত পণ্য</h2>
            <div className="mt-5">
              <ProductGrid products={product.related} />
            </div>
          </section>
        )}
      </main>

      {/* Image zoom dialog */}
      {galleryOpen && product.images[0] && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setGalleryOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="পণ্যের ছবি"
        >
          <img
            src={product.images[activeImage] ?? product.images[0]}
            alt={product.name_bn}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            onClick={() => setGalleryOpen(false)}
            className="absolute right-4 top-4 rounded-md bg-white/10 px-3 py-1.5 text-sm text-white"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Sticky mobile purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t bg-card px-4 py-3 shadow-lg lg:hidden">
        <div>
          <p className="price-tag text-lg text-brand-deep">{formatBn(product.price)}</p>
          <p className={`text-xs ${inStock ? "text-primary" : "text-destructive"}`}>
            {inStock ? "স্টকে আছে" : "স্টকে নেই"}
          </p>
        </div>
        <button
          type="button"
          disabled={!inStock}
          onClick={buyNow}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          এখনই কিনুন
        </button>
      </div>

      <Footer />
    </>
  );
}

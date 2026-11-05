import { Link } from "@tanstack/react-router";
import { Heart, ImageOff, ShoppingCart } from "lucide-react";
import type { ProductCard as ProductCardData } from "@/lib/catalog.functions";
import { discountPercent, formatBn, useCart, useWishlist } from "@/lib/cart";

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const discount = discountPercent(product.price, product.original_price);
  const wishlisted = has(product.id);
  const inStock = product.stock_qty > 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
        {product.is_best_seller && (
          <span className="rounded bg-promo px-2 py-0.5 text-[11px] font-semibold text-promo-foreground">
            বেস্ট সেলার
          </span>
        )}
        {product.is_new && (
          <span className="rounded bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
            নতুন
          </span>
        )}
        {discount > 0 && (
          <span className="rounded bg-promo px-2 py-0.5 text-[11px] font-semibold text-promo-foreground">
            -{discount}%
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => toggle({
          product_id: product.id,
          slug: product.slug,
          name_bn: product.name_bn,
          brand_name: product.brand_name,
          price: product.price,
          image_url: product.image_url,
          stock_qty: product.stock_qty,
        })}
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white"
        aria-label={wishlisted ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় সংরক্ষণ করুন"}
        aria-pressed={wishlisted}
      >
        <Heart className={`h-4 w-4 ${wishlisted ? "fill-promo text-promo" : "text-muted-foreground"}`} />
      </button>

      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block aspect-square overflow-hidden bg-aqua-soft"
        aria-label={product.name_bn}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name_bn}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground/60">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-muted-foreground">
          {product.brand_name ?? "ব্র্যান্ড"}
          {product.model ? ` · ${product.model}` : ""}
        </p>
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="mt-1 line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
        >
          {product.name_bn}
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="price-tag text-lg text-foreground">{formatBn(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatBn(product.original_price)}
            </span>
          )}
        </div>

        <p className={`mt-1 text-xs ${inStock ? "text-primary" : "text-destructive"}`}>
          {inStock ? "স্টকে আছে" : "স্টকে নেই"}
        </p>

        <button
          type="button"
          disabled={!inStock}
          onClick={() =>
            addItem({
              product_id: product.id,
              slug: product.slug,
              name_bn: product.name_bn,
              model: product.model,
              brand_name: product.brand_name,
              price: product.price,
              image_url: product.image_url,
              stock_qty: product.stock_qty,
            })
          }
          className="mt-3 flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          কার্টে যোগ করুন
        </button>
      </div>
    </div>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

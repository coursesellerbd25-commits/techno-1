import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Public catalog reads (products, categories, brands) run through a
 * server publishable client during SSR — no session, narrow anon SELECT
 * policies protect every column these functions touch.
 */
function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    // Opaque sb_ keys aren't JWTs: send apikey, strip the default bearer.
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryData[]> => {
    const sb = publicClient();
    const { data } = await sb
      .from("categories")
      .select("id, slug, name_bn, icon, products(count)")
      .eq("is_active", true)
      .order("sort_order");
    return (data ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      name_bn: c.name_bn,
      icon: c.icon,
      product_count: c.products?.[0]?.count ?? 0,
    }));
  }
);

export type BrandData = { id: string; slug: string; name: string };

export const getBrands = createServerFn({ method: "GET" }).handler(
  async (): Promise<BrandData[]> => {
    const sb = publicClient();
    const { data } = await sb
      .from("brands")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("name");
    return data ?? [];
  }
);

export type ProductCard = {
  id: string;
  slug: string;
  name_bn: string;
  model: string | null;
  brand_name: string | null;
  category_slug: string | null;
  price: number;
  original_price: number | null;
  stock_qty: number;
  image_url: string | null;
  rating_avg: number;
  review_count: number;
  sold_count: number;
  is_best_seller: boolean;
  is_featured: boolean;
  is_new: boolean;
};

const PRODUCT_CARD_SELECT = `
  id, slug, name_bn, model, price, original_price, stock_qty,
  is_best_seller, is_featured, sold_count, review_count, rating_avg, created_at,
  brands(name),
  categories(slug),
  product_images(url, sort_order)
`;

type RawProduct = {
  id: string;
  slug: string;
  name_bn: string;
  model: string | null;
  price: number;
  original_price: number | null;
  stock_qty: number;
  is_best_seller: boolean;
  is_featured: boolean;
  sold_count: number;
  review_count: number;
  rating_avg: number;
  created_at: string;
  brands: { name: string } | null;
  categories: { slug: string } | null;
  product_images: { url: string; sort_order: number }[] | null;
};

function toCard(row: RawProduct): ProductCard {
  const isNew =
    Date.now() - new Date(row.created_at).getTime() < 1000 * 60 * 60 * 24 * 30;
  return {
    id: row.id,
    slug: row.slug,
    name_bn: row.name_bn,
    model: row.model,
    brand_name: row.brands?.name ?? null,
    category_slug: row.categories?.slug ?? null,
    price: Number(row.price),
    original_price: row.original_price ? Number(row.original_price) : null,
    stock_qty: row.stock_qty,
    image_url: (() => {
      const imgs = row.product_images;
      if (imgs && imgs.length > 0) {
        const first = [...imgs].sort((a, b) => a.sort_order - b.sort_order)[0];
        return first?.url ?? null;
      }
      return null;
    })(),
    rating_avg: Number(row.rating_avg),
    review_count: row.review_count,
    sold_count: row.sold_count,
    is_best_seller: row.is_best_seller,
    is_featured: row.is_featured,
    is_new: isNew,
  };
}

export type CategoryData = {
  id: string;
  slug: string;
  name_bn: string;
  icon: string | null;
  product_count: number;
};

export type HomepageData = {
  announcement: string | null;
  categories: CategoryData[];
  bestSellers: ProductCard[];
  newArrivals: ProductCard[];
  offers: ProductCard[];
};

export const getHomepageData = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomepageData> => {
    const sb = publicClient();

    const [categoriesRes, bestRes, newRes, offersRes, annRes] = await Promise.all([
      sb
        .from("categories")
        .select("id, slug, name_bn, icon, products(count)")
        .eq("is_active", true)
        .order("sort_order"),
      sb
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .eq("is_best_seller", true)
        .order("sold_count", { ascending: false })
        .limit(8),
      sb
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8),
      sb
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .not("original_price", "is", null)
        .limit(8),
      sb
        .from("announcements")
        .select("message_bn")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1),
    ]);

    return {
      announcement: annRes.data?.[0]?.message_bn ?? null,
      categories: (categoriesRes.data ?? []).map((c) => ({
        id: c.id,
        slug: c.slug,
        name_bn: c.name_bn,
        icon: c.icon,
        product_count: c.products?.[0]?.count ?? 0,
      })),
      bestSellers: (bestRes.data ?? []).map(toCard),
      newArrivals: (newRes.data ?? []).map(toCard),
      offers: (offersRes.data ?? []).map(toCard),
    };
  }
);

export type ProductDetail = {
  id: string;
  slug: string;
  name_bn: string;
  model: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  category_name: string | null;
  category_slug: string | null;
  short_desc_bn: string | null;
  description_bn: string | null;
  price: number;
  original_price: number | null;
  stock_qty: number;
  warranty_months: number | null;
  specs: { label: string; value: string }[];
  images: string[];
  variants: { variant_name: string; variant_value: string; price_delta: number }[];
  related: ProductCard[];
};

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<ProductDetail | null> => {
    const sb = publicClient();

    const { data, error } = await sb
      .from("products")
      .select(
        `id, slug, name_bn, model, short_desc_bn, description_bn, price, original_price,
         stock_qty, warranty_months, specs, created_at,
         brands(name, slug),
         categories(name_bn, slug),
         product_images(url, sort_order),
         product_variants(variant_name, variant_value, price_delta, stock_qty)`
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;

    const categoryId = (await sb
      .from("products")
      .select("category_id")
      .eq("slug", slug)
      .maybeSingle()).data?.category_id;

    let related: ProductCard[] = [];
    if (categoryId) {
      const relRes = await sb
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .eq("category_id", categoryId)
        .neq("slug", slug)
        .limit(4);
      related = (relRes.data ?? []).map(toCard);
    }

    return {
      id: data.id,
      slug: data.slug,
      name_bn: data.name_bn,
      model: data.model,
      brand_name: data.brands?.name ?? null,
      brand_slug: data.brands?.slug ?? null,
      category_name: data.categories?.name_bn ?? null,
      category_slug: data.categories?.slug ?? null,
      short_desc_bn: data.short_desc_bn,
      description_bn: data.description_bn,
      price: Number(data.price),
      original_price: data.original_price ? Number(data.original_price) : null,
      stock_qty: data.stock_qty,
      warranty_months: data.warranty_months,
      specs: (data.specs ?? []) as { label: string; value: string }[],
      images: (data.product_images ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => img.url),
      variants: (data.product_variants ?? []).map((v) => ({
        variant_name: v.variant_name,
        variant_value: v.variant_value,
        price_delta: Number(v.price_delta),
      })),
      related,
    };
  });

export type CatalogQuery = {
  category?: string;
  brand?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  discounted?: boolean;
  sort?: "relevant" | "price_asc" | "price_desc" | "best_selling" | "rating" | "newest";
  page?: number;
  perPage?: number;
};

export type CatalogResult = {
  products: ProductCard[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export const getCatalog = createServerFn({ method: "GET" })
  .inputValidator((input: CatalogQuery) => input)
  .handler(async ({ data }): Promise<CatalogResult> => {
    const sb = publicClient();
    const page = Math.max(1, data.page ?? 1);
    const perPage = Math.min(48, Math.max(1, data.perPage ?? 12));

    let query = sb.from("products").select(PRODUCT_CARD_SELECT, { count: "exact" }).eq("is_active", true);

    if (data.category) query = query.eq("categories.slug", data.category);
    if (data.brand) query = query.eq("brands.slug", data.brand);
    if (data.inStock) query = query.gt("stock_qty", 0);
    if (data.discounted) query = query.not("original_price", "is", null);
    if (typeof data.minPrice === "number") query = query.gte("price", data.minPrice);
    if (typeof data.maxPrice === "number") query = query.lte("price", data.maxPrice);
    if (data.q) {
      const q = data.q.trim().slice(0, 80);
      if (q) {
        query = query.or(
          `name_bn.ilike.%${q}%,model.ilike.%${q}%,short_desc_bn.ilike.%${q}%,description_bn.ilike.%${q}%,brands.name.ilike.%${q}%`
        );
      }
    }

    switch (data.sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "rating":
        query = query.order("rating_avg", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "best_selling":
      case "relevant":
      default:
        query = query.order("sold_count", { ascending: false });
        break;
    }

    const from = (page - 1) * perPage;
    const { data: rows, count, error } = await query.range(from, from + perPage - 1);

    return {
      products: (rows ?? []).map(toCard),
      total: count ?? 0,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
    };
  });

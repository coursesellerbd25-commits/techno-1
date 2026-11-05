import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { getCatalog, getBrands, type CatalogQuery } from "@/lib/catalog.functions";
import { getCategories } from "@/lib/catalog.functions";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { ProductGrid } from "@/components/store/ProductCard";

const SORT_OPTIONS = [
  { value: "relevant", label: "প্রাসঙ্গিকতা অনুযায়ী" },
  { value: "price_asc", label: "দাম: কম থেকে বেশি" },
  { value: "price_desc", label: "দাম: বেশি থেকে কম" },
  { value: "best_selling", label: "সর্বাধিক বিক্রিত" },
  { value: "rating", label: "সর্বোচ্চ রেটিং" },
  { value: "newest", label: "নতুন পণ্য" },
] as const;

const VALID_SORTS = SORT_OPTIONS.map((s) => s.value) as unknown as string[];

type SearchShape = {
  category?: string;
  brand?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  discounted?: boolean;
  sort?: string;
  page?: number;
};

type SearchPatch = {
  [K in keyof SearchShape]?: SearchShape[K] | undefined;
};

function parseSearch(search: Record<string, unknown>): SearchShape {
  const out: SearchShape = {};
  for (const key of ["category", "brand", "q", "sort"] as const) {
    const v = search[key];
    if (typeof v === "string" && v) out[key] = v.slice(0, 100);
  }
  if (!(out.sort && VALID_SORTS.includes(out.sort))) {
    delete out.sort;
  }
  for (const key of ["minPrice", "maxPrice", "page"] as const) {
    const n = Number(search[key]);
    if (search[key] !== undefined && Number.isFinite(n) && n >= 0) out[key] = Math.floor(n);
  }
  if (search["inStock"] === true || search["inStock"] === "true") out.inStock = true;
  if (search["discounted"] === true || search["discounted"] === "true") out.discounted = true;
  return out;
}

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>) => parseSearch(search),
  loaderDeps: ({ search }) => ({
    category: search.category,
    brand: search.brand,
    q: search.q,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    inStock: search.inStock,
    discounted: search.discounted,
    sort: search.sort,
    page: search.page ?? 1,
  }),
  loader: ({ deps }) => {
    const data: CatalogQuery = {
      sort: (deps.sort ?? "relevant") as NonNullable<CatalogQuery["sort"]>,
      page: deps.page,
    };
    if (deps.category) data.category = deps.category;
    if (deps.brand) data.brand = deps.brand;
    if (deps.q) data.q = deps.q;
    if (typeof deps.minPrice === "number") data.minPrice = deps.minPrice;
    if (typeof deps.maxPrice === "number") data.maxPrice = deps.maxPrice;
    if (deps.inStock) data.inStock = true;
    if (deps.discounted) data.discounted = true;
    return getCatalog({ data });
  },
  head: ({ match }) => ({
    meta: [
      {
        title: match.loaderDeps?.category
          ? `${match.loaderDeps.category.replace(/-/g, " ")} — Techno`
          : "সকল পণ্য — Techno",
      },
      {
        name: "description",
        content: "ল্যাপটপ, হেডফোন, গেমিং অ্যাক্সেসরিজসহ সকল টেক পণ্য — ফিল্টার ও বাছাই করে সহজে খুঁজুন।",
      },
      { property: "og:title", content: "সকল পণ্য — Techno" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });
  const [minPrice, setMinPrice] = useState(search.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(search.maxPrice?.toString() ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: () => getBrands() });

  const activeCategory = categories?.find((c) => c.slug === search.category);

  function update(next: SearchPatch, resetPage = true) {
    const merged: Record<string, unknown> = { ...search, ...next };
    if (resetPage) delete merged["page"];
    // Drop empty keys so URLs stay clean
    for (const k of Object.keys(merged)) {
      if (merged[k] === undefined || merged[k] === "" || merged[k] === false) {
        delete merged[k];
      }
    }
    navigate({ search: merged as unknown as typeof search });
  }

  function applyPrice() {
    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;
    update({
      minPrice: min && Number.isFinite(min) && min >= 0 ? min : undefined,
      maxPrice: max && Number.isFinite(max) && max >= 0 ? max : undefined,
    });
  }

  function resetFilters() {
    setMinPrice("");
    setMaxPrice("");
    navigate({ search: {} });
  }

  const filters = (
    <div className="grid gap-5 text-sm">
      <div>
        <p className="mb-2 font-semibold">ক্যাটাগরি</p>
        <ul className="grid gap-1.5">
          <li>
            <button
              type="button"
              onClick={() => update({ category: undefined })}
              className={`rounded px-2 py-1 text-left hover:bg-muted ${!search.category ? "bg-accent font-medium" : ""}`}
            >
              সব ক্যাটাগরি
            </button>
          </li>
          {(categories ?? []).map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => update({ category: c.slug })}
                className={`rounded px-2 py-1 text-left hover:bg-muted ${search.category === c.slug ? "bg-accent font-medium" : ""}`}
              >
                {c.name_bn} ({c.product_count})
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 font-semibold">ব্র্যান্ড</p>
        <select
          value={search.brand ?? ""}
          onChange={(e) => update({ brand: e.target.value || undefined })}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5"
          aria-label="ব্র্যান্ড নির্বাচন"
        >
          <option value="">সব ব্র্যান্ড</option>
          {(brands ?? []).map((b) => (
            <option key={b.id} value={b.slug}>{b.name}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 font-semibold">দাম (৳)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="ন্যূনতম"
            aria-label="ন্যূনতম দাম"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="সর্বোচ্চ"
            aria-label="সর্বোচ্চ দাম"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5"
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="mt-2 w-full rounded-md bg-secondary px-3 py-1.5 font-medium text-secondary-foreground hover:opacity-90"
        >
          প্রয়োগ করুন
        </button>
      </div>

      <div className="grid gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!search.inStock}
            onChange={(e) => update({ inStock: e.target.checked || undefined })}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          শুধু স্টকে আছে
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!search.discounted}
            onChange={(e) => update({ discounted: e.target.checked || undefined })}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          ছাড়সহ পণ্য
        </label>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="text-left text-primary hover:underline"
      >
        সব ফিল্টার রিসেট করুন
      </button>
    </div>
  );

  return (
    <>
      <AnnouncementBar message={null} />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <nav className="text-xs text-muted-foreground" aria-label="ব্রেডক্রাম্ব">
          <Link to="/" className="hover:text-primary">হোম</Link>
          <span className="mx-1">/</span>
          <span className="text-foreground">{activeCategory ? activeCategory.name_bn : "সকল পণ্য"}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">
            {search.q ? `"${search.q}" এর ফলাফল` : activeCategory ? activeCategory.name_bn : "সকল পণ্য"}
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm lg:hidden"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" /> ফিল্টার
            </button>
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-muted-foreground">বাছাই:</span>
              <select
                value={search.sort ?? "relevant"}
                onChange={(e) => update({ sort: e.target.value === "relevant" ? undefined : e.target.value })}
                className="rounded-md border border-input bg-background px-2 py-1.5"
                aria-label="বাছাই নির্বাচন"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">মোট {data.total}টি পণ্য</p>

        <div className="mt-5 flex gap-6">
          <aside className="hidden w-56 shrink-0 lg:block">{filters}</aside>
          <div className="min-w-0 flex-1">
            {filtersOpen && (
              <div className="mb-5 rounded-xl border bg-card p-4 lg:hidden">{filters}</div>
            )}

            {data.products.length > 0 ? (
              <ProductGrid products={data.products} />
            ) : (
              <div className="grid place-items-center rounded-xl border bg-card py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  দুঃখিত, কোনো পণ্য পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  ফিল্টার রিসেট করুন
                </button>
              </div>
            )}

            {data.totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label="পেজিনেশন">
                <button
                  type="button"
                  disabled={data.page <= 1}
                  onClick={() => update({ page: data.page - 1 }, false)}
                  className="grid h-9 w-9 place-items-center rounded-md border disabled:opacity-40"
                  aria-label="আগের পেজ"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 text-sm">
                  পেজ {data.page} / {data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={data.page >= data.totalPages}
                  onClick={() => update({ page: data.page + 1 }, false)}
                  className="grid h-9 w-9 place-items-center rounded-md border disabled:opacity-40"
                  aria-label="পরের পেজ"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

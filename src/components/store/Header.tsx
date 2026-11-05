import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { getCategories } from "@/lib/catalog.functions";
import { useCart, useWishlist } from "@/lib/cart";
import { toast } from "sonner";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Techno হোম">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-bold text-primary-foreground">
        T
      </span>
      <span className="text-xl font-bold tracking-tight text-white">Techno</span>
    </Link>
  );
}

export function Header() {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { items: wishlist } = useWishlist();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  useEffect(() => {
    // Session-aware account affordance; kept lightweight here.
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session));
    });
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim().slice(0, 80);
    if (!q) return;
    setMenuOpen(false);
    navigate({ to: "/products", search: { q } });
  }

  return (
    <header className="sticky top-0 z-40 bg-brand-dark text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-3">
          <button
            className="grid h-10 w-10 place-items-center rounded-md hover:bg-white/10 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Logo />

          <form onSubmit={submitSearch} className="ml-auto hidden flex-1 items-center sm:flex sm:max-w-md lg:max-w-xl" role="search">
            <div className="relative w-full">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                aria-label="পণ্য খুঁজুন"
                maxLength={80}
                className="w-full rounded-md border-0 bg-white py-2 pl-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="সার্চ করুন"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:ml-2">
            <Link
              to="/wishlist"
              className="relative grid h-10 w-10 place-items-center rounded-md hover:bg-white/10"
              aria-label="পছন্দের তালিকা"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-promo px-1 text-[10px] font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              to="/account"
              className="hidden h-10 w-10 place-items-center rounded-md hover:bg-white/10 sm:grid"
              aria-label={signedIn ? "আমার অ্যাকাউন্ট" : "লগইন"}
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              to="/cart"
              className="relative grid h-10 w-10 place-items-center rounded-md hover:bg-white/10"
              aria-label="শপিং কার্ট"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-promo px-1 text-[10px] font-bold">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={submitSearch} className="flex items-center pb-2 sm:hidden" role="search">
          <div className="relative w-full">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              aria-label="পণ্য খুঁজুন"
              maxLength={80}
              className="w-full rounded-md border-0 bg-white py-2 pl-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded bg-primary text-primary-foreground"
              aria-label="সার্চ করুন"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Category nav (desktop) */}
        <nav className="hidden pb-1 lg:block" aria-label="পণ্য ক্যাটাগরি">
          <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar text-sm">
            {(categories ?? []).map((c) => (
              <li key={c.slug}>
                <Link
                  to="/products"
                  search={{ category: c.slug }}
                  className="block whitespace-nowrap rounded px-3 py-1.5 hover:bg-white/10"
                >
                  {c.name_bn}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="pb-3 lg:hidden" aria-label="মোবাইল মেনু">
            <ul className="grid gap-1 text-sm">
              {(categories ?? []).map((c) => (
                <li key={c.slug}>
                  <Link
                    to="/products"
                    search={{ category: c.slug }}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded px-3 py-2 hover:bg-white/10"
                  >
                    {c.name_bn}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded px-3 py-2 hover:bg-white/10"
                >
                  <User className="h-4 w-4" /> {signedIn ? "আমার অ্যাকাউন্ট" : "লগইন / নিবন্ধন"}
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}

export function WishlistIconButton() {
  const { toggle } = useWishlist();
  return (
    <button
      onClick={() => toast.info("পণ্য কার্ডের হার্ট আইকন থেকে সংরক্ষণ করুন")}
      className="sr-only"
      type="button"
    />
  );
}

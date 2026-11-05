<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules

- Public catalog reads (products, categories, brands) go through the publishable-key client inside `createServerFn` handlers (`src/lib/catalog.functions.ts`) — never admin clients for public reads.
- Store configuration (delivery fees, bKash/Nagad numbers, contact) is read only through `getStoreConfig`, which whitelists fields from the admin-protected settings table.
- Order creation happens only in the public route `src/routes/api/public/orders.ts`: validate all inputs, re-read prices and stock from the database, derive the delivery zone from the district server-side, and decrement stock with a guarded update (`gte(stock_qty, qty)`) that rolls the order back on failure — never trust client-sent totals, prices, or zones.
- Coupon eligibility is validated server-side only (`/api/public/coupons/validate` is a preview; the order route re-validates); usage increments via the `increment_coupon_usage` SQL function.
- Roles live in `public.user_roles` checked through `public.has_role()`; admin surfaces must verify the role server-side, never from client-visible flags.
- Guest cart and wishlist persist in localStorage (`techno_cart_v1`, `techno_wishlist_v1`); checkout recalculates everything server-side, so cart values are display-only.
- Monetary amounts are stored as `numeric(12,2)` and never computed with floating-point math on the server.
- User-facing copy is Bangla; brand/model names and technical specs stay in English. Prices display as ৳ with `formatBn`.

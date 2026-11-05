# Techno — Bangladeshi Tech E-Commerce Roadmap

## Phase 1 — Foundation ✅
- [x] Lovable Cloud enabled (database, auth, storage)
- [x] Database schema (products, orders, coupons, reviews, wishlist, campaigns, settings, roles…)
- [x] Design system (Techno brand palette, Hind Siliguri Bangla font)
- [x] Root layout: header, search, categories nav, footer, announcement bar
- [x] Homepage: hero, trust row, categories, best sellers, offers, new arrivals, collections, newsletter
- [x] Seed catalog: 10 categories, 10 brands, 12 products (3 product photos so far)

## Phase 2 — Catalog ✅ (photo backfill pending)
- [x] Product listing page with filters/sorting/pagination (URL params)
- [x] Product detail page (gallery, specs, qty, sticky mobile buy bar, related)
- [x] Wishlist page (local, guest-friendly)
- [ ] Remaining product photos (9 more, 4 per turn max)

## Phase 3 — Shopping ✅ (bKash/Nagad numbers pending owner)
- [x] Cart (qty controls, delivery fee estimate, free-delivery threshold)
- [x] Checkout: guest checkout, BD division/district selectors, COD + manual bKash/Nagad (disabled until owner adds merchant numbers)
- [x] /api/public/orders: server-side validation, price/stock re-check, guarded stock decrement, coupon validation
- [x] Order confirmation page + coupon preview endpoint

## Phase 4 — Accounts ✅ (address book pending)
- [x] Email/password auth + Google + Lovable sign-in
- [x] /auth, /reset-password, /account (profile + order history + logout)

## Phase 5 — Admin (pending)
- [ ] Admin dashboard (metrics, orders, products, inventory, coupons, promotions)
- [ ] Admin role assignment for the owner

## Phase 6 — Polish (pending)
- [ ] Reviews flow (product reviews, verified purchases)
- [ ] Product comparison, bundles, campaigns/banners UI
- [ ] SEO sitemap, structured data, analytics events UI
- [ ] Tests (coupon validation, order totals, stock guard)

## Blocked / owner inputs needed
- Real business contact details (footer/contact show honest placeholders)
- bKash/Nagad merchant numbers (checkout disables those options until added)
- Admin: owner account needs the 'admin' role once created

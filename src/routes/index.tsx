import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Gamepad2,
  Headphones,
  ImageOff,
  Keyboard,
  Laptop,
  Monitor,
  Package,
  PlugZap,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  Watch,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { getHomepageData } from "@/lib/catalog.functions";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { ProductGrid } from "@/components/store/ProductCard";

export const Route = createFileRoute("/")({
  loader: () => getHomepageData(),
  head: () => ({
    meta: [
      {
        title: "Techno — ল্যাপটপ, গ্যাজেট ও টেক অ্যাক্সেসরিজ অনলাইন শপ বাংলাদেশ",
      },
      {
        name: "description",
        content:
          "ল্যাপটপ, হেডফোন, স্মার্টওয়াচ ও প্রয়োজনীয় টেক অ্যাক্সেসরিজ কিনুন সাশ্রয়ী দামে। দেশজুড়ে ডেলিভারি, ক্যাশ অন ডেলিভারি সুবিধা।",
      },
      {
        property: "og:title",
        content: "Techno — আপনার প্রযুক্তির সঙ্গী, এখন আরও হাতের নাগালে",
      },
      {
        property: "og:description",
        content:
          "ল্যাপটপ, গ্যাজেট ও টেক অ্যাক্সেসরিজ অনলাইনে কিনুন সহজে, নিশ্চিন্তে এবং সাশ্রয়ী দামে।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  laptop: Laptop,
  keyboard: Keyboard,
  headphones: Headphones,
  gamepad: Gamepad2,
  watch: Watch,
  smartphone: Smartphone,
  monitor: Monitor,
  router: Wifi,
  plug: PlugZap,
  package: Package,
};

function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-deep">
      <img
        src="/images/hero-tech.jpg"
        alt="ল্যাপটপ, হেডফোন ও টেক গ্যাজেট"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-deep via-brand-deep/80 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        <div className="max-w-lg">
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            আপনার প্রযুক্তির সঙ্গী, এখন আরও হাতের নাগালে
          </h1>
          <p className="mt-4 text-base text-white/85 sm:text-lg">
            ল্যাপটপ, গ্যাজেট ও প্রয়োজনীয় টেক অ্যাক্সেসরিজ কিনুন সহজে, নিশ্চিন্তে এবং
            সাশ্রয়ী দামে।
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              এখনই কেনাকাটা করুন
            </Link>
            <Link
              to="/products"
              search={{ discounted: true }}
              className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              সেরা অফার দেখুন
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: "নিরাপদ পেমেন্ট", desc: "ক্যাশ অন ডেলিভারি ও বিকাশ/Nagad" },
  { icon: ShoppingBag, title: "সহজ অর্ডার প্রক্রিয়া", desc: "কয়েক ধাপেই অর্ডার সম্পন্ন" },
  { icon: Truck, title: "নির্ভরযোগ্য ডেলিভারি", desc: "দেশজুড়ে ডেলিভারি সুবিধা" },
  { icon: BadgeCheck, title: "ওয়ারেন্টি সুবিধা", desc: "নির্বাচিত পণ্যে ওয়ারেন্টি" },
  { icon: Headphones, title: "গ্রাহক সহায়তা", desc: "যেকোনো প্রয়োজনে আমরা পাশে" },
];

function TrustRow() {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-3 lg:grid-cols-5">
        {TRUST_ITEMS.map((t) => (
          <div key={t.title} className="flex items-start gap-3">
            <t.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Categories({
  categories,
}: {
  categories: Awaited<ReturnType<typeof getHomepageData>>["categories"];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="section-title">ক্যাটাগরি</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {categories.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon ?? "package"] ?? Package;
          return (
            <Link
              key={c.id}
              to="/products"
              search={{ category: c.slug }}
              className="flex flex-col items-center gap-2 rounded-xl border bg-aqua-soft px-3 py-5 text-center transition-shadow hover:shadow-md"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-dark">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium leading-tight">{c.name_bn}</span>
              <span className="text-[11px] text-muted-foreground">{c.product_count}টি পণ্য</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      {href && (
        <Link to={href} className="text-sm font-medium text-primary hover:underline">
          সব দেখুন
        </Link>
      )}
    </div>
  );
}

const COLLECTIONS = [
  { title: "৳৫,০০০-এর মধ্যে সেরা গ্যাজেট", search: { maxPrice: 5000 } },
  { title: "স্টুডেন্টদের প্রয়োজনীয় টেক", search: { category: "laptops-computers" } },
  { title: "গেমারদের পছন্দের পণ্য", search: { category: "gaming-accessories" } },
  { title: "হোম অফিস সেটআপ", search: { category: "keyboard-mouse" } },
  { title: "সেরা বাজেট হেডফোন", search: { category: "headphones-earbuds", maxPrice: 3000 } },
];

function Collections() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="section-title">বাছাই করা কালেকশন</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.title}
            to="/products"
            search={c.search}
            className="rounded-xl bg-brand-dark px-5 py-6 text-white transition-opacity hover:opacity-95"
          >
            <p className="text-base font-semibold">{c.title}</p>
            <p className="mt-1 text-sm text-white/70">দেখুন →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 255) {
      setStatus("error");
      setMessage("সঠিক ইমেইল ঠিকানা লিখুন।");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, consent: true }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      setStatus(data.ok ? "ok" : "error");
      setMessage(data.message);
      if (data.ok) setEmail("");
    } catch {
      setStatus("error");
      setMessage("সাবস্ক্রাইব করা যায়নি, আবার চেষ্টা করুন।");
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-xl bg-aqua px-6 py-8 text-center sm:px-10">
        <h2 className="section-title text-brand-deep">নতুন কী আসছে জানতে চান?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-brand-deep/80">
          টেক দুনিয়ার নতুন খবর ও সেরা অফার সবার আগে পেতে সাবস্ক্রাইব করুন।
          সাবস্ক্রাইব করলে আপনি মার্কেটিং ইমেইল পেতে সম্মত হচ্ছেন।
        </p>
        <form onSubmit={submit} className="mx-auto mt-5 flex max-w-md gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="আপনার ইমেইল ঠিকানা"
            aria-label="ইমেইল ঠিকানা"
            maxLength={255}
            className="min-w-0 flex-1 rounded-md border-0 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-md bg-brand-deep px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep/90 disabled:opacity-60"
          >
            {status === "loading" ? "অপেক্ষা করুন..." : "সাবস্ক্রাইব"}
          </button>
        </form>
        {message && (
          <p className={`mt-3 text-sm ${status === "ok" ? "text-brand-dark" : "text-promo"}`} role="status">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

function Index() {
  const data = Route.useLoaderData();
  return (
    <>
      <AnnouncementBar message={data.announcement} />
      <Header />
      <main>
        <Hero />
        <TrustRow />
        <Categories categories={data.categories} />
        <section className="mx-auto max-w-7xl px-4 py-10">
          <SectionHeader title="সর্বাধিক বিক্রিত পণ্য" href="/products" />
          {data.bestSellers.length > 0 ? (
            <ProductGrid products={data.bestSellers} />
          ) : (
            <div className="grid place-items-center rounded-xl border bg-card py-16 text-muted-foreground">
              <ImageOff className="mb-2 h-8 w-8" />
              <p className="text-sm">শীঘ্রই সর্বাধিক বিক্রিত পণ্য যুক্ত হবে</p>
            </div>
          )}
        </section>
        {data.offers.length > 0 && (
          <section className="bg-aqua-soft py-10">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="section-title text-brand-deep">বিশেষ অফার</h2>
                  <p className="text-sm text-brand-deep/70">নির্বাচিত পণ্যে চলছে আকর্ষণীয় ছাড়</p>
                </div>
                <Link
                  to="/products"
                  search={{ discounted: true }}
                  className="text-sm font-medium text-brand-dark hover:underline"
                >
                  সব অফার দেখুন
                </Link>
              </div>
              <ProductGrid products={data.offers} />
            </div>
          </section>
        )}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <SectionHeader title="নতুন পণ্য" href="/products" />
          <ProductGrid products={data.newArrivals} />
        </section>
        <Collections />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}

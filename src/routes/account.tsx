import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { formatBn } from "@/lib/cart";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "আমার অ্যাকাউন্ট — Techno" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type OrderRow = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  payment_method: string;
};

const STATUS_BN: Record<string, string> = {
  pending: "পেন্ডিং",
  confirmed: "কনফার্মড",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  delivered: "ডেলিভারড",
  cancelled: "বাতিল",
};

const PAYMENT_BN: Record<string, string> = {
  cod: "ক্যাশ অন ডেলিভারি",
  bkash: "bKash",
  nagad: "Nagad",
};

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null; phone: string | null } | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      // Restore the post-login destination saved before a social sign-in.
      const saved = sessionStorage.getItem("techno_auth_redirect");
      if (session?.user && saved) {
        sessionStorage.removeItem("techno_auth_redirect");
        navigate({ to: saved.startsWith("/") && !saved.startsWith("//") ? saved : "/account" });
      }
    });
    const channel = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => channel.data.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setOrders(null);
      return;
    }
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
    supabase
      .from("orders")
      .select("id, order_number, total, status, created_at, payment_method")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <AccountShell>
        <p className="py-16 text-center text-sm text-muted-foreground">লোড হচ্ছে...</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell>
        <div className="grid place-items-center py-16 text-center">
          <p className="text-sm text-muted-foreground">অ্যাকাউন্ট দেখতে লগইন করুন।</p>
          <div className="mt-4 flex gap-3">
            <Link
              to="/auth"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              লগইন
            </Link>
            <Link to="/auth" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
              নিবন্ধন
            </Link>
          </div>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell>
      <div className="grid gap-6">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">প্রোফাইল</h2>
          <div className="mt-3 grid gap-1 text-sm">
            <p><span className="text-muted-foreground">নাম:</span> {profile?.full_name ?? "— যুক্ত করা হয়নি"}</p>
            <p><span className="text-muted-foreground">ইমেইল:</span> {user.email}</p>
            <p><span className="text-muted-foreground">মোবাইল:</span> {profile?.phone ?? "— যুক্ত করা হয়নি"}</p>
          </div>
        </section>

        <section>
          <h2 className="section-title">অর্ডার হিস্ট্রি</h2>
          {orders === null ? (
            <p className="mt-3 text-sm text-muted-foreground">লোড হচ্ছে...</p>
          ) : orders.length === 0 ? (
            <div className="mt-3 grid place-items-center rounded-xl border bg-card py-12 text-center">
              <p className="text-sm text-muted-foreground">এখনো কোনো অর্ডার নেই।</p>
              <Link to="/products" className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                কেনাকাটা শুরু করুন
              </Link>
            </div>
          ) : (
            <div className="mt-3 grid gap-3">
              {orders.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-4 text-sm">
                  <div>
                    <p className="font-semibold tracking-wide">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("bn-BD")} · {PAYMENT_BN[o.payment_method] ?? o.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="price-tag">{formatBn(Number(o.total))}</p>
                    <p className="text-xs text-muted-foreground">{STATUS_BN[o.status] ?? o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={signOut}
          className="justify-self-start rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          লগআউট
        </button>
      </div>
    </AccountShell>
  );
}

function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar message={null} />
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-xl font-bold">আমার অ্যাকাউন্ট</h1>
        <div className="mt-5">{children}</div>
      </main>
      <Footer />
    </>
  );
}

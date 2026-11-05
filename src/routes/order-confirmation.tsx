import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { formatBn } from "@/lib/cart";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";

export const Route = createFileRoute("/order-confirmation")({
  head: () => ({
    meta: [
      { title: "অর্ডার নিশ্চিত হয়েছে — Techno" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmationPage,
});

type OrderSummary = {
  order_number: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  payment_method: "cod" | "bkash" | "nagad";
  division: string;
  district: string;
  address: string;
};

function OrderConfirmationPage() {
  const location = useLocation();
  let order = (location.state as { order?: OrderSummary } | null)?.order;
  if (!order) {
    try {
      const raw = sessionStorage.getItem("techno_last_order");
      if (raw) order = JSON.parse(raw) as OrderSummary;
    } catch {
      /* ignore */
    }
  }

  if (!order) {
    return (
      <>
        <AnnouncementBar message={null} />
        <Header />
        <main className="mx-auto grid max-w-md place-items-center px-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">অর্ডারের তথ্য পাওয়া যায়নি।</p>
          <Link to="/" className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            হোমে ফিরে যান
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const paymentLabels: Record<OrderSummary["payment_method"], string> = {
    cod: "ক্যাশ অন ডেলিভারি",
    bkash: "bKash",
    nagad: "Nagad",
  };

  return (
    <>
      <AnnouncementBar message={null} />
      <Header />
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-xl border bg-card p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-3 text-xl font-bold">অর্ডার সফলভাবে সম্পন্ন হয়েছে!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            আপনার অর্ডার গ্রহণ করা হয়েছে। আমাদের টিম শীঘ্রই ফোনে যাচাই করে অর্ডার কনফার্ম করবে।
          </p>

          <div className="mt-6 grid gap-2 rounded-lg bg-muted/60 p-4 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">অর্ডার নম্বর</span>
              <span className="font-bold tracking-wide">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">সর্বমোট</span>
              <span className="price-tag">{formatBn(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">পেমেন্ট মাধ্যম</span>
              <span>{paymentLabels[order.payment_method]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ডেলিভারি ঠিকানা</span>
              <span className="max-w-[60%] text-right">{order.district}, {order.division}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">অর্ডার স্ট্যাটাস</span>
              <span>পেন্ডিং (যাচাই চলছে)</span>
            </div>
          </div>

          {order.payment_method !== "cod" && (
            <p className="mt-4 rounded-lg bg-aqua-soft p-3 text-xs text-brand-deep">
              পেমেন্ট যাচাইয়ের পর অর্ডার কনফার্ম হবে। TrxID পরে দিতে চাইলে আমাদের সহায়তা টিমের সাথে যোগাযোগ করুন।
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              আরও কেনাকাটা করুন
            </Link>
            <Link to="/account" className="rounded-md border px-5 py-2.5 text-sm font-semibold hover:bg-accent">
              আমার অ্যাকাউন্ট
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

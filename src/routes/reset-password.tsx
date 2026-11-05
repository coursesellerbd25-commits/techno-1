import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "নতুন পাসওয়ার্ড সেট করুন — Techno" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Recovery links arrive with #type=recovery in the URL hash.
    const hash = window.location.hash;
    setIsRecovery(hash.includes("type=recovery"));
    setChecking(false);
    if (hash.includes("type=recovery")) {
      // Allow the Supabase client to pick up the session from the hash.
      supabase.auth.getSession().then(() => {});
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
      return;
    }
    if (password !== confirm) {
      toast.error("দুটি পাসওয়ার্ড মিলছে না।");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("পাসওয়ার্ড পরিবর্তন করা যায়নি: " + error.message);
      return;
    }
    toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে। এখন লগইন করুন।");
    navigate({ to: "/auth" });
  }

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <>
      <AnnouncementBar message={null} />
      <Header />
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl border bg-card p-6">
          {checking ? (
            <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
          ) : !isRecovery ? (
            <>
              <h1 className="text-lg font-bold">পাসওয়ার্ড রিসেট</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                রিসেট লিংকটি সঠিকভাবে খোলা যায়নি। নতুন করে রিসেট লিংক চাইলে লগইন পেজ থেকে
                "পাসওয়ার্ড ভুলে গেছেন?" ব্যবহার করুন।
              </p>
              <Link to="/auth" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                লগইন পেজে যান
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold">নতুন পাসওয়ার্ড সেট করুন</h1>
              <form onSubmit={submit} className="mt-4 grid gap-4">
                <div>
                  <label htmlFor="rp-new" className="mb-1 block text-sm">নতুন পাসওয়ার্ড</label>
                  <input id="rp-new" type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                </div>
                <div>
                  <label htmlFor="rp-confirm" className="mb-1 block text-sm">পাসওয়ার্ড আবার লিখুন</label>
                  <input id="rp-confirm" type="password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  পাসওয়ার্ড পরিবর্তন করুন
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

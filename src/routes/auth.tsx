import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AnnouncementBar } from "@/components/store/AnnouncementBar";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect =
      typeof search["redirect"] === "string" &&
      search["redirect"].startsWith("/") &&
      !search["redirect"].startsWith("//")
        ? search["redirect"]
        : undefined;
    return redirect ? { redirect } : {};
  },
  head: () => ({
    meta: [
      { title: "লগইন / নিবন্ধন — Techno" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

/** Only same-origin relative paths may be used as a post-login destination. */
function safeRedirect(path: string | undefined): string {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/account";
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const dest = safeRedirect(search.redirect);
  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) || mail.length > 255) {
      toast.error("সঠিক ইমেইল ঠিকানা লিখুন।");
      return;
    }
    if (password.length < 8) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
      return;
    }
    setBusy(true);
    if (mode === "register") {
      if (name.trim().length < 2) {
        toast.error("আপনার নাম লিখুন।");
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: mail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name.trim().slice(0, 100) },
        },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message === "User already registered" ? "এই ইমেইল দিয়ে অ্যাকাউন্ট আছে — লগইন করুন।" : "নিবন্ধন করা যায়নি: " + error.message);
        return;
      }
      setAwaitingConfirm(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
      setBusy(false);
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "ইমেইল বা পাসওয়ার্ড সঠিক নয়।" : "লগইন করা যায়নি: " + error.message);
        return;
      }
      navigate({ to: dest });
    }
  }

  async function social(provider: "google" | "lovable") {
    try {
      sessionStorage.setItem("techno_auth_redirect", dest);
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) toast.error("সাইন-ইন করা যায়নি: " + result.error.message);
    } catch {
      toast.error("সাইন-ইন করা যায়নি, আবার চেষ্টা করুন।");
    }
  }

  if (awaitingConfirm) {
    return (
      <>
        <AnnouncementBar message={null} />
        <Header />
        <main className="mx-auto grid max-w-md place-items-center px-4 py-20 text-center">
          <div className="rounded-xl border bg-card p-8">
            <h1 className="text-lg font-bold">ইমেইল চেক করুন</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              অ্যাকাউন্ট নিশ্চিত করতে আপনার ইমেইলে পাঠানো লিংকে ক্লিক করুন। নিশ্চিত হওয়ার পর লগইন করতে পারবেন।
            </p>
            <Link to="/auth" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              লগইন পেজে ফিরে যান
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <AnnouncementBar message={null} />
      <Header />
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-md py-2 text-sm font-semibold ${mode === "login" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              লগইন
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-md py-2 text-sm font-semibold ${mode === "register" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              নিবন্ধন
            </button>
          </div>

          <form onSubmit={submit} className="grid gap-4">
            {mode === "register" && (
              <div>
                <label htmlFor="auth-name" className="mb-1 block text-sm">নাম</label>
                <input id="auth-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="mb-1 block text-sm">ইমেইল</label>
              <input id="auth-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
            </div>
            <div>
              <label htmlFor="auth-pass" className="mb-1 block text-sm">পাসওয়ার্ড</label>
              <input id="auth-pass" type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              {mode === "login" && (
                <Link to="/reset-password" className="mt-1 inline-block text-xs text-primary hover:underline">
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              )}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "লগইন করুন" : "নিবন্ধন করুন"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> অথবা <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => social("google")}
              className="rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Google দিয়ে চালিয়ে যান
            </button>
            <button
              type="button"
              onClick={() => social("lovable")}
              className="rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Lovable দিয়ে চালিয়ে যান
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/newsletter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { email?: string; consent?: boolean };
          const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 255) : "";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return Response.json({ ok: false, message: "সঠিক ইমেইল ঠিকানা লিখুন।" }, { status: 400 });
          }
          if (body.consent !== true) {
            return Response.json(
              { ok: false, message: "মার্কেটিং ইমেইলের জন্য সম্মতি প্রয়োজন।" },
              { status: 400 }
            );
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin
            .from("newsletter_subscribers")
            .insert({ email, consent_given: true });

          if (error) {
            if ((error as { code?: string }).code === "23505") {
              return Response.json({ ok: true, message: "আপনি ইতিমধ্যে সাবস্ক্রাইব করেছেন। ধন্যবাদ!" });
            }
            console.error("newsletter insert failed", error);
            return Response.json({ ok: false, message: "সাবস্ক্রাইব করা যায়নি, আবার চেষ্টা করুন।" }, { status: 500 });
          }
          return Response.json({ ok: true, message: "ধন্যবাদ! সাবস্ক্রিপশন সফল হয়েছে।" });
        } catch (err) {
          console.error("newsletter error", err);
          return Response.json({ ok: false, message: "সাবস্ক্রাইব করা যায়নি, আবার চেষ্টা করুন।" }, { status: 500 });
        }
      },
    },
  },
});

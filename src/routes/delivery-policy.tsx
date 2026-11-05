import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/store/PolicyPage";
import { DELIVERY_POLICY } from "@/lib/policies";

export const Route = createFileRoute("/delivery-policy")({
  head: () => ({
    meta: [
      { title: "ডেলিভারি তথ্য — Techno" },
      { name: "description", content: "Techno-র ডেলিভারি চার্জ, সময়সীমা ও অর্ডার যাচাই প্রক্রিয়া।" },
      { property: "og:title", content: "ডেলিভারি তথ্য — Techno" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <PolicyPage content={DELIVERY_POLICY} />,
});

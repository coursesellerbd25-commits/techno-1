import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/store/PolicyPage";
import { WARRANTY_POLICY } from "@/lib/policies";

export const Route = createFileRoute("/warranty-policy")({
  head: () => ({
    meta: [
      { title: "ওয়ারেন্টি তথ্য — Techno" },
      { name: "description", content: "পণ্যের ওয়ারেন্টি নীতিমালা ও ক্লেইম প্রক্রিয়া।" },
      { property: "og:title", content: "ওয়ারেন্টি তথ্য — Techno" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <PolicyPage content={WARRANTY_POLICY} />,
});

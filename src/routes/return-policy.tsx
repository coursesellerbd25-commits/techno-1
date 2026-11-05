import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/store/PolicyPage";
import { RETURN_POLICY } from "@/lib/policies";

export const Route = createFileRoute("/return-policy")({
  head: () => ({
    meta: [
      { title: "রিটার্ন ও রিফান্ড নীতিমালা — Techno" },
      { name: "description", content: "ত্রুটিপূর্ণ পণ্যের রিটার্ন ও রিফান্ড প্রক্রিয়া।" },
      { property: "og:title", content: "রিটার্ন ও রিফান্ড নীতিমালা — Techno" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <PolicyPage content={RETURN_POLICY} />,
});

import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/store/PolicyPage";
import { PRIVACY_POLICY } from "@/lib/policies";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "প্রাইভেসি পলিসি — Techno" },
      { name: "description", content: "Techno কীভাবে আপনার তথ্য সংগ্রহ ও ব্যবহার করে।" },
      { property: "og:title", content: "প্রাইভেসি পলিসি — Techno" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <PolicyPage content={PRIVACY_POLICY} />,
});

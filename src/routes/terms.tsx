import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/store/PolicyPage";
import { TERMS } from "@/lib/policies";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "শর্তাবলী — Techno" },
      { name: "description", content: "Techno থেকে কেনাকাটার সাধারণ শর্তাবলী।" },
      { property: "og:title", content: "শর্তাবলী — Techno" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <PolicyPage content={TERMS} />,
});

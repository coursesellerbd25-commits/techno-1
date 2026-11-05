import type { ReactNode } from "react";

export type PolicyContent = {
  title: string;
  updatedNote?: string;
  sections: { heading: string; body: ReactNode }[];
};

export function PolicyPage({ content }: { content: PolicyContent }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="section-title text-2xl text-brand-deep">{content.title}</h1>
      {content.updatedNote && (
        <p className="mt-1 text-xs text-muted-foreground">{content.updatedNote}</p>
      )}
      <div className="mt-6 grid gap-6 text-sm leading-relaxed">
        {content.sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-semibold text-foreground">{s.heading}</h2>
            <div className="mt-1 text-muted-foreground">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

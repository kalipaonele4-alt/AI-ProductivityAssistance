import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ToolWorkspace } from "@/components/tool-workspace";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — AI Workplace Assistant" },
      {
        name: "description",
        content:
          "Get a structured research brief with key points, trade-offs, what to verify and suggested next steps.",
      },
      { property: "og:title", content: "AI Research Assistant" },
      {
        property: "og:description",
        content: "Structured research briefs for work and study questions.",
      },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  return (
    <AppShell
      title="AI Research Assistant"
      description="Structured briefs with key points, trade-offs and what to verify"
    >
      <ToolWorkspace
        kind="research"
        intro="Ask a work or study question. The brief separates settled knowledge from uncertainty and never fabricates sources or statistics."
        submitLabel="Research this"
        emptyHint="Ask your question on the left to get a structured brief you can edit and save."
        titleFrom={(v) => v["question"]?.slice(0, 80) || "Research brief"}
        fields={[
          { name: "question", label: "Your question", type: "textarea", rows: 3, placeholder: "e.g. What should we consider before moving our team to a four-day week?", required: true },
          { name: "domain", label: "Field or domain", type: "input", placeholder: "e.g. HR policy, software engineering, marketing" },
          {
            name: "audience",
            label: "Who is this for",
            type: "select",
            options: ["A busy professional", "An executive team", "A university assignment", "A client-facing document", "Personal understanding"],
          },
          { name: "known", label: "What you already know", type: "textarea", rows: 4, placeholder: "So the brief doesn't repeat the obvious" },
          {
            name: "depth",
            label: "Depth",
            type: "select",
            options: ["Balanced overview", "Quick orientation", "Deep dive"],
          },
        ]}
      />
    </AppShell>
  );
}

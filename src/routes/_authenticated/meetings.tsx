import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ToolWorkspace } from "@/components/tool-workspace";

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — AI Workplace Assistant" },
      {
        name: "description",
        content:
          "Turn raw meeting notes or transcripts into a summary, decisions, owned action items, risks and open questions.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer" },
      {
        property: "og:description",
        content: "Summaries, decisions and action items extracted from your meeting notes.",
      },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  return (
    <AppShell
      title="Meeting Notes Summarizer"
      description="Summary, decisions, action items and open questions from raw notes"
    >
      <ToolWorkspace
        kind="meeting"
        intro="Paste your notes or transcript exactly as they are. The assistant only uses what's in the text — it won't invent owners or dates."
        submitLabel="Summarize meeting"
        emptyHint="Paste your notes on the left and generate a structured record with decisions and action items."
        titleFrom={(v) => v["title"]?.slice(0, 80) || "Meeting summary"}
        fields={[
          { name: "title", label: "Meeting title", type: "input", placeholder: "e.g. Q3 planning review" },
          { name: "attendees", label: "Attendees", type: "input", placeholder: "e.g. Sam, Priya, Thabo, Lena" },
          {
            name: "notes",
            label: "Raw notes or transcript",
            type: "textarea",
            rows: 14,
            placeholder: "Paste everything — bullet points, half sentences, transcript text.",
            required: true,
          },
        ]}
      />
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ToolWorkspace } from "@/components/tool-workspace";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — AI Workplace Assistant" },
      {
        name: "description",
        content:
          "Draft professional workplace emails with the right tone, structure and call to action, then edit and save them.",
      },
      { property: "og:title", content: "Smart Email Generator" },
      {
        property: "og:description",
        content: "Generate polished workplace emails you can edit, copy and save.",
      },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  return (
    <AppShell
      title="Smart Email Generator"
      description="Professional emails with the right tone, structure and next step"
    >
      <ToolWorkspace
        kind="email"
        intro="Tell the assistant who you're writing to and what you need. It builds the email around your role, context, objective, constraints and a fixed output format."
        submitLabel="Generate email"
        emptyHint="Fill in the recipient and purpose, then generate a draft. You can edit every word before you send it."
        titleFrom={(v) => v["purpose"]?.slice(0, 80) || "Email draft"}
        fields={[
          { name: "recipient", label: "Recipient", type: "input", placeholder: "e.g. Priya, Head of Operations", required: true },
          {
            name: "audience",
            label: "Relationship",
            type: "select",
            options: ["Manager", "Colleague", "Direct report", "Client", "Supplier", "Lecturer or professor", "Recruiter", "Whole team"],
          },
          { name: "purpose", label: "Purpose of the email", type: "textarea", rows: 3, placeholder: "e.g. Ask for a two-week extension on the audit report and propose a new date", required: true },
          { name: "context", label: "Key points and background", type: "textarea", rows: 5, placeholder: "Dates, numbers, names, anything the email must include" },
          {
            name: "tone",
            label: "Tone",
            type: "select",
            options: ["Professional and friendly", "Formal", "Direct and brief", "Warm and appreciative", "Apologetic", "Persuasive"],
          },
          {
            name: "length",
            label: "Length",
            type: "select",
            options: ["Concise (under 120 words)", "Standard", "Detailed"],
          },
        ]}
      />
    </AppShell>
  );
}

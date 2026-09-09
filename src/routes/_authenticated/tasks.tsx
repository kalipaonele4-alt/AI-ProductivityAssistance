import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ToolWorkspace } from "@/components/tool-workspace";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — AI Workplace Assistant" },
      {
        name: "description",
        content:
          "Turn a goal and a deadline into a prioritised, time-boxed task plan with milestones and realistic estimates.",
      },
      { property: "og:title", content: "AI Task Planner" },
      {
        property: "og:description",
        content: "Prioritised, time-boxed plans for work and study goals.",
      },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  return (
    <AppShell
      title="AI Task Planner"
      description="A prioritised, time-boxed plan for any goal or deadline"
    >
      <ToolWorkspace
        kind="task"
        intro="Describe the goal and how much time you actually have. The plan is built around your deadline and constraints, and flags when it isn't realistic."
        submitLabel="Build my plan"
        emptyHint="Describe your goal and deadline, then generate a sequenced plan with priorities and estimates."
        titleFrom={(v) => v["goal"]?.slice(0, 80) || "Task plan"}
        fields={[
          { name: "goal", label: "Goal", type: "textarea", rows: 3, placeholder: "e.g. Deliver the client onboarding handbook", required: true },
          { name: "deadline", label: "Deadline", type: "input", placeholder: "e.g. Friday 26 September" },
          { name: "capacity", label: "Time available", type: "input", placeholder: "e.g. about 6 hours a week, mostly mornings" },
          { name: "constraints", label: "Constraints and dependencies", type: "textarea", rows: 4, placeholder: "e.g. Legal review takes 3 days, I'm away next Tuesday" },
        ]}
      />
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  NotebookPen,
  ListChecks,
  Search,
  MessagesSquare,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getStats, listItems } from "@/lib/assistant.functions";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Your unified AI workspace: email drafting, meeting summaries, task planning, research briefs and a workplace chatbot.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "One dashboard for AI-powered emails, meeting notes, task plans and research.",
      },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  {
    to: "/email",
    label: "Smart Email Generator",
    blurb: "Draft the email, set the tone, keep the intent.",
    icon: Mail,
    key: "email",
  },
  {
    to: "/meetings",
    label: "Meeting Notes Summarizer",
    blurb: "Decisions and action items from messy notes.",
    icon: NotebookPen,
    key: "meeting",
  },
  {
    to: "/tasks",
    label: "AI Task Planner",
    blurb: "A prioritised plan that fits your deadline.",
    icon: ListChecks,
    key: "task",
  },
  {
    to: "/research",
    label: "AI Research Assistant",
    blurb: "Structured briefs with what still needs checking.",
    icon: Search,
    key: "research",
  },
  {
    to: "/chat",
    label: "Workplace Chatbot",
    blurb: "Talk it through with a workplace-aware assistant.",
    icon: MessagesSquare,
    key: "chat",
  },
] as const;

const KIND_LABEL: Record<string, string> = {
  email: "Email",
  meeting: "Meeting",
  task: "Task plan",
  research: "Research",
};

function Dashboard() {
  const statsFn = useServerFn(getStats);
  const listFn = useServerFn(listItems);

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => statsFn({}) });
  const recent = useQuery({
    queryKey: ["saved-items", "all"],
    queryFn: () => listFn({ data: { limit: 6 } }),
  });

  return (
    <AppShell
      title="Dashboard"
      description="Everything your AI assistant can do, in one place"
    >
      <div className="space-y-8">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 px-6 py-8 text-white shadow-sm md:px-10 md:py-10">
          <h2 className="max-w-2xl text-2xl font-semibold md:text-3xl">
            Spend less time on the writing around the work.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            Draft emails, summarise meetings, plan your week and research decisions — all with
            structured prompts tuned for professionals and students.
          </p>
          <Link
            to="/chat"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition-opacity hover:opacity-90"
          >
            Ask the assistant <ArrowRight className="size-4" />
          </Link>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {TOOLS.map(({ key, label }) => (
            <div key={key} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {key === "chat" ? "Chat messages" : `${KIND_LABEL[key]} saved`}
              </p>
              {stats.isLoading ? (
                <Skeleton className="mt-2 h-7 w-12" />
              ) : (
                <p className="mt-1 text-2xl font-semibold">
                  {(stats.data as Record<string, number> | undefined)?.[key] ?? 0}
                </p>
              )}
              <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TOOLS.map(({ to, label, blurb, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <p className="mt-4 font-medium">{label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Recent work</h2>
          {recent.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : recent.isError ? (
            <p className="text-sm text-destructive">Could not load your recent work.</p>
          ) : (recent.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing saved yet. Generate something with one of the tools above and save it — it
              will show up here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {(recent.data ?? []).map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                    {KIND_LABEL[item.kind] ?? item.kind}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

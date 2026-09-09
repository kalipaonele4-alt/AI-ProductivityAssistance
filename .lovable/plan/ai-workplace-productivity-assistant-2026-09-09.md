# AI Workplace Productivity Assistant

One app, five AI tools, one dashboard. Polished light interface with a dark navy sidebar and indigo/purple accents.

## Pages

- **Dashboard** — greeting, quick stats (drafts, notes, tasks, chats), shortcut cards to each tool, recent activity list.
- **Smart Email Generator** — pick recipient type, tone, purpose, key points; get a subject line + body you can edit inline, copy, or save.
- **Meeting Notes Summarizer** — paste or type raw notes/transcript; get a summary, decisions, action items with owners, and follow-up questions.
- **AI Task Planner** — describe a goal and deadline; get a prioritised, time-boxed plan you can tick off and edit.
- **AI Research Assistant** — ask a work/study question; get a structured brief with key points, considerations, and suggested next steps.
- **Workplace Chatbot** — ongoing conversation with a workplace-savvy assistant, streamed replies.

## Look and feel

- Collapsible dark navy sidebar with icon-only mode on desktop; slide-in drawer on mobile with a top bar.
- Light content area, soft cards, indigo/blue/purple accent gradients, generous spacing.
- Every generated output lands in an editable panel with Copy, Regenerate, and Save actions.
- Loading skeletons/shimmer, friendly empty states, clear error messages, success toasts.
- A short responsible-AI note under every generated result plus a dedicated line in the footer.

## AI behaviour

Each tool sends a structured prompt built from five parts: role, context, objective, constraints, output format. This keeps results workplace-appropriate and consistently shaped, and lets each tool return predictable sections the interface can render.

## Technical notes

- Enable Lovable Cloud for AI access; all model calls run server-side.
- Chat and long generations stream; non-chat tools return structured output rendered into editable fields.
- Saved items (emails, notes, plans, research briefs, chat threads) persist in the database, scoped to the signed-in user, with sign-in via email/password.
- Routes: `/` dashboard, `/email`, `/meetings`, `/tasks`, `/research`, `/chat`, `/auth`.
- Shared layout component owns sidebar + drawer; shared result-panel component owns edit/copy/save/regenerate and state handling.
- Per-page titles and descriptions for search and sharing.

## Build order

1. Cloud + auth + database tables for saved items.
2. Layout, sidebar, drawer, design tokens.
3. Shared AI prompt builder + server functions.
4. The five tool pages.
5. Dashboard wiring to real saved data.

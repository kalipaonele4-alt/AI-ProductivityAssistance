import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessagesSquare, SendHorizontal, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { clearChat, listChatMessages, sendChatMessage } from "@/lib/assistant.functions";
import { AI_DISCLAIMER } from "@/lib/prompt-builder";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Workplace AI Chatbot — AI Workplace Assistant" },
      {
        name: "description",
        content:
          "Chat with a workplace-aware AI assistant about work, study, communication, planning and decisions.",
      },
      { property: "og:title", content: "Workplace AI Chatbot" },
      {
        property: "og:description",
        content: "An AI colleague for everyday work and study questions.",
      },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "How do I push back on an unrealistic deadline without damaging the relationship?",
  "Help me prepare for a performance review as the person being reviewed.",
  "Give me a 30-minute agenda for a project kickoff.",
  "How should I structure a study week around three deadlines?",
];

function ChatPage() {
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const listFn = useServerFn(listChatMessages);
  const sendFn = useServerFn(sendChatMessage);
  const clearFn = useServerFn(clearChat);

  const messages = useQuery({ queryKey: ["chat"], queryFn: () => listFn({}) });

  const send = useMutation({
    mutationFn: (content: string) => sendFn({ data: { content } }),
    onSuccess: async () => {
      setPending(null);
      await queryClient.invalidateQueries({ queryKey: ["chat"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      inputRef.current?.focus();
    },
    onError: (error: Error) => {
      setPending(null);
      toast.error(error.message || "The assistant could not reply. Please try again.");
      void queryClient.invalidateQueries({ queryKey: ["chat"] });
    },
  });

  const clear = useMutation({
    mutationFn: () => clearFn({}),
    onSuccess: () => {
      toast.success("Conversation cleared.");
      void queryClient.invalidateQueries({ queryKey: ["chat"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data, pending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit(text: string) {
    const content = text.trim();
    if (!content || send.isPending) return;
    setInput("");
    setPending(content);
    send.mutate(content);
  }

  const history = messages.data ?? [];
  const isEmpty = !messages.isLoading && history.length === 0 && !pending;

  return (
    <AppShell
      title="Workplace Assistant Chat"
      description="Ask anything about your work, study or day"
    >
      <div className="mx-auto flex h-[calc(100vh-13rem)] max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-semibold">Conversation</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={history.length === 0 || clear.isPending}
            onClick={() => clear.mutate()}
          >
            <Trash2 className="mr-2 size-4" />
            Clear
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
          {messages.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {messages.isError && (
            <p className="text-sm text-destructive">Could not load your conversation.</p>
          )}

          {isEmpty && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500 text-white">
                <MessagesSquare className="size-6" />
              </span>
              <div>
                <p className="font-medium">How can I help you today?</p>
                <p className="text-sm text-muted-foreground">
                  Ask about writing, planning, meetings, study or workplace situations.
                </p>
              </div>
              <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-xl border border-border px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id} className="max-w-[95%] whitespace-pre-wrap text-sm leading-relaxed">
                {m.content}
              </div>
            ),
          )}

          {pending && (
            <>
              <div className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {pending}
                </div>
              </div>
              <p className="animate-pulse text-sm text-muted-foreground">Thinking…</p>
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="space-y-2 border-t border-border p-4">
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              rows={2}
              placeholder="Ask the assistant…"
              className="min-h-[52px] resize-none"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
            />
            <Button
              size="icon"
              className="size-11 shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90"
              disabled={!input.trim() || send.isPending}
              aria-label="Send message"
              onClick={() => submit(input)}
            >
              <SendHorizontal className="size-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{AI_DISCLAIMER}</p>
        </div>
      </div>
    </AppShell>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText, type ModelMessage } from "ai";
import { z } from "zod";
import {
  AI_MODEL,
  createLovableAiGatewayProvider,
} from "./ai-gateway.server";
import { CHAT_SYSTEM_PROMPT, promptForKind } from "./prompt-builder";

const kindSchema = z.enum(["email", "meeting", "task", "research"]);

function gatewayError(status: number): string {
  if (status === 429) return "The assistant is busy right now. Please try again in a few moments.";
  if (status === 402)
    return "This workspace has run out of AI credits. Add credits in Lovable to keep generating.";
  if (status === 403) return "AI access is currently blocked for this workspace.";
  return "The assistant could not complete that request. Please try again.";
}

async function runModel(messages: ModelMessage[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this app.");
  const gateway = createLovableAiGatewayProvider(key);
  try {
    const result = streamText({ model: gateway(AI_MODEL), messages });
    const text = await result.text;
    if (!text.trim()) throw new Error("The assistant returned an empty response. Try again.");
    return text;
  } catch (error) {
    const status = (error as { statusCode?: number; status?: number })?.statusCode ??
      (error as { status?: number })?.status;
    if (typeof status === "number") throw new Error(gatewayError(status));
    throw error instanceof Error ? error : new Error("Unexpected AI error.");
  }
}

export const generateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ kind: kindSchema, fields: z.record(z.string(), z.string()) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const prompt = promptForKind(data);
    const content = await runModel([
      { role: "system", content: prompt.role },
      { role: "user", content: buildUserPrompt(prompt) },
    ]);
    return { content };
  });

function buildUserPrompt(p: ReturnType<typeof promptForKind>): string {
  return [
    `CONTEXT:\n${p.context}`,
    `OBJECTIVE:\n${p.objective}`,
    `CONSTRAINTS:\n${p.constraints.map((c) => `- ${c}`).join("\n")}`,
    `OUTPUT FORMAT:\n${p.outputFormat}`,
  ].join("\n\n");
}

export const listItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ kind: kindSchema.optional(), limit: z.number().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("saved_items")
      .select("id, kind, title, content, created_at, updated_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 25);
    if (data.kind) query = query.eq("kind", data.kind);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const saveItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        kind: kindSchema,
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        inputs: z.record(z.string(), z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("saved_items")
      .insert({
        user_id: context.userId,
        kind: data.kind,
        title: data.title,
        content: data.content,
        inputs: data.inputs ?? {},
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("saved_items")
      .select("kind")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const counts = { email: 0, meeting: 0, task: 0, research: 0 } as Record<string, number>;
    for (const row of rows ?? []) counts[row.kind] = (counts[row.kind] ?? 0) + 1;
    const { count: chatCount } = await context.supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId);
    return { ...counts, chat: chatCount ?? 0 };
  });

export const listChatMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ content: z.string().min(1).max(8000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error: insertError } = await supabase
      .from("chat_messages")
      .insert({ user_id: userId, role: "user", content: data.content });
    if (insertError) throw new Error(insertError.message);

    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(40);

    const messages: ModelMessage[] = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      ...(history ?? []).map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
    ];

    const reply = await runModel(messages);
    const { data: row, error } = await supabase
      .from("chat_messages")
      .insert({ user_id: userId, role: "assistant", content: reply })
      .select("id, role, content, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const clearChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

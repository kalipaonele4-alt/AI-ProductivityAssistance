import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, RefreshCw, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateContent, listItems, saveItem, deleteItem } from "@/lib/assistant.functions";
import { AI_DISCLAIMER, type ToolKind } from "@/lib/prompt-builder";

export type Field = {
  name: string;
  label: string;
  type: "input" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  rows?: number;
};

type Props = {
  kind: ToolKind;
  intro: string;
  fields: Field[];
  submitLabel: string;
  emptyHint: string;
  titleFrom: (values: Record<string, string>) => string;
};

export function ToolWorkspace({
  kind,
  intro,
  fields,
  submitLabel,
  emptyHint,
  titleFrom,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.type === "select" ? (f.options?.[0] ?? "") : ""])),
  );
  const [output, setOutput] = useState("");
  const queryClient = useQueryClient();

  const generateFn = useServerFn(generateContent);
  const saveFn = useServerFn(saveItem);
  const deleteFn = useServerFn(deleteItem);
  const listFn = useServerFn(listItems);

  const saved = useQuery({
    queryKey: ["saved-items", kind],
    queryFn: () => listFn({ data: { kind, limit: 10 } }),
  });

  const generate = useMutation({
    mutationFn: () => generateFn({ data: { kind, fields: values } }),
    onSuccess: (res) => {
      setOutput(res.content);
      toast.success("Draft ready — review and edit it below.");
    },
    onError: (error: Error) => toast.error(error.message || "Something went wrong."),
  });

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: { kind, title: titleFrom(values) || "Untitled", content: output, inputs: values },
      }),
    onSuccess: () => {
      toast.success("Saved to your library.");
      void queryClient.invalidateQueries({ queryKey: ["saved-items"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted.");
      void queryClient.invalidateQueries({ queryKey: ["saved-items"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not delete."),
  });

  const missingRequired = fields.some((f) => f.required && !values[f.name]?.trim());

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">{intro}</p>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="ml-1 text-destructive">*</span>}
              </Label>
              {field.type === "textarea" && (
                <Textarea
                  id={field.name}
                  rows={field.rows ?? 5}
                  {...(field.placeholder ? { placeholder: field.placeholder } : {})}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                />
              )}
              {field.type === "input" && (
                <Input
                  id={field.name}
                  {...(field.placeholder ? { placeholder: field.placeholder } : {})}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                />
              )}
              {field.type === "select" && (
                <Select
                  value={values[field.name] ?? ""}
                  onValueChange={(val) => setValues((v) => ({ ...v, [field.name]: val }))}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
        <Button
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90"
          disabled={generate.isPending || missingRequired}
          onClick={() => generate.mutate()}
        >
          <Wand2 className="mr-2 size-4" />
          {generate.isPending ? "Generating…" : submitLabel}
        </Button>
        {missingRequired && (
          <p className="text-xs text-muted-foreground">Fill in the required fields to continue.</p>
        )}
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Your editable draft</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!output}
                onClick={() => {
                  void navigator.clipboard.writeText(output);
                  toast.success("Copied to clipboard.");
                }}
              >
                <Copy className="mr-2 size-4" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={generate.isPending || missingRequired}
                onClick={() => generate.mutate()}
              >
                <RefreshCw className="mr-2 size-4" />
                Regenerate
              </Button>
              <Button size="sm" disabled={!output || save.isPending} onClick={() => save.mutate()}>
                <Save className="mr-2 size-4" />
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>

          {generate.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : generate.isError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {(generate.error as Error).message}
            </div>
          ) : output ? (
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="min-h-[420px] font-mono text-[13px] leading-relaxed"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
              <Sparkles className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">Nothing generated yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">{emptyHint}</p>
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">{AI_DISCLAIMER}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Saved in this section</h2>
          {saved.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : saved.isError ? (
            <p className="text-sm text-destructive">Could not load your saved items.</p>
          ) : (saved.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing saved yet. Generated drafts you save will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {(saved.data ?? []).map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2">
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setOutput(item.content)}
                  >
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => remove.mutate(item.id)}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

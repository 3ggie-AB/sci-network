import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, asArray } from "@/lib/api";

export const Route = createFileRoute("/dashboard/feedbacks")({
  component: Feedbacks,
});

type Feedback = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: number;
  status?: string;
  created_at?: string;
};

function Feedbacks() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const list = useQuery({
    queryKey: ["feedbacks"],
    queryFn: () => api<unknown>("/api/feedbacks?page=1&limit=50"),
  });

  const items = asArray<Feedback>(list.data);

  return (
    <>
      <PageHeader
        title="Feedbacks"
        description="Keluhan & laporan dari user."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New feedback
              </Button>
            </DialogTrigger>
            <NewFeedbackDialog
              onDone={() => {
                setOpen(false);
                qc.invalidateQueries({ queryKey: ["feedbacks"] });
              }}
            />
          </Dialog>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No feedbacks.
                </TableCell>
              </TableRow>
            )}
            {items.map((f, i) => (
              <TableRow key={f.id ?? i}>
                <TableCell className="font-medium">{f.title ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{f.category ?? "—"}</TableCell>
                <TableCell>
                  <span
                    className={`font-mono text-xs ${f.priority === 3 ? "text-destructive" : f.priority === 2 ? "text-warning" : "text-muted-foreground"}`}
                  >
                    {f.priority === 3 ? "high" : f.priority === 2 ? "medium" : "low"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">{f.status ?? "open"}</span>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {f.created_at ? new Date(f.created_at).toLocaleString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function NewFeedbackDialog({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "network",
    priority: 2,
  });

  const create = useMutation({
    mutationFn: () => api("/api/feedbacks", { method: "POST", json: form }),
    onSuccess: () => {
      toast.success("Feedback submitted");
      onDone();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New feedback</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Priority (1-3)</Label>
            <Input
              type="number"
              min={1}
              max={3}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 1 })}
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => create.mutate()} disabled={create.isPending || !form.title}>
          {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, PencilLine, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/DashboardLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, asArray } from "@/lib/api";

export const Route = createFileRoute("/dashboard/alerts")({
  component: Alerts,
});

type Alert = {
  id?: string;
  title?: string;
  message?: string;
  severity?: string;
  status?: string;
  device_name?: string;
  notes?: string | null;
  created_at?: string;
};

function Alerts() {
  const qc = useQueryClient();
  const [noteTarget, setNoteTarget] = useState<Alert | null>(null);
  const [noteText, setNoteText] = useState("");
  const list = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api<unknown>("/api/alerts?limit=100"),
    refetchInterval: 15_000,
  });

  const ack = useMutation({
    mutationFn: (id: string) => api(`/api/alerts/${id}/ack`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Alert acknowledged");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const resolve = useMutation({
    mutationFn: (id: string) => api(`/api/alerts/${id}/resolve`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Alert resolved");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const saveNotes = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api(`/api/alerts/${id}/notes`, { method: "PUT", json: { notes } }),
    onSuccess: () => {
      toast.success("Catatan alert disimpan");
      setNoteTarget(null);
      setNoteText("");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal simpan catatan"),
  });

  const deleteAlert = useMutation({
    mutationFn: (id: string) => api(`/api/alerts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Alert dihapus");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal hapus alert"),
  });

  const items = asArray<Alert>(list.data);

  return (
    <>
      <PageHeader title="Alerts" description="Alert otomatis dari scheduler & threshold." />
      <div className="overflow-hidden rounded-xl border border-border bg-card/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-48" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No alerts.
                </TableCell>
              </TableRow>
            )}
            {items.map((a, i) => (
              <TableRow key={a.id ?? i}>
                <TableCell className="max-w-[360px]">
                  <div className="truncate font-medium">{a.title ?? a.message ?? "Alert"}</div>
                  {a.notes ? (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.notes}</div>
                  ) : null}
                </TableCell>
                <TableCell className="font-mono text-xs">{a.device_name ?? "—"}</TableCell>
                <TableCell>
                  <span
                    className={`font-mono text-xs ${
                      a.severity === "critical"
                        ? "text-destructive"
                        : a.severity === "warning"
                          ? "text-warning"
                          : "text-muted-foreground"
                    }`}
                  >
                    {a.severity ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">{a.status ?? "—"}</span>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!a.id}
                      onClick={() => {
                        setNoteTarget(a);
                        setNoteText(a.notes ?? "");
                      }}
                    >
                      <PencilLine className="mr-1 h-3.5 w-3.5" /> Note
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!a.id}
                      onClick={() => a.id && ack.mutate(a.id)}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> Ack
                    </Button>
                    <Button size="sm" disabled={!a.id} onClick={() => a.id && resolve.mutate(a.id)}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resolve
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" disabled={!a.id}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus alert?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Alert ini akan dihapus dari daftar. Jika masalahnya masih aktif,
                            scheduler bisa membuat alert baru lagi.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => a.id && deleteAlert.mutate(a.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!noteTarget} onOpenChange={(open) => !open && setNoteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alert note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Catatan investigasi, tindakan, atau follow-up..."
            className="min-h-32"
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNoteTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={!noteTarget?.id || saveNotes.isPending}
              onClick={() =>
                noteTarget?.id && saveNotes.mutate({ id: noteTarget.id, notes: noteText })
              }
            >
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, RotateCcw } from "lucide-react";

interface Revision {
  id: string;
  createdAt: string;
}

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  snippetId: string;
  onRestore: (files: any) => void;
}

export function HistoryModal({ open, onClose, snippetId, onRestore }: HistoryModalProps) {
  const [revisions, setRevisions] = React.useState<Revision[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && snippetId) {
      setLoading(true);
      fetch(`/api/snippets/${snippetId}/revisions`)
        .then(res => res.json())
        .then(data => {
          if (data.revisions) {
            setRevisions(data.revisions);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [open, snippetId]);

  const handleRestore = async (revisionId: string) => {
    setRestoringId(revisionId);
    try {
      const res = await fetch(`/api/snippets/${snippetId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId }),
      });
      const data = await res.json();
      if (res.ok && data.files) {
        onRestore(data.files);
        onClose();
      }
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Snippet History
          </DialogTitle>
          <DialogDescription>
            Restore a previous version of this snippet. Only the last 5 changes are kept.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-4">Loading history...</div>
          ) : revisions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">No history available.</div>
          ) : (
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {revisions.map((rev) => (
                  <div key={rev.id} className="flex items-center justify-between">
                    <span className="text-sm">
                      {new Date(rev.createdAt).toLocaleString()}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRestore(rev.id)}
                      disabled={restoringId === rev.id}
                      className="gap-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {restoringId === rev.id ? "Restoring..." : "Restore"}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

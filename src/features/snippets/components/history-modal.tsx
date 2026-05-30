import * as React from "react";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Revision {
  id: string;
  createdAt: string;
}

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  snippetId: string;
  onRestore: (files: { filename: string; code: string; language: string }[]) => void;
}

export function HistoryModal({ open, onClose, snippetId, onRestore }: HistoryModalProps) {
  const [revisions, setRevisions] = React.useState<Revision[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);
  const { addToast } = useToast();

  React.useEffect(() => {
    if (open && snippetId) {
      const fetchRevisions = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/snippets/${snippetId}/revisions`);
          const data = await res.json();
          if (data.revisions) {
            setRevisions(data.revisions);
          }
        } catch {
          // Silently handle fetch error — UI shows empty state
        } finally {
          setLoading(false);
        }
      };
      fetchRevisions();
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
      } else {
        addToast("Failed to restore revision", "error");
      }
    } catch {
      addToast("Failed to restore revision", "error");
    } finally {
      setRestoringId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background border border-border shadow-lg rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Snippet History
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Restore a previous version of this snippet. Only the last 5 changes are kept.
          </p>
        </div>
        
        <div className="px-6 py-2">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-8">Loading history...</div>
          ) : revisions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No history available.</div>
          ) : (
            <div className="max-h-[250px] overflow-y-auto border border-border rounded-md p-2">
              <div className="space-y-2">
                {revisions.map((rev) => (
                  <div key={rev.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
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
            </div>
          )}
        </div>

        <div className="p-6 pt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

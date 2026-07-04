import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Bell, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { notificationsApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

// How often to re-check for newly-armed alerts while the app stays open.
// The initial fetch on mount covers the "shown on login" requirement (§5.2).
const POLL_INTERVAL_MS = 5 * 60 * 1000;

const PRIORITY_RANK: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-300",
  High: "bg-orange-100 text-orange-700 border-orange-300",
  Medium: "bg-blue-100 text-blue-700 border-blue-300",
  Low: "bg-gray-100 text-gray-700 border-gray-300",
};

interface PendingAlert {
  id: number;
  message: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  module?: string;
  dueAt?: string;
  status: string;
}

// The recurring pop-up / modal engine required by §5.2: fetches pending
// alerts for the current user on login and at a configurable interval, and
// keeps reappearing until each item is marked Done or snoozed with a reason
// (mandatory for Critical items — enforced client-side and re-validated by
// the API in routes/notifications.js).
export function NotificationPopupEngine() {
  const { isGuest, isAuthenticated } = useAuth();
  const [queue, setQueue] = useState<PendingAlert[]>([]);
  const [reasonText, setReasonText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"view" | "snooze">("view");
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    if (!isAuthenticated || isGuest) return;
    try {
      const data = await notificationsApi.getAll({ status: "Pending" });
      if (Array.isArray(data) && data.length > 0) {
        const sorted = [...data].sort((a, b) => {
          const pr = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
          if (pr !== 0) return pr;
          return new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime();
        });
        setQueue((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          return [...prev, ...sorted.filter((n) => !existingIds.has(n.id))];
        });
      }
    } catch (err) {
      // Alerts are a background enhancement — a failed fetch must never block navigation.
      console.error("Failed to load pending notifications", err);
    }
  }, [isAuthenticated, isGuest]);

  useEffect(() => {
    fetchPending();
    const interval = window.setInterval(fetchPending, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [fetchPending]);

  const current = queue[0];

  const closeCurrent = () => {
    setQueue((prev) => prev.slice(1));
    setReasonText("");
    setMode("view");
    setError(null);
  };

  const handleAcknowledge = async () => {
    if (!current) return;
    if (current.priority === "Critical" && !reasonText.trim()) {
      setError("A comment is required to mark a Critical alert as done.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await notificationsApi.acknowledge(current.id, reasonText.trim() || undefined);
      closeCurrent();
    } catch (err) {
      setError("Failed to acknowledge. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnoozeConfirm = async () => {
    if (!current) return;
    if (current.priority === "Critical" && !reasonText.trim()) {
      setError("A reason is required to snooze a Critical alert.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await notificationsApi.snooze(current.id, reasonText.trim() || undefined);
      closeCurrent();
    } catch (err) {
      setError("Failed to snooze. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!current || isGuest || !isAuthenticated) return null;

  const isCritical = current.priority === "Critical";

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {isCritical ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Bell className="h-5 w-5 text-blue-600" />
              )}
              <h2 className="text-lg font-semibold">{isCritical ? "Critical Alert" : "Reminder"}</h2>
            </div>
            <Badge className={`border ${PRIORITY_STYLES[current.priority] || PRIORITY_STYLES.Medium}`} variant="outline">
              {current.priority}
            </Badge>
          </div>

          <p className="text-sm text-gray-700">{current.message}</p>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {current.dueAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Due: {new Date(current.dueAt).toLocaleDateString()}
              </span>
            )}
            {current.module && <Badge variant="secondary">{current.module}</Badge>}
          </div>

          {mode === "snooze" && (
            <Textarea
              placeholder={isCritical ? "Reason for snoozing (required)" : "Reason for snoozing (optional)"}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={3}
            />
          )}

          {mode === "view" && isCritical && (
            <Textarea
              placeholder="Comment required to mark this Critical item as done"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={3}
            />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {queue.length > 1 && (
            <p className="text-xs text-gray-400">{queue.length - 1} more alert(s) waiting</p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t p-4">
          {mode === "view" ? (
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setMode("snooze");
                setError(null);
              }}
            >
              Snooze
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setMode("view");
                setError(null);
              }}
            >
              Back
            </Button>
          )}

          {mode === "view" ? (
            <Button disabled={submitting} onClick={handleAcknowledge}>
              Mark as Done
            </Button>
          ) : (
            <Button disabled={submitting} onClick={handleSnoozeConfirm}>
              Confirm Snooze
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

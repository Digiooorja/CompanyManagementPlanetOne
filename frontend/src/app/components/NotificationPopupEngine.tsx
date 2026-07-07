import { useEffect, useRef, useState, useCallback } from "react";
import { AlertTriangle, Bell, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { notificationsApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

// How often to re-check for newly-armed alerts while the app stays open.
// The initial fetch on mount covers the "shown on login" requirement (§5.2).
const POLL_INTERVAL_MS = 5 * 60 * 1000;

// Snooze always defers an alert by a fixed 30 minutes and re-displays it
// afterwards — no comment/reason required for any priority. This timer is
// client-side so the alert reliably reappears in this browser session after
// 30 minutes regardless of the backend engine's own sweep cadence.
const SNOOZE_DURATION_MS = 30 * 60 * 1000;

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

function sortAlerts(alerts: PendingAlert[]): PendingAlert[] {
  return [...alerts].sort((a, b) => {
    const pr = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    if (pr !== 0) return pr;
    return new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime();
  });
}

// The recurring pop-up engine required by §5.2: fetches pending alerts for
// the current user on login and at a configurable interval. All pending
// alerts — critical ones included — are shown together in a single window
// as a list (rather than cycling through them one at a time). Marking a
// Critical alert Done still requires a comment; snoozing never does — it
// simply defers the alert for 30 minutes and brings it back.
export function NotificationPopupEngine() {
  const { isGuest, isAuthenticated } = useAuth();
  const [queue, setQueue] = useState<PendingAlert[]>([]);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [ackDrafts, setAckDrafts] = useState<Record<number, string>>({});
  const [snoozingAll, setSnoozingAll] = useState(false);
  const [snoozeAllError, setSnoozeAllError] = useState<string | null>(null);

  // Ids currently deferred by a local 30-minute snooze timer — excluded from
  // fetch-merges so they don't reappear early if the backend's own sweep
  // (hourly by default) re-arms them before our local timer fires.
  const locallySnoozedIds = useRef<Set<number>>(new Set());
  const snoozeTimers = useRef<Map<number, number>>(new Map());

  const fetchPending = useCallback(async () => {
    if (!isAuthenticated || isGuest) return;
    try {
      const data = await notificationsApi.getAll({ status: "Pending" });
      if (Array.isArray(data)) {
        setQueue((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const additions = data.filter((n) => !existingIds.has(n.id) && !locallySnoozedIds.current.has(n.id));
          return additions.length ? sortAlerts([...prev, ...additions]) : prev;
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

  // Clear any pending snooze timers on unmount (e.g. logout) so they don't
  // fire against a stale/unmounted component.
  useEffect(() => {
    return () => {
      snoozeTimers.current.forEach((timerId) => window.clearTimeout(timerId));
      snoozeTimers.current.clear();
    };
  }, []);

  const setBusy = (id: number, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const removeFromQueue = (id: number) => {
    setQueue((prev) => prev.filter((a) => a.id !== id));
    setRowErrors((prev) => {
      const { [id]: _omit, ...rest } = prev;
      return rest;
    });
    setAckDrafts((prev) => {
      const { [id]: _omit, ...rest } = prev;
      return rest;
    });
  };

  const handleMarkDone = async (alert: PendingAlert) => {
    if (alert.priority === "Critical" && !(ackDrafts[alert.id] || "").trim()) {
      setRowErrors((prev) => ({ ...prev, [alert.id]: "A comment is required to mark a Critical alert as done." }));
      return;
    }
    setBusy(alert.id, true);
    setRowErrors((prev) => ({ ...prev, [alert.id]: "" }));
    try {
      await notificationsApi.acknowledge(alert.id, (ackDrafts[alert.id] || "").trim() || undefined);
      removeFromQueue(alert.id);
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [alert.id]: "Failed to mark as done. Please try again." }));
    } finally {
      setBusy(alert.id, false);
    }
  };

  // Snoozing never asks for a comment — it immediately defers the alert by a
  // fixed 30 minutes and brings it back, for any priority. Shared by both the
  // per-row Snooze button and "Snooze All".
  const snoozeOne = async (alert: PendingAlert) => {
    const snoozeUntil = new Date(Date.now() + SNOOZE_DURATION_MS).toISOString();
    await notificationsApi.snooze(alert.id, undefined, snoozeUntil);
    locallySnoozedIds.current.add(alert.id);
    removeFromQueue(alert.id);

    const timerId = window.setTimeout(() => {
      locallySnoozedIds.current.delete(alert.id);
      snoozeTimers.current.delete(alert.id);
      setQueue((prev) => (prev.some((a) => a.id === alert.id) ? prev : sortAlerts([...prev, alert])));
    }, SNOOZE_DURATION_MS);
    snoozeTimers.current.set(alert.id, timerId);
  };

  const handleSnooze = async (alert: PendingAlert) => {
    setBusy(alert.id, true);
    setRowErrors((prev) => ({ ...prev, [alert.id]: "" }));
    try {
      await snoozeOne(alert);
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [alert.id]: "Failed to snooze. Please try again." }));
    } finally {
      setBusy(alert.id, false);
    }
  };

  const handleSnoozeAll = async () => {
    setSnoozingAll(true);
    setSnoozeAllError(null);
    const targets = [...queue];
    const results = await Promise.allSettled(targets.map((alert) => snoozeOne(alert)));
    const failedCount = results.filter((r) => r.status === "rejected").length;
    if (failedCount > 0) {
      setSnoozeAllError(`Failed to snooze ${failedCount} of ${targets.length} alert(s). Please try again.`);
    }
    setSnoozingAll(false);
  };

  if (queue.length === 0 || isGuest || !isAuthenticated) return null;

  const criticalAlerts = queue.filter((a) => a.priority === "Critical");
  const otherAlerts = queue.filter((a) => a.priority !== "Critical");

  const renderRow = (alert: PendingAlert) => {
    const isCritical = alert.priority === "Critical";
    const busy = busyIds.has(alert.id);
    const rowError = rowErrors[alert.id];

    return (
      <div key={alert.id} className={`rounded-lg border p-4 space-y-2 ${isCritical ? "border-red-200 bg-red-50/40" : "border-gray-200"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {isCritical ? (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            ) : (
              <Bell className="h-4 w-4 text-blue-600 shrink-0" />
            )}
            <p className="text-sm text-gray-800">{alert.message}</p>
          </div>
          <Badge className={`border shrink-0 ${PRIORITY_STYLES[alert.priority] || PRIORITY_STYLES.Medium}`} variant="outline">
            {alert.priority}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {alert.dueAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Due: {new Date(alert.dueAt).toLocaleDateString()}
            </span>
          )}
          {alert.module && <Badge variant="secondary">{alert.module}</Badge>}
        </div>

        {isCritical && (
          <Textarea
            placeholder="Comment required to mark this Critical item as done"
            value={ackDrafts[alert.id] || ""}
            onChange={(e) => setAckDrafts((prev) => ({ ...prev, [alert.id]: e.target.value }))}
            rows={2}
            className="text-sm"
          />
        )}

        {rowError && <p className="text-xs text-red-600">{rowError}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="outline" disabled={busy || snoozingAll} onClick={() => handleSnooze(alert)}>
            Snooze 30m
          </Button>
          <Button size="sm" disabled={busy || snoozingAll} onClick={() => handleMarkDone(alert)}>
            Mark as Done
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold">Pending Alerts</h2>
            <Badge variant="outline">{queue.length}</Badge>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {criticalAlerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-red-700 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Critical Alerts ({criticalAlerts.length})
              </h3>
              <div className="space-y-2">{criticalAlerts.map(renderRow)}</div>
            </div>
          )}

          {otherAlerts.length > 0 && (
            <div className="space-y-2">
              {criticalAlerts.length > 0 && (
                <h3 className="text-sm font-semibold text-gray-600">Other Alerts ({otherAlerts.length})</h3>
              )}
              <div className="space-y-2">{otherAlerts.map(renderRow)}</div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between gap-3">
          {snoozeAllError ? <p className="text-xs text-red-600">{snoozeAllError}</p> : <span />}
          <Button variant="outline" disabled={snoozingAll || queue.length === 0} onClick={handleSnoozeAll}>
            {snoozingAll ? "Snoozing all..." : "Snooze All (30 min)"}
          </Button>
        </div>
      </div>
    </div>
  );
}


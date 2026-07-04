import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { ScrollText, Plus, Search, Edit3, Trash2 } from "lucide-react";
import { decisionsApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const STATUSES = ["Open", "In Progress", "Closed"];

function emptyForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    meetingContext: "",
    description: "",
    decisionMakers: "",
    rationale: "",
    status: "Open",
  };
}

export function Decisions() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("decisions.manage");
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadData = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await decisionsApi.getAll(query ? { search: query } : undefined);
      setDecisions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load decision log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadData(search || undefined), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (decision: any) => {
    setEditingId(decision.id);
    setForm({
      date: decision.date ? String(decision.date).slice(0, 10) : "",
      meetingContext: decision.meetingContext || "",
      description: decision.description || "",
      decisionMakers: decision.decisionMakers || "",
      rationale: decision.rationale || "",
      status: decision.status || "Open",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await decisionsApi.update(editingId, form);
      } else {
        await decisionsApi.create(form);
      }
      setShowModal(false);
      loadData(search || undefined);
    } catch (err: any) {
      alert(err.message || "Failed to save decision.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, description: string) => {
    if (!confirm(`Delete decision "${description.slice(0, 40)}..."? This cannot be undone.`)) return;
    try {
      await decisionsApi.delete(id);
      loadData(search || undefined);
    } catch (err: any) {
      alert(err.message || "Failed to delete decision.");
    }
  };

  const openCount = decisions.filter((d) => d.status !== "Closed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Decision Log</h1>
          <p className="text-gray-500 mt-1">Chronological, searchable record of key decisions and rationale</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Decision
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <ScrollText className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Decisions</p>
              <p className="text-2xl">{decisions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <ScrollText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Open / In Progress</p>
              <p className="text-2xl">{openCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search decisions, rationale, context..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading decisions...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : decisions.length === 0 ? (
          <div className="text-sm text-gray-600">No decisions recorded yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Decision Maker(s)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decisions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{formatDisplayDateOrDefault(d.date)}</TableCell>
                  <TableCell className="text-sm text-gray-600">{d.meetingContext || "-"}</TableCell>
                  <TableCell className="max-w-md truncate">{d.description}</TableCell>
                  <TableCell className="text-sm text-gray-600">{d.decisionMakers || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "Closed" ? "default" : "outline"}>{d.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id, d.description)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gray-50/50">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Decision" : "New Decision"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date</label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Meeting / Context</label>
                    <Input value={form.meetingContext} onChange={(e) => setForm({ ...form, meetingContext: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Decision Description *</label>
                  <Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Decision Maker(s)</label>
                  <Input placeholder="Comma-separated names" value={form.decisionMakers} onChange={(e) => setForm({ ...form, decisionMakers: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Rationale</label>
                  <Textarea value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Decision"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

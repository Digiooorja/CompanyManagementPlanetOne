import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ClipboardList, Plus, Edit3, Trash2 } from "lucide-react";
import { operationsUpdatesApi, blocksApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

function emptyForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    blockId: "",
    wellName: "",
    author: "",
    summary: "",
    keyIssues: "",
    nextSteps: "",
  };
}

export function OperationsUpdates() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("operations_updates.manage");
  const [searchParams, setSearchParams] = useSearchParams();
  const [updates, setUpdates] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [blockFilter, setBlockFilter] = useState(searchParams.get("blockId") || "all");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, blockData] = await Promise.all([operationsUpdatesApi.getAll(), blocksApi.getAll()]);
      setUpdates(Array.isArray(data) ? data : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load operations updates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const blockName = (id: number | null) => blocks.find((b) => b.id === id)?.name || "-";

  const handleBlockFilterChange = (value: string) => {
    setBlockFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("blockId");
    else next.set("blockId", value);
    setSearchParams(next, { replace: true });
  };

  const filteredUpdates = updates.filter((u) => blockFilter === "all" || String(u.blockId) === String(blockFilter));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (update: any) => {
    setEditingId(update.id);
    setForm({
      date: update.date ? String(update.date).slice(0, 10) : "",
      blockId: update.blockId ? String(update.blockId) : "",
      wellName: update.wellName || "",
      author: update.author || "",
      summary: update.summary || "",
      keyIssues: update.keyIssues || "",
      nextSteps: update.nextSteps || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, blockId: form.blockId || null };
      if (editingId) {
        await operationsUpdatesApi.update(editingId, payload);
      } else {
        await operationsUpdatesApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save operations update.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this operations update? This cannot be undone.")) return;
    try {
      await operationsUpdatesApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete update.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Operations Update</h1>
          <p className="text-gray-500 mt-1">Periodic field/project status log — summary level visibility per block/well</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Update
          </Button>
        )}
      </div>

      <Card className="p-4 w-fit">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Updates</p>
            <p className="text-2xl">{updates.length}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <Select value={blockFilter} onValueChange={handleBlockFilterChange}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Block" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Blocks</SelectItem>
            {blocks.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {loading ? (
        <div className="text-sm text-gray-600">Loading updates...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : filteredUpdates.length === 0 ? (
        <div className="text-sm text-gray-600">No operations updates recorded yet.</div>
      ) : (
        <div className="space-y-4">
          {filteredUpdates.map((u) => (
            <Card key={u.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{formatDisplayDateOrDefault(u.date)}</Badge>
                    {u.blockId && <Badge variant="secondary">{blockName(u.blockId)}</Badge>}
                    {u.wellName && <Badge variant="secondary">{u.wellName}</Badge>}
                  </div>
                  <p className="text-sm text-gray-500">By {u.author || "Unknown"}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm">{u.summary}</p>
              {u.keyIssues && (
                <div className="mt-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">Key Issues</p>
                  <p className="text-sm">{u.keyIssues}</p>
                </div>
              )}
              {u.nextSteps && (
                <div className="mt-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">Next Steps</p>
                  <p className="text-sm">{u.nextSteps}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gray-50/50">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Operations Update" : "New Operations Update"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date</label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Block</label>
                    <Select value={form.blockId || "none"} onValueChange={(v) => setForm({ ...form, blockId: v === "none" ? "" : v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {blocks.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Well</label>
                    <Input value={form.wellName} onChange={(e) => setForm({ ...form, wellName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Author</label>
                    <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Summary *</label>
                  <Textarea required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Key Issues</label>
                  <Textarea value={form.keyIssues} onChange={(e) => setForm({ ...form, keyIssues: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Next Steps</label>
                  <Textarea value={form.nextSteps} onChange={(e) => setForm({ ...form, nextSteps: e.target.value })} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Update"}
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

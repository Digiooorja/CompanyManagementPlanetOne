import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Mail, Plus, Search, Edit3, Trash2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { correspondenceApi, blocksApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const DIRECTIONS = ["Inbound", "Outbound"];

function emptyForm() {
  return {
    direction: "Inbound",
    date: new Date().toISOString().slice(0, 10),
    fromParty: "",
    toParty: "",
    regulator: "",
    subject: "",
    referenceNo: "",
    summary: "",
    blockId: "",
    awaitingResponse: false,
    responseDueDate: "",
    status: "Open",
  };
}

export function Correspondence() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("correspondence.manage");
  const [entries, setEntries] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, blockData] = await Promise.all([correspondenceApi.getAll(), blocksApi.getAll()]);
      setEntries(Array.isArray(data) ? data : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load correspondence log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (entry: any) => {
    setEditingId(entry.id);
    setForm({
      direction: entry.direction || "Inbound",
      date: entry.date ? String(entry.date).slice(0, 10) : "",
      fromParty: entry.fromParty || "",
      toParty: entry.toParty || "",
      regulator: entry.regulator || "",
      subject: entry.subject || "",
      referenceNo: entry.referenceNo || "",
      summary: entry.summary || "",
      blockId: entry.blockId ? String(entry.blockId) : "",
      awaitingResponse: !!entry.awaitingResponse,
      responseDueDate: entry.responseDueDate ? String(entry.responseDueDate).slice(0, 10) : "",
      status: entry.status || "Open",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        blockId: form.blockId || null,
        responseDueDate: form.responseDueDate || null,
      };
      if (editingId) {
        await correspondenceApi.update(editingId, payload);
      } else {
        await correspondenceApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save correspondence entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, subject: string) => {
    if (!confirm(`Delete correspondence "${subject}"? This cannot be undone.`)) return;
    try {
      await correspondenceApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete entry.");
    }
  };

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.subject?.toLowerCase().includes(q) ||
      e.summary?.toLowerCase().includes(q) ||
      e.referenceNo?.toLowerCase().includes(q)
    );
  });

  const awaitingCount = entries.filter((e) => e.awaitingResponse && e.status === "Open").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">PC / GNPC Correspondence Log</h1>
          <p className="text-gray-500 mt-1">Searchable register of regulator correspondence — inbound and outbound</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Entry
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Entries</p>
              <p className="text-2xl">{entries.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Mail className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Awaiting Response</p>
              <p className="text-2xl">{awaitingCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search subject, summary, reference..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading correspondence...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-600">No correspondence entries found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Direction</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Regulator</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Response Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {e.direction === "Inbound" ? (
                        <ArrowDownToLine className="h-3 w-3" />
                      ) : (
                        <ArrowUpFromLine className="h-3 w-3" />
                      )}
                      {e.direction}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDisplayDateOrDefault(e.date)}</TableCell>
                  <TableCell>{e.subject}</TableCell>
                  <TableCell className="text-sm text-gray-600">{e.regulator || "-"}</TableCell>
                  <TableCell className="text-sm text-gray-600">{e.referenceNo || "-"}</TableCell>
                  <TableCell>
                    {e.awaitingResponse ? (
                      <Badge variant="destructive">{formatDisplayDateOrDefault(e.responseDueDate)}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.status === "Closed" ? "default" : "outline"}>{e.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(e)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(e.id, e.subject)}>
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
              <h2 className="text-lg font-semibold">{editingId ? "Edit Correspondence" : "New Correspondence"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Direction</label>
                    <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIRECTIONS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date</label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Subject *</label>
                  <Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">From</label>
                    <Input value={form.fromParty} onChange={(e) => setForm({ ...form, fromParty: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">To</label>
                    <Input value={form.toParty} onChange={(e) => setForm({ ...form, toParty: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Regulator</label>
                    <Input placeholder="e.g. Petroleum Commission, GNPC" value={form.regulator} onChange={(e) => setForm({ ...form, regulator: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Reference No.</label>
                    <Input value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Summary</label>
                  <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="awaitingResponse"
                    checked={form.awaitingResponse}
                    onChange={(e) => setForm({ ...form, awaitingResponse: e.target.checked })}
                  />
                  <label htmlFor="awaitingResponse" className="text-sm">Awaiting response</label>
                </div>
                {form.awaitingResponse && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Response Due Date</label>
                    <Input type="date" value={form.responseDueDate} onChange={(e) => setForm({ ...form, responseDueDate: e.target.value })} />
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Entry"}
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

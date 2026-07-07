import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Leaf, Plus, AlertTriangle, Clock, Edit3, Trash2 } from "lucide-react";
import { environmentalPermitsApi, blocksApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const PERMIT_TYPES = ["EIA", "EPAPermit", "DischargeConsent", "WasteDisposal", "Other"];
const PERMIT_STATUSES = ["Active", "Expired", "Suspended", "Renewed"];

function emptyForm() {
  return {
    permitNumber: "",
    permitType: "EPAPermit",
    regulator: "EPA Ghana",
    blockId: "",
    issueDate: "",
    expiryDate: "",
    conditions: "",
    owner: "",
    status: "Active",
    notes: "",
  };
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function EnvironmentalPermits() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("env_permits.manage");
  const [permits, setPermits] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [permitData, blockData] = await Promise.all([environmentalPermitsApi.getAll(), blocksApi.getAll()]);
      setPermits(Array.isArray(permitData) ? permitData : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load environmental permits.");
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

  const openEdit = (permit: any) => {
    setEditingId(permit.id);
    setForm({
      permitNumber: permit.permitNumber || "",
      permitType: permit.permitType || "EPAPermit",
      regulator: permit.regulator || "EPA Ghana",
      blockId: permit.blockId ? String(permit.blockId) : "",
      issueDate: permit.issueDate ? String(permit.issueDate).slice(0, 10) : "",
      expiryDate: permit.expiryDate ? String(permit.expiryDate).slice(0, 10) : "",
      conditions: permit.conditions || "",
      owner: permit.owner || "",
      status: permit.status || "Active",
      notes: permit.notes || "",
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
        issueDate: form.issueDate || null,
        expiryDate: form.expiryDate || null,
      };
      if (editingId) {
        await environmentalPermitsApi.update(editingId, payload);
      } else {
        await environmentalPermitsApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save environmental permit.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, permitNumber: string) => {
    if (!confirm(`Delete permit "${permitNumber}"? This cannot be undone.`)) return;
    try {
      await environmentalPermitsApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete environmental permit.");
    }
  };

  const expiringSoon = permits.filter((p) => {
    const d = daysUntil(p.expiryDate);
    return d !== null && d >= 0 && d <= 90;
  }).length;
  const activeCount = permits.filter((p) => p.status === "Active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Environmental Permit Tracker</h1>
          <p className="text-gray-500 mt-1">EPA Ghana permits/approvals, conditions and renewal deadlines</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Permit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Leaf className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Permits</p>
              <p className="text-2xl">{permits.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Leaf className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expiring in 90 days</p>
              <p className="text-2xl">{expiringSoon}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading environmental permits...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : permits.length === 0 ? (
          <div className="text-sm text-gray-600">No environmental permits recorded yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permit Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Regulator</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permits.map((p) => {
                const d = daysUntil(p.expiryDate);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.permitNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.permitType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{p.regulator || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDisplayDateOrDefault(p.expiryDate)}
                        {d !== null && d <= 90 && d >= 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {d}d
                          </Badge>
                        )}
                        {d !== null && d < 0 && <Badge variant="destructive">Expired</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{p.owner || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "Active" ? "default" : "outline"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id, p.permitNumber)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gray-50/50">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Permit" : "New Permit"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Permit Number *</label>
                    <Input required value={form.permitNumber} onChange={(e) => setForm({ ...form, permitNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <Select value={form.permitType} onValueChange={(v) => setForm({ ...form, permitType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMIT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Regulator</label>
                    <Input value={form.regulator} onChange={(e) => setForm({ ...form, regulator: e.target.value })} />
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
                    <label className="text-sm font-medium mb-1 block">Issue Date</label>
                    <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Expiry Date</label>
                    <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Owner</label>
                    <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMIT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Conditions</label>
                  <Textarea value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder="Permit conditions / obligations" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Notes</label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Permit"}
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

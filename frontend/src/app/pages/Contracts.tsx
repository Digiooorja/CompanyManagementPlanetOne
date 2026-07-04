import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { FileCheck, Plus, AlertTriangle, Clock, Edit3, Trash2 } from "lucide-react";
import { contractsApi, blocksApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const CONTRACT_TYPES = ["Service", "JV", "Rig", "Supply", "Other"];
const CONTRACT_STATUSES = ["Draft", "Active", "Expired", "Terminated", "Renewed"];

function emptyForm() {
  return {
    title: "",
    counterparty: "",
    contractType: "Service",
    blockId: "",
    effectiveDate: "",
    expiryDate: "",
    value: "",
    renewalNoticePeriodDays: "",
    autoRenew: false,
    owner: "",
    status: "Draft",
    notes: "",
  };
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function Contracts() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("contracts.manage");
  const [contracts, setContracts] = useState<any[]>([]);
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
      const [contractData, blockData] = await Promise.all([contractsApi.getAll(), blocksApi.getAll()]);
      setContracts(Array.isArray(contractData) ? contractData : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load contracts.");
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

  const openEdit = (contract: any) => {
    setEditingId(contract.id);
    setForm({
      title: contract.title || "",
      counterparty: contract.counterparty || "",
      contractType: contract.contractType || "Service",
      blockId: contract.blockId ? String(contract.blockId) : "",
      effectiveDate: contract.effectiveDate ? String(contract.effectiveDate).slice(0, 10) : "",
      expiryDate: contract.expiryDate ? String(contract.expiryDate).slice(0, 10) : "",
      value: contract.value != null ? String(contract.value) : "",
      renewalNoticePeriodDays: contract.renewalNoticePeriodDays != null ? String(contract.renewalNoticePeriodDays) : "",
      autoRenew: !!contract.autoRenew,
      owner: contract.owner || "",
      status: contract.status || "Draft",
      notes: contract.notes || "",
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
        value: form.value ? Number(form.value) : 0,
        renewalNoticePeriodDays: form.renewalNoticePeriodDays ? Number(form.renewalNoticePeriodDays) : null,
        effectiveDate: form.effectiveDate || null,
        expiryDate: form.expiryDate || null,
      };
      if (editingId) {
        await contractsApi.update(editingId, payload);
      } else {
        await contractsApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save contract.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete contract "${title}"? This cannot be undone.`)) return;
    try {
      await contractsApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete contract.");
    }
  };

  const expiringSoon = contracts.filter((c) => {
    const d = daysUntil(c.expiryDate);
    return d !== null && d >= 0 && d <= 90;
  }).length;
  const activeCount = contracts.filter((c) => c.status === "Active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Contract Register</h1>
          <p className="text-gray-500 mt-1">All contracts and counterparties with expiry/renewal alerts</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Contracts</p>
              <p className="text-2xl">{contracts.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-green-600" />
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
          <div className="text-sm text-gray-600">Loading contracts...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : contracts.length === 0 ? (
          <div className="text-sm text-gray-600">No contracts recorded yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => {
                const d = daysUntil(c.expiryDate);
                return (
                  <TableRow key={c.id}>
                    <TableCell>{c.title}</TableCell>
                    <TableCell className="text-sm text-gray-600">{c.counterparty}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.contractType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDisplayDateOrDefault(c.expiryDate)}
                        {d !== null && d <= 90 && d >= 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {d}d
                          </Badge>
                        )}
                        {d !== null && d < 0 && <Badge variant="destructive">Expired</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{c.value ? `$${Number(c.value).toLocaleString()}` : "-"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{c.owner || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "Active" ? "default" : "outline"}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id, c.title)}>
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
              <h2 className="text-lg font-semibold">{editingId ? "Edit Contract" : "New Contract"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title *</label>
                  <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Counterparty</label>
                    <Input value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <Select value={form.contractType} onValueChange={(v) => setForm({ ...form, contractType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTRACT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Effective Date</label>
                    <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Expiry Date</label>
                    <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Value ($)</label>
                    <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Renewal Notice (days)</label>
                    <Input type="number" value={form.renewalNoticePeriodDays} onChange={(e) => setForm({ ...form, renewalNoticePeriodDays: e.target.value })} />
                  </div>
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
                        {CONTRACT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Owner</label>
                  <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={form.autoRenew}
                    onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })}
                  />
                  <label htmlFor="autoRenew" className="text-sm">Auto-renew</label>
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
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Contract"}
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

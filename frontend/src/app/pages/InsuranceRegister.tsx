import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { ShieldCheck, Plus, AlertTriangle, Clock, Edit3, Trash2 } from "lucide-react";
import { insuranceApi, blocksApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const POLICY_TYPES = ["Property", "Liability", "WellControl", "Marine", "BusinessInterruption", "Other"];
const POLICY_STATUSES = ["Active", "Expired", "Cancelled", "Renewed"];
const CURRENCIES = ["GHS", "USD"];

function emptyForm() {
  return {
    policyNumber: "",
    insurer: "",
    broker: "",
    policyType: "Other",
    blockId: "",
    coverageAmount: "",
    currency: "USD",
    premium: "",
    effectiveDate: "",
    expiryDate: "",
    renewalNoticePeriodDays: "",
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

export function InsuranceRegister() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("insurance.manage");
  const [policies, setPolicies] = useState<any[]>([]);
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
      const [policyData, blockData] = await Promise.all([insuranceApi.getAll(), blocksApi.getAll()]);
      setPolicies(Array.isArray(policyData) ? policyData : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load insurance policies.");
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

  const openEdit = (policy: any) => {
    setEditingId(policy.id);
    setForm({
      policyNumber: policy.policyNumber || "",
      insurer: policy.insurer || "",
      broker: policy.broker || "",
      policyType: policy.policyType || "Other",
      blockId: policy.blockId ? String(policy.blockId) : "",
      coverageAmount: policy.coverageAmount != null ? String(policy.coverageAmount) : "",
      currency: policy.currency || "USD",
      premium: policy.premium != null ? String(policy.premium) : "",
      effectiveDate: policy.effectiveDate ? String(policy.effectiveDate).slice(0, 10) : "",
      expiryDate: policy.expiryDate ? String(policy.expiryDate).slice(0, 10) : "",
      renewalNoticePeriodDays: policy.renewalNoticePeriodDays != null ? String(policy.renewalNoticePeriodDays) : "",
      owner: policy.owner || "",
      status: policy.status || "Active",
      notes: policy.notes || "",
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
        coverageAmount: form.coverageAmount ? Number(form.coverageAmount) : 0,
        premium: form.premium ? Number(form.premium) : 0,
        renewalNoticePeriodDays: form.renewalNoticePeriodDays ? Number(form.renewalNoticePeriodDays) : null,
        effectiveDate: form.effectiveDate || null,
        expiryDate: form.expiryDate || null,
      };
      if (editingId) {
        await insuranceApi.update(editingId, payload);
      } else {
        await insuranceApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save insurance policy.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, policyNumber: string) => {
    if (!confirm(`Delete insurance policy "${policyNumber}"? This cannot be undone.`)) return;
    try {
      await insuranceApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete insurance policy.");
    }
  };

  const expiringSoon = policies.filter((p) => {
    const d = daysUntil(p.expiryDate);
    return d !== null && d >= 0 && d <= 90;
  }).length;
  const activeCount = policies.filter((p) => p.status === "Active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Insurance Register</h1>
          <p className="text-gray-500 mt-1">Insurance policies, coverage and renewal deadlines across the portfolio</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Policy
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Policies</p>
              <p className="text-2xl">{policies.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-green-600" />
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
          <div className="text-sm text-gray-600">Loading insurance policies...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : policies.length === 0 ? (
          <div className="text-sm text-gray-600">No insurance policies recorded yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Number</TableHead>
                <TableHead>Insurer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((p) => {
                const d = daysUntil(p.expiryDate);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.policyNumber}</TableCell>
                    <TableCell className="text-sm text-gray-600">{p.insurer || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.policyType}</Badge>
                    </TableCell>
                    <TableCell>{p.coverageAmount ? `${p.currency} ${Number(p.coverageAmount).toLocaleString()}` : "-"}</TableCell>
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
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id, p.policyNumber)}>
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
              <h2 className="text-lg font-semibold">{editingId ? "Edit Policy" : "New Policy"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Policy Number *</label>
                    <Input required value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <Select value={form.policyType} onValueChange={(v) => setForm({ ...form, policyType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POLICY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Insurer</label>
                    <Input value={form.insurer} onChange={(e) => setForm({ ...form, insurer: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Broker</label>
                    <Input value={form.broker} onChange={(e) => setForm({ ...form, broker: e.target.value })} />
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Coverage Amount</label>
                    <Input type="number" value={form.coverageAmount} onChange={(e) => setForm({ ...form, coverageAmount: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Currency</label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Premium</label>
                    <Input type="number" value={form.premium} onChange={(e) => setForm({ ...form, premium: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Renewal Notice (days)</label>
                    <Input type="number" value={form.renewalNoticePeriodDays} onChange={(e) => setForm({ ...form, renewalNoticePeriodDays: e.target.value })} />
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
                        {POLICY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Policy"}
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

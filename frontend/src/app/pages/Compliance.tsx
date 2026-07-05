import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { ShieldCheck, Plus, AlertTriangle, Edit3, Trash2, CheckCircle } from "lucide-react";
import { complianceApi, blocksApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const CATEGORIES = ["Tax", "Licence Fee", "Royalty", "Filing", "Other"];
const FREQUENCIES = ["One-off", "Monthly", "Quarterly", "Annual"];
const STATUSES = ["Pending", "Paid", "Overdue", "Closed"];

function emptyForm() {
  return {
    description: "",
    regulatoryBody: "",
    category: "Other",
    frequency: "One-off",
    blockId: "",
    dueDate: "",
    amountDue: "",
    amountPaid: "",
    paymentDate: "",
    referenceNo: "",
    evidenceDocumentId: "",
    status: "Pending",
    responsibleOfficer: "",
  };
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "Closed") return false;
  return new Date(dueDate).getTime() < Date.now();
}

export function Compliance() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("compliance.manage");
  const [searchParams] = useSearchParams();
  // §5.8 guaranteed drill-down: pre-apply block/status filters forwarded via
  // query params from the Executive Dashboard's filter bar.
  const [blockFilter, setBlockFilter] = useState(searchParams.get("blockId") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [obligations, setObligations] = useState<any[]>([]);
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
      const [data, blockData] = await Promise.all([complianceApi.getAll(), blocksApi.getAll()]);
      setObligations(Array.isArray(data) ? data : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load compliance obligations.");
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

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      description: item.description || "",
      regulatoryBody: item.regulatoryBody || "",
      category: item.category || "Other",
      frequency: item.frequency || "One-off",
      blockId: item.blockId ? String(item.blockId) : "",
      dueDate: item.dueDate ? String(item.dueDate).slice(0, 10) : "",
      amountDue: item.amountDue != null ? String(item.amountDue) : "",
      amountPaid: item.amountPaid != null ? String(item.amountPaid) : "",
      paymentDate: item.paymentDate ? String(item.paymentDate).slice(0, 10) : "",
      referenceNo: item.referenceNo || "",
      evidenceDocumentId: item.evidenceDocumentId ? String(item.evidenceDocumentId) : "",
      status: item.status || "Pending",
      responsibleOfficer: item.responsibleOfficer || "",
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
        amountDue: form.amountDue ? Number(form.amountDue) : 0,
        amountPaid: form.amountPaid ? Number(form.amountPaid) : 0,
        dueDate: form.dueDate || null,
        paymentDate: form.paymentDate || null,
        evidenceDocumentId: form.evidenceDocumentId ? Number(form.evidenceDocumentId) : null,
      };
      if (editingId) {
        await complianceApi.update(editingId, payload);
      } else {
        await complianceApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save obligation.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, description: string) => {
    if (!confirm(`Delete obligation "${description}"? This cannot be undone.`)) return;
    try {
      await complianceApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete obligation.");
    }
  };

  const overdueCount = obligations.filter((o) => isOverdue(o.dueDate, o.status)).length;
  const dueSoonCount = obligations.filter((o) => {
    if (!o.dueDate || o.status === "Closed") return false;
    const days = Math.ceil((new Date(o.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  }).length;

  const filteredObligations = obligations.filter((o) => {
    if (blockFilter !== "all" && String(o.blockId) !== String(blockFilter)) return false;
    if (statusFilter !== "all" && String(o.status).toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Compliance & Statutory Payments</h1>
          <p className="text-gray-500 mt-1">Statutory obligations, licence fees, royalties and regulatory filings</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Obligation
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Obligations</p>
              <p className="text-2xl">{obligations.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Due in 30 days</p>
              <p className="text-2xl">{dueSoonCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl">{overdueCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={blockFilter} onValueChange={setBlockFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blocks</SelectItem>
              {blocks.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading obligations...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : obligations.length === 0 ? (
          <div className="text-sm text-gray-600">No compliance obligations recorded yet.</div>
        ) : filteredObligations.length === 0 ? (
          <div className="text-sm text-gray-600">No obligations match the current filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Regulator</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Officer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredObligations.map((o) => {
                const overdue = isOverdue(o.dueDate, o.status);
                return (
                  <TableRow key={o.id}>
                    <TableCell>{o.description}</TableCell>
                    <TableCell className="text-sm text-gray-600">{o.regulatoryBody || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{o.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{o.frequency}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDisplayDateOrDefault(o.dueDate)}
                        {overdue && <Badge variant="destructive">Overdue</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{o.amountDue ? `$${Number(o.amountDue).toLocaleString()}` : "-"}</TableCell>
                    <TableCell className="text-sm text-gray-600">{o.responsibleOfficer || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={o.status === "Closed" || o.status === "Paid" ? "default" : overdue ? "destructive" : "outline"}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(o)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(o.id, o.description)}>
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
              <h2 className="text-lg font-semibold">{editingId ? "Edit Obligation" : "New Obligation"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Description *</label>
                  <Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Regulatory Body</label>
                    <Input placeholder="e.g. GNPC, GRA, EPA" value={form.regulatoryBody} onChange={(e) => setForm({ ...form, regulatoryBody: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Frequency</label>
                    <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Due Date</label>
                    <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Amount Due</label>
                    <Input type="number" value={form.amountDue} onChange={(e) => setForm({ ...form, amountDue: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Amount Paid</label>
                    <Input type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Payment Date</label>
                    <Input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Reference No.</label>
                    <Input value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} />
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
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Responsible Officer</label>
                    <Input value={form.responsibleOfficer} onChange={(e) => setForm({ ...form, responsibleOfficer: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Evidence Document ID</label>
                    <Input
                      type="number"
                      placeholder="Required to close if overdue"
                      value={form.evidenceDocumentId}
                      onChange={(e) => setForm({ ...form, evidenceDocumentId: e.target.value })}
                    />
                  </div>
                </div>
                {isOverdue(form.dueDate, form.status) && form.status === "Closed" && !form.evidenceDocumentId && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    An evidence document is required to close an overdue obligation.
                  </p>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Obligation"}
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

import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Banknote, Plus, Edit3, Trash2, Send, Check, X, CheckCircle2 } from "lucide-react";
import { forexApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const TRANSACTION_TYPES = ["Spot", "Forward", "Transfer"];
const CURRENCIES = ["GHS", "USD"];

function emptyForm() {
  return {
    reference: "",
    transactionType: "Spot",
    fromCurrency: "USD",
    toCurrency: "GHS",
    amount: "",
    rate: "",
    bank: "",
    valueDate: "",
    settlementDate: "",
    purpose: "",
  };
}

function getStatusColor(status: string) {
  switch (status) {
    case "Settled":
      return "default";
    case "Approved":
      return "secondary";
    case "PendingApproval":
      return "outline";
    case "Rejected":
      return "destructive";
    default:
      return "outline";
  }
}

export function ForexWorkflow() {
  const { hasPermission, user, isAdmin } = useAuth();
  const canEdit = hasPermission("forex.manage");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await forexApi.getAll();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load forex transactions.");
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

  const openEdit = (tx: any) => {
    setEditingId(tx.id);
    setForm({
      reference: tx.reference || "",
      transactionType: tx.transactionType || "Spot",
      fromCurrency: tx.fromCurrency || "USD",
      toCurrency: tx.toCurrency || "GHS",
      amount: tx.amount != null ? String(tx.amount) : "",
      rate: tx.rate != null ? String(tx.rate) : "",
      bank: tx.bank || "",
      valueDate: tx.valueDate ? String(tx.valueDate).slice(0, 10) : "",
      settlementDate: tx.settlementDate ? String(tx.settlementDate).slice(0, 10) : "",
      purpose: tx.purpose || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: form.amount ? Number(form.amount) : 0,
        rate: form.rate ? Number(form.rate) : 0,
        valueDate: form.valueDate || null,
        settlementDate: form.settlementDate || null,
      };
      if (editingId) {
        await forexApi.update(editingId, payload);
      } else {
        await forexApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save forex transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, reference: string) => {
    if (!confirm(`Delete forex transaction "${reference || id}"? This cannot be undone.`)) return;
    try {
      await forexApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete forex transaction.");
    }
  };

  const runAction = async (id: number, action: (id: number) => Promise<any>, errorLabel: string) => {
    setActioningId(id);
    try {
      await action(id);
      loadData();
    } catch (err: any) {
      alert(err.message || errorLabel);
    } finally {
      setActioningId(null);
    }
  };

  const pendingCount = transactions.filter((t) => t.status === "PendingApproval").length;
  const approvedCount = transactions.filter((t) => t.status === "Approved").length;
  const settledCount = transactions.filter((t) => t.status === "Settled").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Forex &amp; Banking Workflow</h1>
          <p className="text-gray-500 mt-1">FX conversions/settlements with a maker-checker approval gate</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Transaction
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Banknote className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl">{pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Banknote className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved (awaiting settlement)</p>
              <p className="text-2xl">{approvedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Settled</p>
              <p className="text-2xl">{settledCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading forex transactions...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-sm text-gray-600">No forex transactions recorded yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Settlement Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const isRequester = !!user && tx.requestedById === user.id;
                const canApprove = canEdit && (isAdmin || !isRequester);
                const busy = actioningId === tx.id;
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">{tx.reference || `#${tx.id}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.transactionType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {tx.fromCurrency} → {tx.toCurrency} @ {tx.rate} ({Number(tx.convertedAmount || 0).toLocaleString()} {tx.toCurrency})
                    </TableCell>
                    <TableCell>{formatDisplayDateOrDefault(tx.settlementDate)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(tx.status)}>{tx.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {canEdit && ["Draft", "Rejected"].includes(tx.status) && (
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => runAction(tx.id, forexApi.requestApproval, "Failed to submit for approval.")}>
                            <Send className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                        {tx.status === "PendingApproval" && canEdit && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy || !canApprove}
                              title={!canApprove ? "The requester cannot also approve (maker-checker separation of duties)" : undefined}
                              onClick={() => runAction(tx.id, forexApi.approve, "Failed to approve.")}
                            >
                              <Check className="h-4 w-4 mr-1 text-green-600" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => runAction(tx.id, forexApi.reject, "Failed to reject.")}>
                              <X className="h-4 w-4 mr-1 text-red-600" />
                              Reject
                            </Button>
                          </>
                        )}
                        {tx.status === "Approved" && canEdit && (
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => runAction(tx.id, forexApi.settle, "Failed to settle.")}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Settle
                          </Button>
                        )}
                        {canEdit && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(tx)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(tx.id, tx.reference)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
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
              <h2 className="text-lg font-semibold">{editingId ? "Edit Transaction" : "New Transaction"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Reference</label>
                    <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <Select value={form.transactionType} onValueChange={(v) => setForm({ ...form, transactionType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">From Currency</label>
                    <Select value={form.fromCurrency} onValueChange={(v) => setForm({ ...form, fromCurrency: v })}>
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
                    <label className="text-sm font-medium mb-1 block">To Currency</label>
                    <Select value={form.toCurrency} onValueChange={(v) => setForm({ ...form, toCurrency: v })}>
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Amount</label>
                    <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Rate</label>
                    <Input type="number" step="0.000001" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Bank</label>
                  <Input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Value Date</label>
                    <Input type="date" value={form.valueDate} onChange={(e) => setForm({ ...form, valueDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Settlement Date</label>
                    <Input type="date" value={form.settlementDate} onChange={(e) => setForm({ ...form, settlementDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Purpose</label>
                  <Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Transaction"}
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

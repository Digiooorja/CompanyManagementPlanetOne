import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Receipt, Plus, AlertTriangle, Edit3, Trash2 } from "lucide-react";
import { vendorPaymentsApi, blocksApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const CURRENCIES = ["GHS", "USD"];
const STATUSES = ["Open", "PartiallyPaid", "Paid", "Disputed"];
const BUCKETS = ["Current", "0-30", "31-60", "61-90", "90+"];

function emptyForm() {
  return {
    vendor: "",
    invoiceNumber: "",
    blockId: "",
    invoiceDate: "",
    dueDate: "",
    amount: "",
    currency: "USD",
    amountPaid: "",
    status: "Open",
    notes: "",
  };
}

function getBucketColor(bucket: string) {
  switch (bucket) {
    case "90+":
      return "destructive";
    case "61-90":
      return "destructive";
    case "31-60":
      return "secondary";
    case "0-30":
      return "outline";
    default:
      return "outline";
  }
}

export function VendorPayments() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("vendor_payments.manage");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [agingSummary, setAgingSummary] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucketFilter, setBucketFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoiceData, summaryData, blockData] = await Promise.all([
        vendorPaymentsApi.getAll(),
        vendorPaymentsApi.getAgingSummary(),
        blocksApi.getAll(),
      ]);
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setAgingSummary(Array.isArray(summaryData) ? summaryData : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load vendor invoices.");
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

  const openEdit = (invoice: any) => {
    setEditingId(invoice.id);
    setForm({
      vendor: invoice.vendor || "",
      invoiceNumber: invoice.invoiceNumber || "",
      blockId: invoice.blockId ? String(invoice.blockId) : "",
      invoiceDate: invoice.invoiceDate ? String(invoice.invoiceDate).slice(0, 10) : "",
      dueDate: invoice.dueDate ? String(invoice.dueDate).slice(0, 10) : "",
      amount: invoice.amount != null ? String(invoice.amount) : "",
      currency: invoice.currency || "USD",
      amountPaid: invoice.amountPaid != null ? String(invoice.amountPaid) : "",
      status: invoice.status || "Open",
      notes: invoice.notes || "",
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
        amount: form.amount ? Number(form.amount) : 0,
        amountPaid: form.amountPaid ? Number(form.amountPaid) : 0,
        invoiceDate: form.invoiceDate || null,
        dueDate: form.dueDate || null,
      };
      if (editingId) {
        await vendorPaymentsApi.update(editingId, payload);
      } else {
        await vendorPaymentsApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save vendor invoice.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, vendor: string) => {
    if (!confirm(`Delete invoice for "${vendor}"? This cannot be undone.`)) return;
    try {
      await vendorPaymentsApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete vendor invoice.");
    }
  };

  const matrix = useMemo(() => {
    const map = new Map<string, any>();
    agingSummary.forEach((row) => map.set(`${row.bucket}|${row.currency}`, row));
    return map;
  }, [agingSummary]);

  const totalOutstanding = agingSummary.reduce((sum, row) => sum + Number(row.totalOutstanding || 0), 0);
  const overdueCount = invoices.filter((i) => i.status !== "Paid" && ["31-60", "61-90", "90+"].includes(i.agingBucket)).length;

  const filteredInvoices = bucketFilter === "all" ? invoices : invoices.filter((i) => i.agingBucket === bucketFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Vendor Payment Aging</h1>
          <p className="text-gray-500 mt-1">Outstanding vendor invoices and their aging buckets</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl">{invoices.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">31+ Days Overdue</p>
              <p className="text-2xl">{overdueCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Receipt className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-2xl">{totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Aging Matrix */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Aging Matrix</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bucket</TableHead>
              {CURRENCIES.map((c) => (
                <TableHead key={c}>{c} Outstanding</TableHead>
              ))}
              {CURRENCIES.map((c) => (
                <TableHead key={`${c}-count`}>{c} Invoices</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {BUCKETS.map((bucket) => (
              <TableRow
                key={bucket}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setBucketFilter(bucket === bucketFilter ? "all" : bucket)}
              >
                <TableCell>
                  <Badge variant={getBucketColor(bucket)}>{bucket}</Badge>
                </TableCell>
                {CURRENCIES.map((c) => (
                  <TableCell key={c}>{Number(matrix.get(`${bucket}|${c}`)?.totalOutstanding || 0).toLocaleString()}</TableCell>
                ))}
                {CURRENCIES.map((c) => (
                  <TableCell key={`${c}-count`}>{matrix.get(`${bucket}|${c}`)?.invoiceCount || 0}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {bucketFilter !== "all" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500">Filtered to bucket:</span>
            <Badge variant={getBucketColor(bucketFilter)}>{bucketFilter}</Badge>
            <Button size="sm" variant="ghost" onClick={() => setBucketFilter("all")}>Clear</Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading vendor invoices...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-sm text-gray-600">No vendor invoices match the current view.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Aging</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.vendor}</TableCell>
                  <TableCell className="text-sm text-gray-600">{i.invoiceNumber || "-"}</TableCell>
                  <TableCell>{formatDisplayDateOrDefault(i.dueDate)}</TableCell>
                  <TableCell>{i.currency} {Number(i.outstandingAmount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getBucketColor(i.agingBucket)}>{i.agingBucket}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={i.status === "Paid" ? "default" : i.status === "Disputed" ? "destructive" : "outline"}>{i.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(i)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(i.id, i.vendor)}>
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
              <h2 className="text-lg font-semibold">{editingId ? "Edit Invoice" : "New Invoice"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Vendor *</label>
                    <Input required value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Invoice Number</label>
                    <Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Invoice Date</label>
                    <Input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Due Date</label>
                    <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Amount</label>
                    <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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
                    <label className="text-sm font-medium mb-1 block">Amount Paid</label>
                    <Input type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
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
                <div>
                  <label className="text-sm font-medium mb-1 block">Notes</label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Invoice"}
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

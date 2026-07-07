import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { Landmark, Plus, AlertTriangle, Edit3, Trash2 } from "lucide-react";
import { localContentApi, blocksApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

const METRICS = ["LocalSpend", "LocalEmployment", "LocalProcurement", "Training", "TechnologyTransfer"];
const METRIC_LABELS: Record<string, string> = {
  LocalSpend: "Local Spend",
  LocalEmployment: "Local Employment",
  LocalProcurement: "Local Procurement",
  Training: "Training",
  TechnologyTransfer: "Technology Transfer",
};
const REPORTING_STATUSES = ["Draft", "Submitted", "Approved"];
const CURRENCIES = ["GHS", "USD"];

function emptyForm() {
  return {
    blockId: "",
    period: "",
    metric: "LocalSpend",
    committedPercent: "",
    actualPercent: "",
    committedValue: "",
    actualValue: "",
    currency: "GHS",
    reportingStatus: "Draft",
    regulator: "Petroleum Commission",
    narrative: "",
  };
}

function getShortfallColor(shortfall: number) {
  if (shortfall >= 10) return "destructive";
  if (shortfall >= 5) return "secondary";
  return "outline";
}

export function LocalContent() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("local_content.manage");
  const [records, setRecords] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [metricFilter, setMetricFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordData, blockData] = await Promise.all([localContentApi.getAll(), blocksApi.getAll()]);
      setRecords(Array.isArray(recordData) ? recordData : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load local content records.");
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

  const openEdit = (record: any) => {
    setEditingId(record.id);
    setForm({
      blockId: record.blockId ? String(record.blockId) : "",
      period: record.period || "",
      metric: record.metric || "LocalSpend",
      committedPercent: record.committedPercent != null ? String(record.committedPercent) : "",
      actualPercent: record.actualPercent != null ? String(record.actualPercent) : "",
      committedValue: record.committedValue != null ? String(record.committedValue) : "",
      actualValue: record.actualValue != null ? String(record.actualValue) : "",
      currency: record.currency || "GHS",
      reportingStatus: record.reportingStatus || "Draft",
      regulator: record.regulator || "Petroleum Commission",
      narrative: record.narrative || "",
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
        committedPercent: form.committedPercent ? Number(form.committedPercent) : 0,
        actualPercent: form.actualPercent ? Number(form.actualPercent) : 0,
        committedValue: form.committedValue ? Number(form.committedValue) : 0,
        actualValue: form.actualValue ? Number(form.actualValue) : 0,
      };
      if (editingId) {
        await localContentApi.update(editingId, payload);
      } else {
        await localContentApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save local content record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, period: string, metric: string) => {
    if (!confirm(`Delete ${METRIC_LABELS[metric] || metric} record for "${period}"? This cannot be undone.`)) return;
    try {
      await localContentApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete local content record.");
    }
  };

  const periods = useMemo(() => Array.from(new Set(records.map((r) => r.period))).sort(), [records]);

  const filteredRecords = records.filter((r) => {
    if (periodFilter !== "all" && r.period !== periodFilter) return false;
    if (metricFilter !== "all" && r.metric !== metricFilter) return false;
    return true;
  });

  const chartData = useMemo(() => {
    return METRICS.map((metric) => {
      const matching = filteredRecords.filter((r) => r.metric === metric);
      const avg = (field: string) =>
        matching.length ? matching.reduce((sum, r) => sum + Number(r[field] || 0), 0) / matching.length : 0;
      return {
        name: METRIC_LABELS[metric],
        Committed: Number(avg("committedPercent").toFixed(1)),
        Actual: Number(avg("actualPercent").toFixed(1)),
      };
    }).filter((row) => row.Committed > 0 || row.Actual > 0);
  }, [filteredRecords]);

  const shortfallCount = records.filter((r) => r.shortfallPercent >= 5).length;
  const avgShortfall = records.length
    ? (records.reduce((sum, r) => sum + Number(r.shortfallPercent || 0), 0) / records.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Local Content Tracking</h1>
          <p className="text-gray-500 mt-1">Ghanaian local-content commitments vs. actuals for Petroleum Commission reporting</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Record
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Landmark className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl">{records.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Records with Shortfall (≥5%)</p>
              <p className="text-2xl">{shortfallCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Shortfall</p>
              <p className="text-2xl">{avgShortfall}%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={metricFilter} onValueChange={setMetricFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              {METRICS.map((m) => (
                <SelectItem key={m} value={m}>{METRIC_LABELS[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {chartData.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">Committed vs. Actual by Metric</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <RechartsTooltip formatter={(v: any) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Committed" fill="#2563eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Actual" fill="#16a34a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading local content records...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-sm text-gray-600">No local content records match the current filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Committed</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Shortfall</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.period}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{METRIC_LABELS[r.metric] || r.metric}</Badge>
                  </TableCell>
                  <TableCell>{r.committedPercent}%</TableCell>
                  <TableCell>{r.actualPercent}%</TableCell>
                  <TableCell>
                    <Badge variant={getShortfallColor(r.shortfallPercent)}>{r.shortfallPercent}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.reportingStatus === "Approved" ? "default" : "outline"}>{r.reportingStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id, r.period, r.metric)}>
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
              <h2 className="text-lg font-semibold">{editingId ? "Edit Record" : "New Record"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Period *</label>
                    <Input required placeholder="e.g. 2026-Q2" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Metric</label>
                    <Select value={form.metric} onValueChange={(v) => setForm({ ...form, metric: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METRICS.map((m) => (
                          <SelectItem key={m} value={m}>{METRIC_LABELS[m]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Committed %</label>
                    <Input type="number" value={form.committedPercent} onChange={(e) => setForm({ ...form, committedPercent: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Actual %</label>
                    <Input type="number" value={form.actualPercent} onChange={(e) => setForm({ ...form, actualPercent: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Committed Value</label>
                    <Input type="number" value={form.committedValue} onChange={(e) => setForm({ ...form, committedValue: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Actual Value</label>
                    <Input type="number" value={form.actualValue} onChange={(e) => setForm({ ...form, actualValue: e.target.value })} />
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
                    <label className="text-sm font-medium mb-1 block">Reporting Status</label>
                    <Select value={form.reportingStatus} onValueChange={(v) => setForm({ ...form, reportingStatus: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORTING_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Regulator</label>
                  <Input value={form.regulator} onChange={(e) => setForm({ ...form, regulator: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Narrative</label>
                  <Textarea value={form.narrative} onChange={(e) => setForm({ ...form, narrative: e.target.value })} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Record"}
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

import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { HardHat, Plus, AlertTriangle, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import { hseApi, blocksApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const INCIDENT_TYPES = ["Injury", "NearMiss", "Spill", "Observation", "Fire", "Other"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Open", "UnderInvestigation", "ActionPending", "Closed"];

function emptyForm() {
  return {
    blockId: "",
    incidentType: "Observation",
    severity: "Low",
    occurredAt: "",
    location: "",
    description: "",
    reportedBy: "",
    manHoursLost: "",
    isRecordable: false,
    immediateAction: "",
    rootCause: "",
    correctiveAction: "",
    actionOwner: "",
    actionDueDate: "",
    status: "Open",
  };
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "Critical":
      return "destructive";
    case "High":
      return "destructive";
    case "Medium":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Closed":
      return "default";
    case "Open":
      return "destructive";
    default:
      return "secondary";
  }
}

export function HseRegister() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("hse.manage");
  const [incidents, setIncidents] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [exposureRecords, setExposureRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockFilter, setBlockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalTab, setModalTab] = useState("details");
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);

  const [showExposureModal, setShowExposureModal] = useState(false);
  const [savingExposure, setSavingExposure] = useState(false);
  const [exposureForm, setExposureForm] = useState({
    blockId: "",
    periodLabel: "",
    periodStart: "",
    periodEnd: "",
    manHours: "",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [incidentData, blockData, metricsData, exposureData] = await Promise.all([
        hseApi.getAll(),
        blocksApi.getAll(),
        hseApi.getMetrics(),
        hseApi.getExposureHours(),
      ]);
      setIncidents(Array.isArray(incidentData) ? incidentData : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
      setMetrics(metricsData || null);
      setExposureRecords(Array.isArray(exposureData) ? exposureData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load HSE incidents.");
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
    setModalTab("details");
    setShowModal(true);
  };

  const openEdit = (incident: any) => {
    setEditingId(incident.id);
    setForm({
      blockId: incident.blockId ? String(incident.blockId) : "",
      incidentType: incident.incidentType || "Observation",
      severity: incident.severity || "Low",
      occurredAt: incident.occurredAt ? String(incident.occurredAt).slice(0, 10) : "",
      location: incident.location || "",
      description: incident.description || "",
      reportedBy: incident.reportedBy || "",
      manHoursLost: incident.manHoursLost != null ? String(incident.manHoursLost) : "",
      isRecordable: !!incident.isRecordable,
      immediateAction: incident.immediateAction || "",
      rootCause: incident.rootCause || "",
      correctiveAction: incident.correctiveAction || "",
      actionOwner: incident.actionOwner || "",
      actionDueDate: incident.actionDueDate ? String(incident.actionDueDate).slice(0, 10) : "",
      status: incident.status || "Open",
    });
    setModalTab("details");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        blockId: form.blockId || null,
        manHoursLost: form.manHoursLost ? Number(form.manHoursLost) : 0,
        occurredAt: form.occurredAt || null,
        actionDueDate: form.actionDueDate || null,
      };
      if (editingId) {
        await hseApi.update(editingId, payload);
      } else {
        await hseApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save HSE incident.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!editingId) return;
    if (!form.rootCause || !form.correctiveAction) {
      alert("Root cause and corrective action are required to close an incident.");
      setModalTab("investigation");
      return;
    }
    setClosing(true);
    try {
      await hseApi.close(editingId, { rootCause: form.rootCause, correctiveAction: form.correctiveAction });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to close HSE incident.");
    } finally {
      setClosing(false);
    }
  };

  const handleDelete = async (id: number, incidentType: string) => {
    if (!confirm(`Delete ${incidentType} incident? This cannot be undone.`)) return;
    try {
      await hseApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete HSE incident.");
    }
  };

  const openExposureModal = () => {
    setExposureForm({ blockId: "", periodLabel: "", periodStart: "", periodEnd: "", manHours: "", notes: "" });
    setShowExposureModal(true);
  };

  const handleSubmitExposure = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExposure(true);
    try {
      await hseApi.createExposureHours({
        blockId: exposureForm.blockId || null,
        periodLabel: exposureForm.periodLabel,
        periodStart: exposureForm.periodStart || null,
        periodEnd: exposureForm.periodEnd || null,
        manHours: exposureForm.manHours ? Number(exposureForm.manHours) : 0,
        notes: exposureForm.notes || null,
      });
      setShowExposureModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save exposure hours.");
    } finally {
      setSavingExposure(false);
    }
  };

  const handleDeleteExposure = async (id: number) => {
    if (!confirm("Delete this exposure-hours record? This cannot be undone.")) return;
    try {
      await hseApi.deleteExposureHours(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete exposure-hours record.");
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    if (blockFilter !== "all" && String(i.blockId) !== String(blockFilter)) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (severityFilter !== "all" && i.severity !== severityFilter) return false;
    return true;
  });

  const openCount = incidents.filter((i) => i.status !== "Closed").length;
  const overdueCount = incidents.filter((i) => i.daysOverdue > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">HSE Register</h1>
          <p className="text-gray-500 mt-1">HSE incidents/observations, corrective actions, and safety metrics</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Incident
          </Button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <HardHat className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Incidents</p>
              <p className="text-2xl">{incidents.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl">{openCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue Actions</p>
              <p className="text-2xl">{overdueCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">TRIR</p>
          <p className="text-2xl mt-1">{metrics?.trir ?? "—"}</p>
          <p className="text-xs text-gray-400 mt-1">per 200,000 exposure hrs</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">LTIF</p>
          <p className="text-2xl mt-1">{metrics?.ltif ?? "—"}</p>
          <p className="text-xs text-gray-400 mt-1">per 1,000,000 exposure hrs</p>
        </Card>
      </div>
      {metrics && metrics.exposureHours === null && (
        <p className="text-xs text-gray-500">
          TRIR/LTIF require total exposure man-hours worked — none recorded yet. Log exposure hours below to enable these metrics.
        </p>
      )}

      {/* Exposure Hours — real man-hours worked, recorded per period so TRIR/LTIF
          above are calculated from stored data instead of a number typed in ad-hoc. */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-medium">Exposure Hours</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Total recorded: <span className="font-semibold">{metrics?.exposureHours ?? 0}</span> hrs
              {metrics?.exposureSource === 'recorded' && ' (from records below)'}
            </p>
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={openExposureModal} className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Log Exposure Hours
            </Button>
          )}
        </div>
        {exposureRecords.length === 0 ? (
          <p className="text-sm text-gray-500">No exposure-hours records yet.</p>
        ) : (
          <div className="space-y-1.5">
            {exposureRecords.slice(0, 6).map((rec) => (
              <div key={rec.id} className="flex items-center justify-between gap-3 p-2 rounded-md border bg-gray-50 text-sm">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="font-medium">{rec.periodLabel}</span>
                  {rec.blockId && (
                    <span className="text-xs text-gray-500 truncate">
                      {blocks.find((b) => b.id === rec.blockId)?.name || `Block #${rec.blockId}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-gray-700">{Number(rec.manHours).toLocaleString()} hrs</span>
                  {canEdit && (
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteExposure(rec.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Select value={blockFilter} onValueChange={setBlockFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
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
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading HSE incidents...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-sm text-gray-600">No HSE incidents match the current filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Occurred</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Action Owner</TableHead>
                <TableHead>Action Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <Badge variant="outline">{i.incidentType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(i.severity)}>{i.severity}</Badge>
                  </TableCell>
                  <TableCell>{formatDisplayDateOrDefault(i.occurredAt)}</TableCell>
                  <TableCell className="text-sm text-gray-600">{i.location || "-"}</TableCell>
                  <TableCell className="text-sm">{i.actionOwner || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatDisplayDateOrDefault(i.actionDueDate)}
                      {i.daysOverdue > 0 && <Badge variant="destructive">{i.daysOverdue}d overdue</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(i.status)}>{i.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(i)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(i.id, i.incidentType)}>
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
          <Card className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Incident" : "New Incident"}</h2>
              {editingId && form.status !== "Closed" && canEdit && (
                <Button size="sm" variant="outline" disabled={closing} onClick={handleClose}>
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
                  {closing ? "Closing..." : "Close Incident"}
                </Button>
              )}
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Tabs value={modalTab} onValueChange={setModalTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="investigation">Investigation &amp; Action</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Incident Type</label>
                        <Select value={form.incidentType} onValueChange={(v) => setForm({ ...form, incidentType: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INCIDENT_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Severity</label>
                        <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SEVERITIES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Occurred At</label>
                        <Input type="date" value={form.occurredAt} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Location</label>
                        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Reported By</label>
                        <Input value={form.reportedBy} onChange={(e) => setForm({ ...form, reportedBy: e.target.value })} />
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
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Man-Hours Lost</label>
                        <Input type="number" value={form.manHoursLost} onChange={(e) => setForm({ ...form, manHoursLost: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-2 pb-2">
                        <input
                          type="checkbox"
                          id="isRecordable"
                          checked={form.isRecordable}
                          onChange={(e) => setForm({ ...form, isRecordable: e.target.checked })}
                        />
                        <label htmlFor="isRecordable" className="text-sm">OSHA/regulator recordable</label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="investigation" className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Immediate Action</label>
                      <Textarea value={form.immediateAction} onChange={(e) => setForm({ ...form, immediateAction: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Root Cause {editingId && <span className="text-gray-400">(required to close)</span>}</label>
                      <Textarea value={form.rootCause} onChange={(e) => setForm({ ...form, rootCause: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Corrective Action {editingId && <span className="text-gray-400">(required to close)</span>}</label>
                      <Textarea value={form.correctiveAction} onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Action Owner</label>
                        <Input value={form.actionOwner} onChange={(e) => setForm({ ...form, actionOwner: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Action Due Date</label>
                        <Input type="date" value={form.actionDueDate} onChange={(e) => setForm({ ...form, actionDueDate: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Status</label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.filter((s) => s !== "Closed").map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                          {form.status === "Closed" && <SelectItem value="Closed">Closed</SelectItem>}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400 mt-1">Use "Close Incident" above to close — requires root cause and corrective action.</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Incident"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {showExposureModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gray-50/50">
              <h2 className="text-lg font-semibold">Log Exposure Hours</h2>
              <p className="text-xs text-gray-500 mt-1">Record real man-hours worked for a period, used to calculate TRIR/LTIF.</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmitExposure} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Period Label</label>
                  <input
                    required
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="e.g. 2026-06 or Q2 2026"
                    value={exposureForm.periodLabel}
                    onChange={(e) => setExposureForm({ ...exposureForm, periodLabel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Block (optional)</label>
                  <Select value={exposureForm.blockId || "none"} onValueChange={(v) => setExposureForm({ ...exposureForm, blockId: v === "none" ? "" : v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Portfolio-wide" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Portfolio-wide (all blocks)</SelectItem>
                      {blocks.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Period Start</label>
                    <input
                      type="date"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={exposureForm.periodStart}
                      onChange={(e) => setExposureForm({ ...exposureForm, periodStart: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Period End</label>
                    <input
                      type="date"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={exposureForm.periodEnd}
                      onChange={(e) => setExposureForm({ ...exposureForm, periodEnd: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Man-Hours Worked</label>
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="e.g. 45000"
                    value={exposureForm.manHours}
                    onChange={(e) => setExposureForm({ ...exposureForm, manHours: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
                  <textarea
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                    value={exposureForm.notes}
                    onChange={(e) => setExposureForm({ ...exposureForm, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowExposureModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savingExposure}>
                    {savingExposure ? "Saving..." : "Save"}
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

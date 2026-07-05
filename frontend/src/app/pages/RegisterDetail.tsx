import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { ArrowLeft, Plus, Search, Edit3, Trash2 } from "lucide-react";
import { risksApi, projectsApi, blocksApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

// This page is currently wired for the Risk Register (§5.15) — the only
// register among the Registers hub's placeholder entries that has a real
// backend module (Risk model + /api/risks). Asset/Incident/Document register
// tiles on the Registers hub link here too but have no backing module yet.
const SEVERITIES = ["Low", "Medium", "High"];
const PROBABILITIES = ["Low", "Medium", "High"];
const STATUSES = ["Active", "Mitigated", "Closed"];

function emptyForm() {
  return {
    projectId: "",
    title: "",
    description: "",
    severity: "Medium",
    probability: "Medium",
    status: "Active",
    owner: "",
    mitigation: "",
    reviewDate: "",
  };
}

function defaultMatrixForm() {
  return {
    lowWeight: "1",
    mediumWeight: "2",
    highWeight: "3",
    mediumThreshold: "4",
    highThreshold: "7",
  };
}

export function RegisterDetail() {
  const { hasPermission, isAdmin } = useAuth();
  const canEdit = hasPermission("risks.manage");
  const [searchParams] = useSearchParams();

  // §5.8 guaranteed drill-down: pre-apply project/block/status filters
  // forwarded via query params from the Executive Dashboard's filter bar.
  const [projectFilter, setProjectFilter] = useState(searchParams.get("projectId") || "all");
  const [blockFilter, setBlockFilter] = useState(searchParams.get("blockId") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");

  const [risks, setRisks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // §5.15 configurable risk-scoring matrix — Admin-only
  const [matrixForm, setMatrixForm] = useState(defaultMatrixForm());
  const [showMatrixConfig, setShowMatrixConfig] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);

  const loadMatrixConfig = async () => {
    try {
      const cfg = await risksApi.getMatrixConfig();
      if (cfg) {
        setMatrixForm({
          lowWeight: String(cfg.lowWeight ?? 1),
          mediumWeight: String(cfg.mediumWeight ?? 2),
          highWeight: String(cfg.highWeight ?? 3),
          mediumThreshold: String(cfg.mediumThreshold ?? 4),
          highThreshold: String(cfg.highThreshold ?? 7),
        });
      }
    } catch (err) {
      console.error('Error loading risk matrix config:', err);
    }
  };

  const handleSaveMatrixConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMatrix(true);
    try {
      await risksApi.updateMatrixConfig({
        lowWeight: Number(matrixForm.lowWeight),
        mediumWeight: Number(matrixForm.mediumWeight),
        highWeight: Number(matrixForm.highWeight),
        mediumThreshold: Number(matrixForm.mediumThreshold),
        highThreshold: Number(matrixForm.highThreshold),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save the risk matrix config.");
    } finally {
      setSavingMatrix(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [riskData, projectData, blockData] = await Promise.all([
        risksApi.getAll(),
        projectsApi.getAll(),
        blocksApi.getAll(),
      ]);
      setRisks(Array.isArray(riskData) ? riskData : []);
      setProjects(Array.isArray(projectData) ? projectData : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load the risk register.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadMatrixConfig();
  }, []);

  useEffect(() => {
    const handler = (e: any) => setSearchQuery(e?.detail?.query || "");
    window.addEventListener('globalSearch', handler as EventListener);
    return () => window.removeEventListener('globalSearch', handler as EventListener);
  }, []);

  const projectMap = useMemo(() => {
    const map = new Map<string, any>();
    projects.forEach((p) => map.set(String(p.id), p));
    return map;
  }, [projects]);

  const blockMap = useMemo(() => {
    const map = new Map<string, any>();
    blocks.forEach((b) => map.set(String(b.id), b));
    return map;
  }, [blocks]);

  const entries = useMemo(() => {
    return risks.map((risk) => {
      const project = projectMap.get(String(risk.projectId));
      const blockId = project?.blockId;
      const block = blockId !== undefined && blockId !== null ? blockMap.get(String(blockId)) : undefined;
      return {
        ...risk,
        riskCode: `RISK-${String(risk.id).padStart(3, '0')}`,
        projectName: project?.name || "-",
        blockId,
        blockName: block?.name || "-",
      };
    });
  }, [risks, projectMap, blockMap]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredEntries = entries.filter((entry) => {
    if (projectFilter !== "all" && String(entry.projectId) !== String(projectFilter)) return false;
    if (blockFilter !== "all" && String(entry.blockId) !== String(blockFilter)) return false;
    if (statusFilter !== "all" && String(entry.status).toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (!normalizedSearch) return true;
    return [entry.riskCode, entry.title, entry.owner, entry.projectName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (entry: any) => {
    setEditingId(entry.id);
    setForm({
      projectId: entry.projectId ? String(entry.projectId) : "",
      title: entry.title || "",
      description: entry.description || "",
      severity: entry.severity || "Medium",
      probability: entry.probability || "Medium",
      status: entry.status || "Active",
      owner: entry.owner || "",
      mitigation: entry.mitigation || "",
      reviewDate: entry.reviewDate ? String(entry.reviewDate).slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        projectId: form.projectId ? Number(form.projectId) : undefined,
        reviewDate: form.reviewDate || null,
      };
      if (editingId) {
        await risksApi.update(editingId, payload);
      } else {
        await risksApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save risk.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete risk "${title}"? This cannot be undone.`)) return;
    try {
      await risksApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete risk.");
    }
  };

  const activeCount = risks.filter((r) => r.status === "Active").length;
  const mitigatedCount = risks.filter((r) => r.status === "Mitigated").length;
  const highBandCount = risks.filter((r) => r.riskBand === "High" && r.status !== "Closed").length;
  const lastUpdated = risks.reduce<string | null>((latest, r) => {
    if (!r.updatedAt) return latest;
    if (!latest || new Date(r.updatedAt).getTime() > new Date(latest).getTime()) return r.updatedAt;
    return latest;
  }, null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "destructive";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "destructive";
      case "Mitigated":
        return "default";
      case "Closed":
        return "outline";
      default:
        return "outline";
    }
  };

  // §5.15 auto-calc score band (returned by the API as a VIRTUAL field —
  // see backend/models/Risk.js — computed from the configurable matrix below).
  const getBandColor = (band: string) => {
    switch (band) {
      case "High":
        return "destructive";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/registers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Registers
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl">Risk Register</h1>
          <p className="text-gray-500 mt-1">Track and manage project and operational risks</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowMatrixConfig((v) => !v)}>
              Risk Matrix
            </Button>
          )}
          {canEdit && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          )}
        </div>
      </div>

      {isAdmin && showMatrixConfig && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-1">Risk Scoring Matrix (§5.15)</h3>
          <p className="text-xs text-gray-500 mb-3">
            Score = severity weight × probability weight. Band thresholds decide the Low/Medium/High
            band used for the "high-band escalation" alert.
          </p>
          <form onSubmit={handleSaveMatrixConfig} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs font-medium mb-1 block">Low weight</label>
              <Input type="number" min="1" value={matrixForm.lowWeight} onChange={(e) => setMatrixForm({ ...matrixForm, lowWeight: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Medium weight</label>
              <Input type="number" min="1" value={matrixForm.mediumWeight} onChange={(e) => setMatrixForm({ ...matrixForm, mediumWeight: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">High weight</label>
              <Input type="number" min="1" value={matrixForm.highWeight} onChange={(e) => setMatrixForm({ ...matrixForm, highWeight: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Medium threshold (score ≥)</label>
              <Input type="number" min="1" value={matrixForm.mediumThreshold} onChange={(e) => setMatrixForm({ ...matrixForm, mediumThreshold: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">High threshold (score ≥)</label>
              <Input type="number" min="1" value={matrixForm.highThreshold} onChange={(e) => setMatrixForm({ ...matrixForm, highThreshold: e.target.value })} />
            </div>
            <div className="col-span-2 md:col-span-5 flex justify-end">
              <Button type="submit" disabled={savingMatrix}>{savingMatrix ? "Saving..." : "Save Matrix"}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Entries</p>
          <p className="text-2xl mt-1">{risks.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl mt-1 text-red-600">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Mitigated</p>
          <p className="text-2xl mt-1 text-green-600">{mitigatedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">High Band</p>
          <p className="text-2xl mt-1 text-red-600">{highBandCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Last Updated</p>
          <p className="text-lg mt-1">{formatDisplayDateOrDefault(lastUpdated)}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search entries..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <SelectTrigger className="w-full md:w-[160px]">
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

      {/* Register Entries Table */}
      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading risk register...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : risks.length === 0 ? (
          <div className="text-sm text-gray-600">No risks recorded yet.</div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-sm text-gray-600">No risks match the current filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Band</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead>Mitigation</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm">{entry.riskCode}</TableCell>
                  <TableCell>{entry.title}</TableCell>
                  <TableCell className="text-sm text-gray-600">{entry.projectName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{entry.blockName}</TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(entry.severity)}>{entry.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.probability}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{entry.riskScore ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getBandColor(entry.riskBand)}>{entry.riskBand || "-"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDisplayDateOrDefault(entry.reviewDate)}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">{entry.mitigation || "-"}</TableCell>
                  <TableCell className="text-sm">{entry.owner || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(entry.status)}>{entry.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(entry)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(entry.id, entry.title)}>
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
              <h2 className="text-lg font-semibold">{editingId ? "Edit Risk" : "New Risk"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title *</label>
                  <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Project *</label>
                  <Select value={form.projectId || "none"} onValueChange={(v) => setForm({ ...form, projectId: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a project</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="text-sm font-medium mb-1 block">Probability</label>
                    <Select value={form.probability} onValueChange={(v) => setForm({ ...form, probability: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROBABILITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="text-sm font-medium mb-1 block">Owner</label>
                    <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Review Date</label>
                  <Input type="date" value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Mitigation</label>
                  <Textarea value={form.mitigation} onChange={(e) => setForm({ ...form, mitigation: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving || !form.projectId}>{saving ? "Saving..." : "Save"}</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

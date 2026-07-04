import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Progress } from "../components/ui/progress";
import { DollarSign, Plus, AlertTriangle, Edit3, Trash2, Download, CheckCircle, XCircle } from "lucide-react";
import { budgetLinesApi, blocksApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const CURRENCIES = ["USD", "GHS"];
const STATUSES = ["Draft", "Active", "Closed"];
const VARIANCE_THRESHOLD = 10;

function emptyForm() {
  return {
    blockId: "",
    description: "",
    budgetCategory: "",
    currency: "USD",
    approvedBudget: "",
    committed: "",
    actualSpend: "",
    responsiblePerson: "",
    status: "Draft",
    plannedStartDate: "",
    plannedEndDate: "",
    actualStartDate: "",
    actualEndDate: "",
  };
}

export function BudgetTracker() {
  const { hasPermission, isAdmin } = useAuth();
  const canEdit = hasPermission("budget.manage");
  const canApprove = hasPermission("finance.approve") || isAdmin;

  const [lines, setLines] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockFilter, setBlockFilter] = useState<string>("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [revisionLineId, setRevisionLineId] = useState<number | null>(null);
  const [revisionAmount, setRevisionAmount] = useState("");
  const [revisionComment, setRevisionComment] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lineData, summaryData, blockData] = await Promise.all([
        budgetLinesApi.getAll(blockFilter !== "all" ? { blockId: blockFilter } : undefined),
        budgetLinesApi.getSummary(),
        blocksApi.getAll(),
      ]);
      setLines(Array.isArray(lineData) ? lineData : []);
      setSummary(Array.isArray(summaryData) ? summaryData : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load budget tracker data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockFilter]);

  const blockName = (id: number) => blocks.find((b) => b.id === id)?.name || `Block #${id}`;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (line: any) => {
    setEditingId(line.id);
    setForm({
      blockId: String(line.blockId),
      description: line.description || "",
      budgetCategory: line.budgetCategory || "",
      currency: line.currency || "USD",
      approvedBudget: String(line.approvedBudget ?? ""),
      committed: String(line.committed ?? 0),
      actualSpend: String(line.actualSpend ?? 0),
      responsiblePerson: line.responsiblePerson || "",
      status: line.status || "Draft",
      plannedStartDate: line.plannedStartDate ? String(line.plannedStartDate).slice(0, 10) : "",
      plannedEndDate: line.plannedEndDate ? String(line.plannedEndDate).slice(0, 10) : "",
      actualStartDate: line.actualStartDate ? String(line.actualStartDate).slice(0, 10) : "",
      actualEndDate: line.actualEndDate ? String(line.actualEndDate).slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        blockId: Number(form.blockId),
        description: form.description,
        budgetCategory: form.budgetCategory || null,
        currency: form.currency,
        committed: form.committed ? Number(form.committed) : 0,
        actualSpend: form.actualSpend ? Number(form.actualSpend) : 0,
        responsiblePerson: form.responsiblePerson || null,
        status: form.status,
        plannedStartDate: form.plannedStartDate || null,
        plannedEndDate: form.plannedEndDate || null,
        actualStartDate: form.actualStartDate || null,
        actualEndDate: form.actualEndDate || null,
      };
      if (editingId) {
        await budgetLinesApi.update(editingId, payload);
      } else {
        payload.approvedBudget = form.approvedBudget ? Number(form.approvedBudget) : 0;
        await budgetLinesApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save budget line.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, description: string) => {
    if (!confirm(`Delete budget line "${description}"? This cannot be undone.`)) return;
    try {
      await budgetLinesApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete budget line.");
    }
  };

  const openRevision = (line: any) => {
    setRevisionLineId(line.id);
    setRevisionAmount(String(line.approvedBudget));
    setRevisionComment("");
  };

  const handleRequestRevision = async () => {
    if (!revisionLineId) return;
    try {
      await budgetLinesApi.requestRevision(revisionLineId, Number(revisionAmount), revisionComment || undefined);
      setRevisionLineId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to request revision.");
    }
  };

  const handleApproveRevision = async (line: any) => {
    try {
      await budgetLinesApi.approveRevision(line.id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to approve revision.");
    }
  };

  const handleRejectRevision = async (line: any) => {
    try {
      await budgetLinesApi.rejectRevision(line.id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to reject revision.");
    }
  };

  const handleExport = () => {
    window.open(`/api/budget-lines/export${blockFilter !== "all" ? `?blockId=${blockFilter}` : ""}`, "_blank");
  };

  const totals = useMemo(() => {
    return summary.reduce(
      (acc, s) => ({
        approvedBudget: acc.approvedBudget + Number(s.approvedBudget || 0),
        committed: acc.committed + Number(s.committed || 0),
        actualSpend: acc.actualSpend + Number(s.actualSpend || 0),
        flaggedCount: acc.flaggedCount + Number(s.flaggedCount || 0),
      }),
      { approvedBudget: 0, committed: 0, actualSpend: 0, flaggedCount: 0 }
    );
  }, [summary]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Work Programme & Budget Tracker</h1>
          <p className="text-gray-500 mt-1">Approved work programme and budget per block, with variance analysis and drill-down</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Variance Report
          </Button>
          {canEdit && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              New Line
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved Budget</p>
              <p className="text-xl font-semibold">${totals.approvedBudget.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Committed</p>
              <p className="text-xl font-semibold">${totals.committed.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Actual Spend</p>
              <p className="text-xl font-semibold">${totals.actualSpend.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Flagged Lines (&gt;{VARIANCE_THRESHOLD}% variance)</p>
              <p className="text-xl font-semibold">{totals.flaggedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Portfolio summary — roll-up per block/currency, drills down to line items below */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Portfolio Summary (by Block &amp; Currency)</h2>
        {summary.length === 0 ? (
          <p className="text-sm text-gray-500">No budget lines recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Block</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Committed</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Utilisation</TableHead>
                <TableHead>Flagged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((s, i) => {
                const utilisation = s.approvedBudget > 0 ? Math.round(((s.committed + s.actualSpend) / s.approvedBudget) * 100) : 0;
                return (
                  <TableRow
                    key={i}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setBlockFilter(String(s.blockId))}
                  >
                    <TableCell className="font-medium">{s.blockName}</TableCell>
                    <TableCell>{s.currency}</TableCell>
                    <TableCell>{s.lineCount}</TableCell>
                    <TableCell>{s.approvedBudget.toLocaleString()}</TableCell>
                    <TableCell>{s.committed.toLocaleString()}</TableCell>
                    <TableCell>{s.actualSpend.toLocaleString()}</TableCell>
                    <TableCell className="w-[140px]">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(utilisation, 100)} className="flex-1" />
                        <span className="text-xs">{utilisation}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.flaggedCount > 0 ? <Badge variant="destructive">{s.flaggedCount}</Badge> : <span className="text-gray-400">0</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Line items — drill-down, filterable by block */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Line Items</h2>
          <Select value={blockFilter} onValueChange={setBlockFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All Blocks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blocks</SelectItem>
              {blocks.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading budget lines...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : lines.length === 0 ? (
          <p className="text-sm text-gray-500">No budget lines match this filter.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Committed</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Revision</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => {
                const flagged = Math.abs(Number(line.variancePercent || 0)) > VARIANCE_THRESHOLD;
                return (
                  <TableRow key={line.id}>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="text-sm text-gray-600">{blockName(line.blockId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{line.budgetCategory || "-"}</Badge>
                    </TableCell>
                    <TableCell>{line.currency} {Number(line.approvedBudget).toLocaleString()}</TableCell>
                    <TableCell>{Number(line.committed).toLocaleString()}</TableCell>
                    <TableCell>{Number(line.actualSpend).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={flagged ? "destructive" : "outline"}>
                        {Number(line.variancePercent).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{line.responsiblePerson || "-"}</TableCell>
                    <TableCell>
                      {line.revisionStatus === "PendingApproval" ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">Pending</Badge>
                          {canApprove && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleApproveRevision(line)}>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleRejectRevision(line)}>
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{line.revisionStatus}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(line)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openRevision(line)} title="Request budget revision">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(line.id, line.description)}>
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

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gray-50/50">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Budget Line" : "New Budget Line"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Description *</label>
                  <Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Block *</label>
                    <Select value={form.blockId} onValueChange={(v) => setForm({ ...form, blockId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select block" />
                      </SelectTrigger>
                      <SelectContent>
                        {blocks.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Budget Category</label>
                    <Input value={form.budgetCategory} onChange={(e) => setForm({ ...form, budgetCategory: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="text-sm font-medium mb-1 block">
                      Approved Budget {editingId ? "(revision required to change)" : ""}
                    </label>
                    <Input
                      type="number"
                      disabled={!!editingId}
                      value={form.approvedBudget}
                      onChange={(e) => setForm({ ...form, approvedBudget: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Committed</label>
                    <Input type="number" value={form.committed} onChange={(e) => setForm({ ...form, committed: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Actual Spend</label>
                    <Input type="number" value={form.actualSpend} onChange={(e) => setForm({ ...form, actualSpend: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Planned Start</label>
                    <Input type="date" value={form.plannedStartDate} onChange={(e) => setForm({ ...form, plannedStartDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Planned End</label>
                    <Input type="date" value={form.plannedEndDate} onChange={(e) => setForm({ ...form, plannedEndDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Actual Start</label>
                    <Input type="date" value={form.actualStartDate} onChange={(e) => setForm({ ...form, actualStartDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Actual End</label>
                    <Input type="date" value={form.actualEndDate} onChange={(e) => setForm({ ...form, actualEndDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Responsible Person</label>
                    <Input value={form.responsiblePerson} onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })} />
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
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Line"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Request revision modal — maker-checker workflow */}
      {revisionLineId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <div className="p-6 border-b bg-gray-50/50">
              <h2 className="text-lg font-semibold">Request Budget Revision</h2>
              <p className="text-sm text-gray-500 mt-1">
                Submits a proposed new approved budget for checker approval — it does not take effect until approved by someone other than you.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Proposed Approved Budget</label>
                <Input type="number" value={revisionAmount} onChange={(e) => setRevisionAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Comment</label>
                <Input value={revisionComment} onChange={(e) => setRevisionComment(e.target.value)} placeholder="Reason for the revision" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={() => setRevisionLineId(null)}>Cancel</Button>
                <Button onClick={handleRequestRevision}>Submit for Approval</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

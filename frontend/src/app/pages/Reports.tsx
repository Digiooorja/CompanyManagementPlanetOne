import { useState, useEffect, useCallback } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { FileText, Download, Search, Calendar, BarChart3, TrendingUp, Shield, DollarSign, Plus, Pencil, Trash2 } from "lucide-react";
import { reportsApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const ALL_FORMATS = ["PDF", "Excel"];
const ALL_CATEGORIES = ["Operations", "Financial", "HSE", "Performance"];
const ALL_FREQUENCIES = ["Weekly", "Monthly", "Quarterly"];

function emptyDefForm() {
  return { name: "", category: "Operations", description: "", frequency: "Monthly", formats: ["PDF"] as string[], block: "All Blocks" };
}

// Presentation-only metadata (icon/colour) for each report category — the
// actual per-category counts are computed below from real report
// definitions fetched from the backend, not hardcoded.
const categoryMeta: Record<string, { icon: any; iconColor: string; bgColor: string }> = {
  Operations: { icon: BarChart3, iconColor: "text-blue-600", bgColor: "bg-blue-100" },
  Financial: { icon: DollarSign, iconColor: "text-green-600", bgColor: "bg-green-100" },
  HSE: { icon: Shield, iconColor: "text-orange-600", bgColor: "bg-orange-100" },
  Performance: { icon: TrendingUp, iconColor: "text-purple-600", bgColor: "bg-purple-100" },
};
const categoryOrder = ["Operations", "Financial", "HSE", "Performance"];

export function Reports() {
  const { hasPermission } = useAuth();
  const canManageReports = hasPermission("reports.manage");
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");

  const [isDefOpen, setIsDefOpen] = useState(false);
  const [editingDefId, setEditingDefId] = useState<number | null>(null);
  const [defForm, setDefForm] = useState(emptyDefForm());
  const [savingDef, setSavingDef] = useState(false);

  // Report definitions (the catalogue) and generated report instances (the
  // "Recently Generated Reports" log) both come from the real backend —
  // see backend/routes/reports.js and backend/models/ReportDefinition.js.
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [defs, reports] = await Promise.all([
        reportsApi.getDefinitions(),
        reportsApi.getAll(),
      ]);
      setDefinitions(Array.isArray(defs) ? defs : []);
      setRecentReports(Array.isArray(reports) ? reports : []);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Unable to load reports from the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reportCategories = categoryOrder.map((name) => ({
    name,
    ...categoryMeta[name],
    count: definitions.filter((d) => d.category === name).length,
  }));

  const handleGenerate = async (definition: any) => {
    try {
      setActioningId(definition.id);
      await reportsApi.generate(definition.id);
      await loadData();
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Unable to generate report.');
    } finally {
      setActioningId(null);
    }
  };

  const handleExport = async (definition: any, format: string) => {
    try {
      setActioningId(definition.id);
      const { report } = await reportsApi.generate(definition.id, format);
      const content = [
        `Report: ${report.title}`,
        `Category: ${definition.category}`,
        `Block(s): ${definition.block || 'All Blocks'}`,
        `Frequency: ${definition.frequency}`,
        `Generated: ${new Date(report.generatedDate).toLocaleString()}`,
        `Format: ${format}`,
        '',
        report.content,
      ].join('\n');
      const isExcel = format === 'Excel';
      const blob = new Blob([content], { type: isExcel ? 'text/csv' : 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${definition.name.replace(/\s+/g, '_')}.${isExcel ? 'csv' : 'txt'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      await loadData();
    } catch (err) {
      console.error('Error exporting report:', err);
      setError('Unable to export report.');
    } finally {
      setActioningId(null);
    }
  };

  const openCreateDef = () => {
    setEditingDefId(null);
    setDefForm(emptyDefForm());
    setIsDefOpen(true);
  };

  const openEditDef = (definition: any) => {
    setEditingDefId(definition.id);
    setDefForm({
      name: definition.name || "",
      category: definition.category || "Operations",
      description: definition.description || "",
      frequency: definition.frequency || "Monthly",
      formats: Array.isArray(definition.formats) && definition.formats.length > 0 ? definition.formats : ["PDF"],
      block: definition.block || "All Blocks",
    });
    setIsDefOpen(true);
  };

  const toggleDefFormat = (format: string) => {
    setDefForm((prev) => ({
      ...prev,
      formats: prev.formats.includes(format) ? prev.formats.filter((f) => f !== format) : [...prev.formats, format],
    }));
  };

  const handleSaveDef = async () => {
    if (!defForm.name.trim()) {
      setError('Report name is required.');
      return;
    }
    if (defForm.formats.length === 0) {
      setError('Select at least one export format.');
      return;
    }
    try {
      setSavingDef(true);
      setError(null);
      const payload = {
        name: defForm.name,
        category: defForm.category,
        description: defForm.description || undefined,
        frequency: defForm.frequency,
        formats: defForm.formats,
        block: defForm.block || 'All Blocks',
      };
      if (editingDefId) {
        await reportsApi.updateDefinition(editingDefId, payload);
      } else {
        await reportsApi.createDefinition(payload);
      }
      setIsDefOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving report definition:', err);
      setError('Unable to save report definition.');
    } finally {
      setSavingDef(false);
    }
  };

  const handleDeleteDef = async (definition: any) => {
    if (!confirm(`Delete report "${definition.name}" from the catalogue? This cannot be undone.`)) return;
    try {
      await reportsApi.deleteDefinition(definition.id);
      await loadData();
    } catch (err) {
      console.error('Error deleting report definition:', err);
      setError('Unable to delete report definition.');
    }
  };

  useEffect(() => {
    const handler = (e: any) => setSearchQuery(e?.detail?.query || "");
    window.addEventListener('globalSearch', handler as EventListener);
    return () => window.removeEventListener('globalSearch', handler as EventListener);
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredReports = definitions.filter((r) => {
    if (categoryFilter !== 'all' && r.category?.toLowerCase() !== categoryFilter) return false;
    if (frequencyFilter !== 'all' && r.frequency?.toLowerCase() !== frequencyFilter) return false;
    if (!normalizedSearch) return true;
    return [r.name, r.description, r.category, r.block]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and export operational reports</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="text-sm text-gray-500 animate-pulse">Loading...</span>}
          {canManageReports && (
            <Button onClick={openCreateDef} className="gap-2">
              <Plus className="h-4 w-4" />
              New Report
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.name} className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${category.bgColor} rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`h-5 w-5 ${category.iconColor}`} />
                </div>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-gray-600">{category.count} reports</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search reports..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="hse">HSE</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequencies</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Reports List */}
      {!loading && filteredReports.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">No report definitions match your filters.</Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReports.map((report) => {
            const formats: string[] = Array.isArray(report.formats) ? report.formats : [];
            const isBusy = actioningId === report.id;
            return (
              <Card key={report.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <h3 className="font-medium mb-1">{report.name}</h3>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{report.category}</Badge>
                    {canManageReports && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => openEditDef(report)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteDef(report)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Block(s):</span>
                    <span>{report.block || 'All Blocks'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Frequency:</span>
                    <Badge variant="secondary">{report.frequency}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Generated:</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDisplayDateOrDefault(report.lastGeneratedDate, 'Never')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
                  {formats.map((format) => (
                    <Button key={format} size="sm" variant="outline" disabled={isBusy} onClick={() => handleExport(report, format)}>
                      <Download className="h-3 w-3 mr-1" />
                      Export {format}
                    </Button>
                  ))}
                  <Button size="sm" className="ml-auto" disabled={isBusy} onClick={() => handleGenerate(report)}>
                    {isBusy ? 'Working...' : 'Generate'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Reports */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Recently Generated Reports</h2>
        {recentReports.length === 0 ? (
          <p className="text-sm text-gray-500">No reports have been generated yet — click "Generate" on a report above.</p>
        ) : (
          <div className="space-y-2">
            {recentReports.slice(0, 10).map((recent) => (
              <div key={recent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm">{recent.title}</p>
                    <p className="text-xs text-gray-500">{new Date(recent.generatedDate).toLocaleString()}</p>
                  </div>
                </div>
                <Badge variant="outline">{recent.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create/Edit Report Definition dialog — gated by the reports.manage permission. */}
      <Dialog open={isDefOpen} onOpenChange={setIsDefOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDefId ? 'Edit Report' : 'New Report'}</DialogTitle>
            <DialogDescription>Define a report catalogue entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name</Label>
              <Input value={defForm.name} onChange={(e) => setDefForm({ ...defForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={defForm.category}
                  onChange={(e) => setDefForm({ ...defForm, category: e.target.value })}
                >
                  {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Frequency</Label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={defForm.frequency}
                  onChange={(e) => setDefForm({ ...defForm, frequency: e.target.value })}
                >
                  {ALL_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Block(s)</Label>
              <Input
                value={defForm.block}
                onChange={(e) => setDefForm({ ...defForm, block: e.target.value })}
                placeholder="e.g. All Blocks, or Block A, Block B"
              />
            </div>
            <div>
              <Label>Formats</Label>
              <div className="flex gap-3 mt-1">
                {ALL_FORMATS.map((format) => (
                  <label key={format} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={defForm.formats.includes(format)}
                      onChange={() => toggleDefFormat(format)}
                    />
                    {format}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={defForm.description}
                onChange={(e) => setDefForm({ ...defForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveDef} disabled={savingDef}>
              {savingDef ? 'Saving...' : editingDefId ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

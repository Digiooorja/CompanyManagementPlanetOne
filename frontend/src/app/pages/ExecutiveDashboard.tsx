import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { formatDisplayDateOrDefault } from "../lib/date";
import { Progress } from "../components/ui/progress";
import {
  Search,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  User,
  AlertTriangle,
  Crown,
  ListChecks,
  Printer,
  RefreshCw,
  Filter,
  Download,
  X,
} from "lucide-react";
import { blocksApi, documentsApi, activitiesApi, projectsApi, financeApi, licencesApi, risksApi, contractsApi, complianceApi, correspondenceApi, tasksApi, decisionsApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

export function ExecutiveDashboard() {
  const { isGuest, isAdmin, hasPermission } = useAuth();
  const canSeeChairmanView = isAdmin || hasPermission("chairman_view.access");
  const [blocks, setBlocks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [pendingAFEs, setPendingAFEs] = useState<any[]>([]);
  const [licences, setLicences] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ------------------------------------------------------------------
  // §5.8 Dashboard filter bar — Block / Project / Status / Date range.
  // Synced to URL query params so a filtered view can be bookmarked or
  // shared as a link (lightweight "shareable view" support).
  // ------------------------------------------------------------------
  const [searchParams, setSearchParams] = useSearchParams();
  const filterBlockId = searchParams.get("blockId") || "all";
  const filterProjectId = searchParams.get("projectId") || "all";
  const filterStatus = searchParams.get("status") || "all";
  const filterDateFrom = searchParams.get("dateFrom") || "";
  const filterDateTo = searchParams.get("dateTo") || "";
  const hasActiveFilters = filterBlockId !== "all" || filterProjectId !== "all" || filterStatus !== "all" || !!filterDateFrom || !!filterDateTo;

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });

  // Query params to forward to a destination page so a dashboard click
  // actually drills down into a pre-filtered list rather than the full one.
  const drillDownParams = (extra: Record<string, string | undefined> = {}) => {
    const params = new URLSearchParams();
    if (filterBlockId !== "all") params.set("blockId", filterBlockId);
    if (filterProjectId !== "all") params.set("projectId", filterProjectId);
    if (filterStatus !== "all") params.set("status", filterStatus);
    Object.entries(extra).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  // Chairman View data (§6) — only fetched/rendered for authorized roles
  const [contracts, setContracts] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [correspondence, setCorrespondence] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [chairmanGeneratedAt, setChairmanGeneratedAt] = useState<Date | null>(null);
  const [chairmanLoading, setChairmanLoading] = useState(false);
  
  // State for inline AFE actions (Approve, Reject, Delegate)
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | 'Delegate' | null>(null);
  const [actionForm, setActionForm] = useState({ delegateTo: '', comment: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const computeMilestones = () => {
    const milestones: any[] = [];
    const now = new Date();

    // 1. Licences Expirations
    licences.forEach(lic => {
      if (lic.expiryDate && lic.status === 'Active') {
        const exp = new Date(lic.expiryDate);
        const diffTime = exp.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays < 365 * 2) {
          milestones.push({
            title: `${lic.licenceType || 'Licence'} Expiry`,
            date: exp.toISOString().split('T')[0],
            daysLeft: diffDays,
            status: diffDays < 90 ? 'critical' : diffDays < 180 ? 'warning' : 'normal',
            block: lic.licenceNumber || 'Unknown'
          });
        }
      }
    });

    // 2. Activities Deadlines
    activities.forEach(act => {
      if (act.endDate && act.status !== 'Completed') {
        const end = new Date(act.endDate);
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays < 180) {
          milestones.push({
            title: `Activity Deadline`,
            date: end.toISOString().split('T')[0],
            daysLeft: diffDays,
            status: diffDays < 14 ? 'critical' : diffDays < 30 ? 'warning' : 'normal',
            block: act.name || act.title || 'Unknown Activity'
          });
        }
      }
    });

    // 3. Projects Deadlines
    projects.forEach(proj => {
      if (proj.endDate && proj.status !== 'Completed') {
        const end = new Date(proj.endDate);
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays < 365) {
          milestones.push({
            title: `Project Deadline`,
            date: end.toISOString().split('T')[0],
            daysLeft: diffDays,
            status: diffDays < 30 ? 'critical' : diffDays < 90 ? 'warning' : 'normal',
            block: proj.name || proj.title || 'Unknown Project'
          });
        }
      }
    });

    // Sort by closest date and take top 3
    return milestones.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3);
  };

  const liveCountdownCards = computeMilestones();

  const fetchBlocks = async () => {
    try {
      setLoadingBlocks(true);
      setBlockError(null);
      const data = await blocksApi.getAll();
      setBlocks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading blocks overview:', err);
      setBlockError('Unable to load blocks from the database.');
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const fetchSearchData = async () => {
    try {
      const [docs, acts, projs, afes, lics, rks] = await Promise.all([
        documentsApi.getAll(),
        activitiesApi.getAll(),
        projectsApi.getAll(),
        financeApi.getPending(),
        licencesApi.getAll(),
        risksApi.getAll(),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setActivities(Array.isArray(acts) ? acts : []);
      setProjects(Array.isArray(projs) ? projs : []);
      setPendingAFEs(Array.isArray(afes) ? afes : []);
      setLicences(Array.isArray(lics) ? lics : []);
      setRisks(Array.isArray(rks) ? rks : []);
    } catch (err) {
      console.error('Error loading dashboard search data:', err);
      setDocuments([]);
      setActivities([]);
      setProjects([]);
      setPendingAFEs([]);
      setLicences([]);
      setRisks([]);
    }
  };

  const handleAfeAction = async (afeId: number) => {
    if (!actionType) return;
    try {
      setActionLoading(true);
      if (actionType === 'Approve') {
        await financeApi.approve(afeId, { comment: actionForm.comment });
      } else if (actionType === 'Reject') {
        await financeApi.reject(afeId, { comment: actionForm.comment });
      } else if (actionType === 'Delegate') {
        if (!actionForm.delegateTo.trim()) return; // Must have delegate target
        await financeApi.delegate(afeId, { delegateTo: actionForm.delegateTo, comment: actionForm.comment });
      }
      
      // Remove it from the list since it's processed
      setPendingAFEs(prev => prev.filter(a => a.id !== afeId));
      setActiveActionId(null);
      setActionType(null);
      setActionForm({ delegateTo: '', comment: '' });
    } catch (err) {
      console.error('Failed to execute AFE action', err);
      alert('Action failed. You may not have permission.');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchChairmanData = async () => {
    if (!canSeeChairmanView) return;
    setChairmanLoading(true);
    try {
      const [con, comp, corr, tsk, dec] = await Promise.all([
        contractsApi.getAll(),
        complianceApi.getAll(),
        correspondenceApi.getAll(),
        tasksApi.getAll(),
        decisionsApi.getAll(),
      ]);
      setContracts(Array.isArray(con) ? con : []);
      setCompliance(Array.isArray(comp) ? comp : []);
      setCorrespondence(Array.isArray(corr) ? corr : []);
      setTasks(Array.isArray(tsk) ? tsk : []);
      setDecisions(Array.isArray(dec) ? dec : []);
      setChairmanGeneratedAt(new Date());
    } catch (err) {
      console.error('Error loading Chairman View data:', err);
    } finally {
      setChairmanLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    fetchSearchData();
  }, []);

  useEffect(() => {
    fetchChairmanData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeChairmanView]);

  useEffect(() => {
    const handler = (e: any) => setSearchQuery(e?.detail?.query || "");
    window.addEventListener('globalSearch', handler as EventListener);
    return () => window.removeEventListener('globalSearch', handler as EventListener);
  }, []);

  function daysUntil(date: string | null | undefined): number | null {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ------------------------------------------------------------------
  // Chairman View (§6) — Block A: Countdown & Deadlines
  // ------------------------------------------------------------------
  const chairmanDeadlines = (() => {
    type Urgency = "red" | "amber" | "green";
    const items: { id: string; module: string; title: string; date: string | null; daysLeft: number | null; urgency: Urgency; link: string }[] = [];

    licences
      .filter((l) => l.status === "Active" && l.expiryDate)
      .forEach((l) => {
        const d = daysUntil(l.expiryDate);
        if (d === null) return;
        items.push({
          id: `licence-${l.id}`,
          module: "Licence",
          title: `${l.licenceType || "Licence"} ${l.licenceNumber || ""} expiry`,
          date: l.expiryDate,
          daysLeft: d,
          urgency: d < 30 ? "red" : d < 90 ? "amber" : "green",
          link: "/licences",
        });
      });

    contracts
      .filter((c) => !["Expired", "Terminated"].includes(c.status) && c.expiryDate)
      .forEach((c) => {
        const d = daysUntil(c.expiryDate);
        if (d === null) return;
        items.push({
          id: `contract-${c.id}`,
          module: "Contract",
          title: `${c.title} expiry`,
          date: c.expiryDate,
          daysLeft: d,
          urgency: d < 30 ? "red" : d < 90 ? "amber" : "green",
          link: "/contracts",
        });
      });

    compliance
      .filter((o) => o.status !== "Closed" && o.dueDate)
      .forEach((o) => {
        const d = daysUntil(o.dueDate);
        if (d === null) return;
        items.push({
          id: `compliance-${o.id}`,
          module: "Compliance",
          title: o.description,
          date: o.dueDate,
          daysLeft: d,
          urgency: d < 0 || d <= 7 ? "red" : d <= 30 ? "amber" : "green",
          link: "/compliance",
        });
      });

    correspondence
      .filter((c) => c.awaitingResponse && c.status === "Open" && c.responseDueDate)
      .forEach((c) => {
        const d = daysUntil(c.responseDueDate);
        if (d === null) return;
        items.push({
          id: `correspondence-${c.id}`,
          module: "Correspondence",
          title: `${c.subject} — response due`,
          date: c.responseDueDate,
          daysLeft: d,
          urgency: d < 0 || d <= 3 ? "red" : d <= 14 ? "amber" : "green",
          link: "/correspondence",
        });
      });

    return items.sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  })();

  const chairmanRedCount = chairmanDeadlines.filter((d) => d.urgency === "red").length;
  const chairmanAmberCount = chairmanDeadlines.filter((d) => d.urgency === "amber").length;

  // ------------------------------------------------------------------
  // Chairman View — Block B: Progress & Status
  // ------------------------------------------------------------------
  const chairmanTotalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const chairmanTotalSpent = projects.reduce((sum, p) => sum + Number(p.spent || 0), 0);
  const chairmanBudgetUtilisation = chairmanTotalBudget > 0 ? Math.round((chairmanTotalSpent / chairmanTotalBudget) * 100) : 0;
  const chairmanAvgCompletion = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + Number(p.completion || 0), 0) / projects.length)
    : 0;

  const chairmanTaskTotal = tasks.length;
  const chairmanTaskCompleted = tasks.filter((t) => t.status === "Completed").length;
  const chairmanTaskCompletionPct = chairmanTaskTotal > 0 ? Math.round((chairmanTaskCompleted / chairmanTaskTotal) * 100) : 0;

  const chairmanOpenRisks = risks.filter((r) => r.status !== "Closed" && r.status !== "Mitigated");
  const chairmanHighRisks = chairmanOpenRisks.filter((r) => r.severity === "High");
  const chairmanPendingDecisions = decisions.filter((d) => d.status !== "Closed");
  const chairmanOverdueCompliance = compliance.filter((o) => o.status !== "Closed" && (daysUntil(o.dueDate) ?? 1) < 0);

  // Block C: auto-generated executive summary — no manual compilation
  const chairmanSummaryText = `As of ${chairmanGeneratedAt ? chairmanGeneratedAt.toLocaleString() : "now"}: ${projects.length} project(s) tracked at ${chairmanAvgCompletion}% average completion with budget utilisation at ${chairmanBudgetUtilisation}% ($${chairmanTotalSpent.toLocaleString()} of $${chairmanTotalBudget.toLocaleString()}). ${chairmanRedCount} deadline(s) are within their critical window and ${chairmanAmberCount} are approaching. ${chairmanOverdueCompliance.length} compliance obligation(s) are overdue. ${chairmanOpenRisks.length} risk(s) remain open (${chairmanHighRisks.length} high-severity). ${chairmanPendingDecisions.length} decision(s) are pending closure. Task completion stands at ${chairmanTaskCompletionPct}% (${chairmanTaskCompleted}/${chairmanTaskTotal}).`;

  const handleChairmanExport = () => {
    window.print();
  };

  // ------------------------------------------------------------------
  // §5.8 Filter bar application — Block / Project / Status / Date range.
  // Blocks and Projects carry their own blockId/status directly; Risks
  // and AFEs are linked one hop away (Risk.projectId, Finance.activityId
  // → Activity.projectId), so we resolve those via lookup maps.
  // ------------------------------------------------------------------
  const projectIdToBlockId: Record<string, any> = {};
  projects.forEach((p) => { projectIdToBlockId[String(p.id)] = p.blockId; });
  const activityIdToProjectId: Record<string, any> = {};
  activities.forEach((a) => { activityIdToProjectId[String(a.id)] = a.projectId; });

  const matchesBlock = (blockId: any) => filterBlockId === "all" || String(blockId ?? "") === filterBlockId;
  const matchesProject = (projectId: any) => filterProjectId === "all" || String(projectId ?? "") === filterProjectId;
  const matchesStatus = (status: any) => filterStatus === "all" || String(status ?? "").toLowerCase() === filterStatus.toLowerCase();
  const matchesDateRange = (dateStr: any) => {
    if (!filterDateFrom && !filterDateTo) return true;
    if (!dateStr) return false;
    const time = new Date(dateStr).getTime();
    if (Number.isNaN(time)) return false;
    if (filterDateFrom && time < new Date(filterDateFrom).getTime()) return false;
    if (filterDateTo && time > new Date(filterDateTo).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
    return true;
  };

  const filterBarActiveOnBlocks = blocks.filter((b) => matchesBlock(b.id) && matchesStatus(b.status));
  const filterBarActiveOnProjects = projects.filter((p) => matchesBlock(p.blockId) && matchesProject(p.id) && matchesStatus(p.status));

  const criticalRisks = risks
    .filter((r) => matchesProject(r.projectId) && matchesBlock(projectIdToBlockId[String(r.projectId)]) && matchesStatus(r.status))
    .filter(r => r.severity === 'High' || r.severity === 'Critical')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const filterBarActiveOnAFEs = pendingAFEs.filter((afe) => {
    const projectId = activityIdToProjectId[String(afe.activityId)];
    return matchesProject(projectId) && matchesBlock(projectIdToBlockId[String(projectId)]);
  });

  const topExpiringLicence = licences
    .filter(lic => lic.expiryDate && lic.status === 'Active')
    .map(lic => {
      const diffDays = Math.ceil((new Date(lic.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return { ...lic, diffDays };
    })
    .filter(lic => lic.diffDays > 0)
    .sort((a, b) => a.diffDays - b.diffDays)[0];

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const searchResults = normalizedSearch
    ? [
        ...documents.map((doc) => ({
          page: 'Documents',
          title: doc.title || doc.name || 'Untitled document',
          subtitle: `${doc.documentType || doc.type || 'Document'} • ${doc.status || 'Unknown status'}`,
          link: `/documents/${doc.id}`,
          group: 'Documents',
        })),
        ...activities.map((activity) => ({
          page: 'Activities',
          title: activity.title || activity.name || 'Untitled activity',
          subtitle: `${activity.project || activity.project?.name || 'No project'} • ${activity.status || 'Unknown status'}`,
          link: `/activities/${activity.id}`,
          group: 'Activities',
        })),
        ...projects.map((project) => ({
          page: 'Projects',
          title: project.name || project.title || 'Untitled project',
          subtitle: `${project.block || project.blockName || 'No block'} • ${project.status || 'Unknown status'}`,
          link: `/projects/${project.id}`,
          group: 'Projects',
        })),
      ]
        .filter((item) =>
          [item.title, item.subtitle, item.page]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        )
    : [];

  const filteredCountdownCards = (
    normalizedSearch
      ? liveCountdownCards.filter((card) => [card.title, card.block, card.date]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch))
      : liveCountdownCards
  ).filter((card) => matchesDateRange(card.date));

  const filteredBlocks = normalizedSearch
    ? filterBarActiveOnBlocks.filter((block) => [block.name, block.operator, block.location, block.area, block.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : filterBarActiveOnBlocks;

  const filteredRisks = normalizedSearch
    ? criticalRisks.filter((risk) => [risk.title, risk.description, risk.severity]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : criticalRisks;

  const filteredPendingAFEs = normalizedSearch
    ? filterBarActiveOnAFEs.filter((afe) => [afe.afeNumber, afe.item, afe.amount?.toString(), afe.delegatedTo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : filterBarActiveOnAFEs;

  const exportBlocksCsv = () => {
    const header = ['Block', 'Status', 'Operator', 'Area', 'Location'];
    const rows = filteredBlocks.map((b) => [b.name, b.status, b.operator, b.area, b.location]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-blocks-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusFilterOptions = Array.from(
    new Set([...blocks, ...projects, ...risks].map((item) => item?.status).filter(Boolean))
  ).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Executive Dashboard</h1>
          <p className="text-gray-500 mt-1">Executive overview and key metrics</p>
        </div>
        {!isGuest && (
          <Link to="/operational">
            <Button variant="outline">Switch to Operational View</Button>
          </Link>
        )}
      </div>

      {/* §5.8 Filter bar — Block / Project / Status / Date range, synced to the
          URL so the current view can be bookmarked or shared as a link. */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto gap-1 text-gray-500">
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportBlocksCsv} className={`gap-1 ${hasActiveFilters ? '' : 'ml-auto'}`}>
            <Download className="h-3.5 w-3.5" />
            Export blocks (CSV)
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Block</label>
            <Select value={filterBlockId} onValueChange={(value) => updateFilter("blockId", value)}>
              <SelectTrigger><SelectValue placeholder="All Blocks" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blocks</SelectItem>
                {blocks.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Project</label>
            <Select value={filterProjectId} onValueChange={(value) => updateFilter("projectId", value)}>
              <SelectTrigger><SelectValue placeholder="All Projects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects
                  .filter((p) => matchesBlock(p.blockId))
                  .map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name || p.title}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <Select value={filterStatus} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusFilterOptions.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date from</label>
            <input
              type="date"
              className="w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={filterDateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date to</label>
            <input
              type="date"
              className="w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={filterDateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Chairman View (§6) — dedicated three-block executive summary, restricted
          to the Chairman/Board role and any explicitly delegated executives via
          the configurable RBAC matrix (chairman_view.access). */}
      {canSeeChairmanView && (
        <Card className="p-6 border-2 border-amber-200 bg-amber-50/30 print:border-0 print:bg-white">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="text-2xl flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-500" />
              Chairman View
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchChairmanData} className="gap-2" disabled={chairmanLoading}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={handleChairmanExport} className="gap-2">
                <Printer className="h-4 w-4" />
                Export (Print/PDF)
              </Button>
            </div>
          </div>

          {chairmanGeneratedAt && (
            <p className="text-xs text-gray-400 mb-4">
              Data as of {chairmanGeneratedAt.toLocaleString()} — refresh for the latest figures
            </p>
          )}

          {chairmanLoading ? (
            <p className="text-sm text-gray-500">Loading Chairman View...</p>
          ) : (
            <div className="space-y-6">
              {/* Block A — Countdown & Deadlines */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Block A — Countdown &amp; Deadlines
                  </h3>
                  <div className="flex gap-2">
                    <Badge className="bg-red-100 text-red-700 border border-red-300">{chairmanRedCount} Red</Badge>
                    <Badge className="bg-amber-100 text-amber-700 border border-amber-300">{chairmanAmberCount} Amber</Badge>
                  </div>
                </div>
                {chairmanDeadlines.length === 0 ? (
                  <p className="text-sm text-gray-500">No upcoming licence, contract, compliance or correspondence deadlines.</p>
                ) : (
                  <div className="space-y-2">
                    {chairmanDeadlines.slice(0, 8).map((d) => (
                      <Link
                        key={d.id}
                        to={d.link}
                        className={`flex items-center justify-between p-2.5 rounded-md border text-sm ${
                          d.urgency === "red"
                            ? "bg-red-100 text-red-700 border-red-300"
                            : d.urgency === "amber"
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-green-100 text-green-700 border-green-300"
                        } hover:opacity-90`}
                      >
                        <div>
                          <span className="text-xs uppercase font-semibold mr-2">{d.module}</span>
                          {d.title}
                        </div>
                        <div className="font-medium whitespace-nowrap">
                          {d.daysLeft !== null && d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d left`}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Block B — Progress & Status */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <ListChecks className="h-4 w-4 text-blue-500" />
                  Block B — Progress &amp; Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to={`/projects${drillDownParams()}`} className="block p-3 rounded-md border bg-white hover:bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Work Programme Progress (avg. completion)</p>
                    <div className="flex items-center gap-3">
                      <Progress value={chairmanAvgCompletion} className="flex-1" />
                      <span className="text-sm font-semibold">{chairmanAvgCompletion}%</span>
                    </div>
                  </Link>
                  <Link to={`/finance${drillDownParams()}`} className="block p-3 rounded-md border bg-white hover:bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Budget Utilisation</p>
                    <div className="flex items-center gap-3">
                      <Progress value={Math.min(chairmanBudgetUtilisation, 100)} className="flex-1" />
                      <span className="text-sm font-semibold">{chairmanBudgetUtilisation}%</span>
                    </div>
                  </Link>
                  <Link to={`/tasks${drillDownParams()}`} className="block p-3 rounded-md border bg-white hover:bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Task Completion (org-wide)</p>
                    <div className="flex items-center gap-3">
                      <Progress value={chairmanTaskCompletionPct} className="flex-1" />
                      <span className="text-sm font-semibold">{chairmanTaskCompletionPct}%</span>
                    </div>
                  </Link>
                  <div className="p-3 rounded-md border bg-white grid grid-cols-3 gap-2 text-center">
                    <Link to="/registers">
                      <p className="text-xl font-semibold">{chairmanOpenRisks.length}</p>
                      <p className="text-xs text-gray-500">Open Risks</p>
                    </Link>
                    <Link to={`/decisions${drillDownParams()}`}>
                      <p className="text-xl font-semibold">{chairmanPendingDecisions.length}</p>
                      <p className="text-xs text-gray-500">Pending Decisions</p>
                    </Link>
                    <Link to={`/compliance${drillDownParams({ status: 'Overdue' })}`}>
                      <p className="text-xl font-semibold">{chairmanOverdueCompliance.length}</p>
                      <p className="text-xs text-gray-500">Overdue Compliance</p>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Block C — One-Click Summary */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Block C — One-Click Summary
                </h3>
                <p className="text-sm leading-relaxed text-gray-700">{chairmanSummaryText}</p>
                {chairmanHighRisks.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {chairmanHighRisks.length} high-severity risk(s) require attention.
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {normalizedSearch && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-gray-500" />
            <div>
              <h2 className="text-xl">Search Results</h2>
              <p className="text-sm text-gray-500">Showing documents, activities, and projects matching “{searchQuery}”.</p>
            </div>
          </div>

          {searchResults.length === 0 ? (
            <p className="text-gray-600">No results found for “{searchQuery}”.</p>
          ) : (
            <div className="space-y-3">
              {searchResults.slice(0, 10).map((result, index) => (
                <Link
                  key={`${result.page}-${index}`}
                  to={result.link}
                  className="block rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{result.title}</p>
                      <p className="text-sm text-gray-500">{result.subtitle}</p>
                    </div>
                    <Badge variant="outline">{result.page}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Top Expirable Licence Widget */}
      {topExpiringLicence && (
        <Card className="p-4 bg-orange-50 border-orange-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900">Licence Action Required: {topExpiringLicence.licenceNumber}</h3>
              <p className="text-sm text-orange-700">
                {topExpiringLicence.licenceType} expires in <span className="font-bold">{topExpiringLicence.diffDays} days</span> 
                ({formatDisplayDateOrDefault(topExpiringLicence.expiryDate)}).
              </p>
            </div>
          </div>
          <Link to={!isGuest ? `/licences?edit=${topExpiringLicence.id}` : `/licences?search=${encodeURIComponent(topExpiringLicence.licenceNumber)}`}>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white shrink-0">
              Manage Licence
            </Button>
          </Link>
        </Card>
      )}

      {/* Countdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredCountdownCards.map((card, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h3 className="font-medium">{card.title}</h3>
              </div>
              <Badge
                variant={
                  card.status === "critical"
                    ? "destructive"
                    : card.status === "warning"
                    ? "default"
                    : "outline"
                }
              >
                {card.daysLeft} days
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{card.block}</p>
              <p className="text-2xl">{card.date}</p>
              <Progress
                value={Math.max(0, 100 - (card.daysLeft / 365) * 100)}
                className="h-2"
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Sleek Asset Health Matrix */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Asset Health Matrix</h2>
          {loadingBlocks && <span className="text-sm text-gray-500 animate-pulse">Loading...</span>}
        </div>

        {blockError ? (
          <Card className="p-6 bg-red-50 border border-red-200">
            <p className="text-red-700">{blockError}</p>
          </Card>
        ) : blocks.length === 0 ? (
          <Card className="p-6">
            <p className="text-gray-600">No blocks found in the database.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBlocks.map((block) => {
              const isActive = block.status === "Active";
              return (
                <Link to={`/blocks/${block.id}`} key={block.id}>
                  <Card className={`p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-l-4 cursor-pointer h-full flex flex-col justify-between ${isActive ? 'border-l-emerald-500 bg-white' : 'border-l-slate-300 bg-slate-50'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-800 truncate pr-2" title={block.name}>{block.name}</h3>
                        <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : ''}>
                          {block.status}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Operator</span>
                          <span className="font-medium text-right truncate max-w-[100px]">{block.operator || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Area</span>
                          <span className="font-medium">{block.area || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Risks Panel */}
        <Card className="p-6 border-l-4 border-l-red-500 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Critical Risks Alert Panel
            </h3>
            <Badge variant="destructive">{filteredRisks.length} High Priority</Badge>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {filteredRisks.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p>No critical risks currently active.</p>
              </div>
            ) : (
              filteredRisks.map((risk) => (
                <div key={risk.id} className="flex flex-col gap-1 p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-red-900 truncate" title={risk.title}>{risk.title}</span>
                    <Badge variant="outline" className="bg-white text-xs border-red-200 text-red-700 shrink-0">{risk.status || 'Open'}</Badge>
                  </div>
                  <p className="text-sm text-red-700 line-clamp-2" title={risk.description}>{risk.description}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Pending AFEs Inbox */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              AFE Action Inbox
            </h3>
            <Badge variant="outline">{filteredPendingAFEs.length} Pending</Badge>
          </div>
          
          <div className="space-y-4">
            {filteredPendingAFEs.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">You're all caught up!</p>
              </div>
            ) : (
              filteredPendingAFEs.map((afe) => (
                <div
                  key={afe.id}
                  className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm"
                >
                  <div className="p-4 bg-gray-50 flex items-start justify-between border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{afe.afeNumber || `AFE-${afe.id}`}</Badge>
                        <span className="font-medium">{afe.item}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {Number(afe.amount).toLocaleString()}
                        </span>
                        {afe.delegatedTo && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Holding: {afe.delegatedTo}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link to={`/finance/${afe.id}`}>
                      <Button size="sm" variant="ghost" className="text-blue-600">Details</Button>
                    </Link>
                  </div>

                  {/* Action Buttons */}
                  {activeActionId !== afe.id ? (
                    <div className="p-3 flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => { setActiveActionId(afe.id); setActionType('Approve'); }}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => { setActiveActionId(afe.id); setActionType('Reject'); }}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="flex-1"
                        onClick={() => { setActiveActionId(afe.id); setActionType('Delegate'); }}
                      >
                        Forward/Delegate
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50/50 space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        {actionType === 'Approve' && <CheckCircle className="h-4 w-4 text-green-600"/>}
                        {actionType === 'Reject' && <AlertCircle className="h-4 w-4 text-red-600"/>}
                        {actionType === 'Delegate' && <User className="h-4 w-4 text-blue-600"/>}
                        {actionType} AFE
                      </h4>
                      
                      {actionType === 'Delegate' && (
                        <div>
                          <label className="text-xs font-medium text-gray-700">Forward To (Name or Dept)</label>
                          <input
                            type="text"
                            list="department-options"
                            className="w-full mt-1 p-2 text-sm border rounded"
                            placeholder="e.g. Finance Department or John Doe"
                            value={actionForm.delegateTo}
                            onChange={e => setActionForm({...actionForm, delegateTo: e.target.value})}
                          />
                          <datalist id="department-options">
                            <option value="Executive Management" />
                            <option value="Procurement" />
                            <option value="Accounts" />
                            <option value="Operations" />
                            <option value="Finance & Accounts" />
                            <option value="HSE" />
                            <option value="Commercial" />
                            <option value="HR" />
                          </datalist>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-xs font-medium text-gray-700">Comment (Optional)</label>
                        <input
                          type="text"
                          className="w-full mt-1 p-2 text-sm border rounded"
                          placeholder="Add a note..."
                          value={actionForm.comment}
                          onChange={e => setActionForm({...actionForm, comment: e.target.value})}
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => { setActiveActionId(null); setActionType(null); }}
                          disabled={actionLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleAfeAction(afe.id)}
                          disabled={actionLoading || (actionType === 'Delegate' && !actionForm.delegateTo.trim())}
                        >
                          {actionLoading ? 'Processing...' : 'Confirm'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

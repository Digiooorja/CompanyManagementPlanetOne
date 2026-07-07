import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { formatDisplayDateOrDefault } from "../lib/date";
import { Progress } from "../components/ui/progress";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
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
  BarChart3,
  Wallet,
  ShieldAlert,
  Users,
  Bell,
  History,
  Grid3x3,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { blocksApi, documentsApi, activitiesApi, projectsApi, financeApi, licencesApi, risksApi, contractsApi, complianceApi, correspondenceApi, tasksApi, decisionsApi, budgetLinesApi, auditApi, notificationsApi, insuranceApi, environmentalPermitsApi, vendorPaymentsApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

// Compact horizontal stacked-bar status breakdown — reads faster and takes a
// fraction of the vertical space of a donut + legend for small category
// counts (used for Documents/Compliance status instead of pie charts).
function StackedStatusBar({ data, colorMap }: { data: { name: string; value: number }[]; colorMap: Record<string, string> }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden w-full bg-gray-100">
        {data.map((d) => (
          <div
            key={d.name}
            style={{ width: `${(d.value / total) * 100}%`, backgroundColor: colorMap[d.name] || "#94a3b8" }}
            title={`${d.name}: ${d.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colorMap[d.name] || "#94a3b8" }} />
            {d.name}: <span className="font-medium text-gray-800">{d.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

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
  const [budgetSummary, setBudgetSummary] = useState<any[]>([]);
  const [allAfes, setAllAfes] = useState<any[]>([]);
  const [workload, setWorkload] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [auditFeed, setAuditFeed] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Filter bar is collapsed by default to reclaim vertical space; active
  // filters stay visible as chips even when collapsed.
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Analytics/Operations/Assets/Risk sections are tabbed instead of stacked
  // vertically, so only one dense section is on screen at a time.
  const [dashboardTab, setDashboardTab] = useState("analytics");
  // Attention Required is collapsed by default so the charts/matrices sit
  // higher on the page; the count + top item stay visible on the bar.
  const [attentionOpen, setAttentionOpen] = useState(false);

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
  const activeFilterCount = [filterBlockId !== "all", filterProjectId !== "all", filterStatus !== "all", !!filterDateFrom, !!filterDateTo].filter(Boolean).length;

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
  // Phase 2 modules surfaced into the same deadlines/attention lists as the
  // Phase 1 registers above (Insurance/Environmental Permit share the same
  // expiryDate+RAG shape as Licence/Contract; Vendor Payment aging feeds the
  // Attention Required panel).
  const [insurancePolicies, setInsurancePolicies] = useState<any[]>([]);
  const [environmentalPermits, setEnvironmentalPermits] = useState<any[]>([]);
  const [vendorInvoices, setVendorInvoices] = useState<any[]>([]);
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
      const [docs, acts, projs, afes, lics, rks, budSummary, finAll, wl, notifs] = await Promise.all([
        documentsApi.getAll(),
        activitiesApi.getAll(),
        projectsApi.getAll(),
        financeApi.getPending(),
        licencesApi.getAll(),
        risksApi.getAll(),
        budgetLinesApi.getSummary().catch(() => []),
        financeApi.getAll().catch(() => []),
        tasksApi.getWorkload().catch(() => []),
        notificationsApi.getAll().catch(() => []),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setActivities(Array.isArray(acts) ? acts : []);
      setProjects(Array.isArray(projs) ? projs : []);
      setPendingAFEs(Array.isArray(afes) ? afes : []);
      setLicences(Array.isArray(lics) ? lics : []);
      setRisks(Array.isArray(rks) ? rks : []);
      setBudgetSummary(Array.isArray(budSummary) ? budSummary : []);
      setAllAfes(Array.isArray(finAll) ? finAll.filter((f: any) => f.recordType === 'AFE') : []);
      setWorkload(Array.isArray(wl) ? wl : []);
      setNotifications(Array.isArray(notifs) ? notifs : []);

      // Recent-activity feed comes from the immutable Audit Log, which is
      // Admin-only at the API layer — fetch it only for Admins.
      if (isAdmin) {
        try {
          const audit = await auditApi.getAll({ pageSize: 8, page: 1 });
          setAuditFeed(Array.isArray(audit?.data) ? audit.data : []);
        } catch {
          setAuditFeed([]);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard search data:', err);
      setDocuments([]);
      setActivities([]);
      setProjects([]);
      setPendingAFEs([]);
      setLicences([]);
      setRisks([]);
      setBudgetSummary([]);
      setAllAfes([]);
      setWorkload([]);
      setNotifications([]);
      setAuditFeed([]);
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
      const [con, comp, corr, tsk, dec, ins, env, vend] = await Promise.all([
        contractsApi.getAll(),
        complianceApi.getAll(),
        correspondenceApi.getAll(),
        tasksApi.getAll(),
        decisionsApi.getAll(),
        insuranceApi.getAll().catch(() => []),
        environmentalPermitsApi.getAll().catch(() => []),
        vendorPaymentsApi.getAll().catch(() => []),
      ]);
      setContracts(Array.isArray(con) ? con : []);
      setCompliance(Array.isArray(comp) ? comp : []);
      setCorrespondence(Array.isArray(corr) ? corr : []);
      setTasks(Array.isArray(tsk) ? tsk : []);
      setDecisions(Array.isArray(dec) ? dec : []);
      setInsurancePolicies(Array.isArray(ins) ? ins : []);
      setEnvironmentalPermits(Array.isArray(env) ? env : []);
      setVendorInvoices(Array.isArray(vend) ? vend : []);
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

    insurancePolicies
      .filter((p) => p.status === "Active" && p.expiryDate)
      .forEach((p) => {
        const d = daysUntil(p.expiryDate);
        if (d === null) return;
        items.push({
          id: `insurance-${p.id}`,
          module: "Insurance",
          title: `${p.policyType || "Policy"} ${p.policyNumber || ""} expiry`,
          date: p.expiryDate,
          daysLeft: d,
          urgency: d < 30 ? "red" : d < 90 ? "amber" : "green",
          link: "/insurance",
        });
      });

    environmentalPermits
      .filter((p) => p.status === "Active" && p.expiryDate)
      .forEach((p) => {
        const d = daysUntil(p.expiryDate);
        if (d === null) return;
        items.push({
          id: `env-permit-${p.id}`,
          module: "Env. Permit",
          title: `${p.permitType || "Permit"} ${p.permitNumber || ""} expiry`,
          date: p.expiryDate,
          daysLeft: d,
          urgency: d < 30 ? "red" : d < 90 ? "amber" : "green",
          link: "/environmental-permits",
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

  // ------------------------------------------------------------------
  // §5.8 Analytics & Insights — chart datasets derived from data already
  // fetched, respecting the active Block/Project filters where applicable.
  // ------------------------------------------------------------------
  const CHART_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777"];
  const SEVERITY_COLORS: Record<string, string> = { Critical: "#dc2626", High: "#f97316", Medium: "#f59e0b", Low: "#16a34a" };
  const STATUS_COLORS: Record<string, string> = { Completed: "#16a34a", "In Progress": "#2563eb", "To Do": "#94a3b8", Open: "#f59e0b", Closed: "#16a34a", Overdue: "#dc2626", Paid: "#16a34a" };

  const currencyFmt = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(Math.round(n));
  };

  // Budget vs Actual per block+currency (currencies kept separate — never summed).
  const budgetChartData = budgetSummary
    .filter((row) => filterBlockId === "all" || String(row.blockId) === filterBlockId)
    .map((row) => ({
      name: `${row.blockName} (${row.currency})`,
      Approved: Math.round(Number(row.approvedBudget || 0)),
      Committed: Math.round(Number(row.committed || 0)),
      Actual: Math.round(Number(row.actualSpend || 0)),
    }));

  // Risks scoped by the active filter, for the severity donut.
  const risksInScope = risks.filter(
    (r) => matchesProject(r.projectId) && matchesBlock(projectIdToBlockId[String(r.projectId)]) && matchesStatus(r.status)
  );
  const riskSeverityData = ["Critical", "High", "Medium", "Low"]
    .map((sev) => ({ name: sev, value: risksInScope.filter((r) => String(r.severity) === sev).length }))
    .filter((d) => d.value > 0);

  // Compliance obligations by status.
  const complianceStatusData = Object.entries(
    compliance.reduce((acc: Record<string, number>, o) => {
      const key = o.status || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }));

  // Activity status funnel.
  const activityStatusData = ["To Do", "In Progress", "Completed"]
    .map((st) => ({ name: st, value: activities.filter((a) => String(a.status) === st).length }))
    .filter((d) => d.value > 0);

  // AFE portfolio roll-up (authorised vs committed vs actual + utilisation gauge).
  const afePortfolio = allAfes.reduce(
    (acc, afe) => {
      acc.authorised += Number(afe.amount || 0);
      acc.committed += Number(afe.committedAmount || 0);
      acc.actual += Number(afe.actualToDate || 0);
      return acc;
    },
    { authorised: 0, committed: 0, actual: 0 }
  );
  const afeUtilisation = afePortfolio.authorised > 0 ? Math.round((afePortfolio.actual / afePortfolio.authorised) * 100) : 0;
  const afeGaugeData = [{ name: "Utilisation", value: Math.min(afeUtilisation, 100), fill: afeUtilisation >= 100 ? "#dc2626" : afeUtilisation >= 80 ? "#f59e0b" : "#16a34a" }];

  const hasAnalytics = budgetChartData.length > 0 || riskSeverityData.length > 0 || complianceStatusData.length > 0 || activityStatusData.length > 0 || allAfes.length > 0;

  // Document status breakdown donut.
  const documentStatusData = Object.entries(
    documents.reduce((acc: Record<string, number>, d) => {
      const key = d.status || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }));
  const DOC_STATUS_COLORS: Record<string, string> = { Draft: "#94a3b8", "Under Review": "#f59e0b", Final: "#16a34a", Superseded: "#cbd5e1" };

  // Team workload — top people by open task count (heatmap-style bar list).
  const workloadTop = [...workload]
    .filter((w) => w.name && w.name !== "Unassigned")
    .sort((a, b) => (b.openTasks || 0) - (a.openTasks || 0))
    .slice(0, 8);
  const workloadMax = workloadTop.reduce((m, w) => Math.max(m, w.openTasks || 0), 0) || 1;
  const workloadColor = (open: number) => {
    const ratio = open / workloadMax;
    if (ratio > 0.66) return "#dc2626";
    if (ratio > 0.33) return "#f59e0b";
    return "#16a34a";
  };

  // Risk heat-map: severity (rows, High→Low) × probability (cols, Low→High).
  const RISK_LEVELS = ["High", "Medium", "Low"];
  const riskWeight: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
  const riskHeatCell = (severity: string, probability: string) =>
    risksInScope.filter((r) => r.severity === severity && r.probability === probability).length;
  const riskBandColor = (severity: string, probability: string) => {
    const score = (riskWeight[severity] || 0) * (riskWeight[probability] || 0);
    if (score >= 6) return "bg-red-100 text-red-800 border-red-200";
    if (score >= 3) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };
  const hasRiskData = risksInScope.length > 0;

  // Alerts summary — counts by priority + overdue, from the notification engine.
  const alertsByPriority = ["Critical", "High", "Medium", "Low"].map((p) => ({
    priority: p,
    count: notifications.filter((n) => n.priority === p && n.status !== "Acknowledged" && n.status !== "Resolved").length,
  }));
  const overdueAlerts = notifications.filter((n) => n.dueAt && new Date(n.dueAt).getTime() < Date.now() && n.status !== "Acknowledged" && n.status !== "Resolved").length;
  const totalOpenAlerts = alertsByPriority.reduce((s, a) => s + a.count, 0);
  const ALERT_COLORS: Record<string, string> = { Critical: "text-red-600", High: "text-orange-600", Medium: "text-amber-600", Low: "text-emerald-600" };

  const auditActionColor = (action: string) => {
    if (/create/i.test(action)) return "bg-emerald-100 text-emerald-700";
    if (/delete/i.test(action)) return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  const hasSecondaryAnalytics = workloadTop.length > 0 || documentStatusData.length > 0 || hasRiskData || totalOpenAlerts > 0 || (isAdmin && auditFeed.length > 0);

  // ------------------------------------------------------------------
  // Compact top-of-page KPI strip — headline numbers at a glance, each
  // RAG-coloured so the eye can triage without reading labels. Built from
  // always-available data (blocks/projects/risks/licences/notifications);
  // richer sources (contracts/compliance) are folded in when present.
  // ------------------------------------------------------------------
  const ragText = (value: number, warn: number, bad: number, invert = false) => {
    const isBad = invert ? value <= bad : value >= bad;
    const isWarn = invert ? value <= warn : value >= warn;
    if (isBad) return "text-red-600";
    if (isWarn) return "text-amber-600";
    return "text-emerald-600";
  };

  const expiringSoonCount = [
    ...licences.filter((l) => l.status === "Active" && l.expiryDate).map((l) => daysUntil(l.expiryDate)),
    ...contracts.filter((c) => !["Expired", "Terminated"].includes(c.status) && c.expiryDate).map((c) => daysUntil(c.expiryDate)),
  ].filter((d) => d !== null && (d as number) >= 0 && (d as number) <= 30).length;

  const kpiTiles = [
    { label: "Active Blocks", value: blocks.length, color: "text-gray-900", link: "/blocks" },
    { label: "Avg Completion", value: `${chairmanAvgCompletion}%`, color: ragText(chairmanAvgCompletion, 50, 75, true), link: "/projects" },
    { label: "Budget Used", value: `${chairmanBudgetUtilisation}%`, color: ragText(chairmanBudgetUtilisation, 75, 90), link: "/finance" },
    { label: "Expiring ≤30d", value: expiringSoonCount, color: expiringSoonCount > 0 ? "text-amber-600" : "text-emerald-600", link: "/licences" },
  ];

  // ------------------------------------------------------------------
  // Portfolio Health Score — a single composite 0-100 number so an
  // executive can triage at a glance without reading every tile. Weighted:
  // completion (40%), budget discipline (30%, penalised only for overrun
  // past 100%), open-risk load (20%), overdue-alert load (10%).
  // ------------------------------------------------------------------
  const healthBudgetComponent = Math.max(0, 100 - Math.max(0, chairmanBudgetUtilisation - 100) * 2);
  const healthRiskComponent = Math.max(0, 100 - chairmanOpenRisks.length * 10 - chairmanHighRisks.length * 5);
  const healthAlertComponent = Math.max(0, 100 - overdueAlerts * 20);
  const healthScore = Math.round(
    0.4 * chairmanAvgCompletion + 0.3 * healthBudgetComponent + 0.2 * healthRiskComponent + 0.1 * healthAlertComponent
  );
  const healthLabel = healthScore >= 75 ? "Healthy" : healthScore >= 50 ? "Needs Attention" : "At Risk";
  const healthColorClass = healthScore >= 75 ? "text-emerald-600" : healthScore >= 50 ? "text-amber-600" : "text-red-600";
  const healthColorHex = healthScore >= 75 ? "#16a34a" : healthScore >= 50 ? "#f59e0b" : "#dc2626";
  const healthGaugeData = [{ value: healthScore, fill: healthColorHex }];
  const healthBgClass = healthScore >= 75 ? "bg-emerald-50 border-emerald-200" : healthScore >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  // ------------------------------------------------------------------
  // Unified deadlines list (replaces the three bulky countdown cards).
  // Chairman-authorised users get the rich cross-module list; everyone
  // else gets the always-available licence expiries in the same shape.
  // ------------------------------------------------------------------
  const licenceDeadlines = licences
    .filter((l) => l.status === "Active" && l.expiryDate)
    .map((l) => {
      const d = daysUntil(l.expiryDate);
      return {
        id: `licence-${l.id}`,
        module: "Licence",
        title: `${l.licenceType || "Licence"} ${l.licenceNumber || ""} expiry`,
        date: l.expiryDate as string | null,
        daysLeft: d,
        urgency: (d === null ? "green" : d < 30 ? "red" : d < 90 ? "amber" : "green") as "red" | "amber" | "green",
        link: "/licences",
      };
    })
    .filter((x) => x.daysLeft !== null)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));

  const unifiedDeadlines = (canSeeChairmanView ? chairmanDeadlines : licenceDeadlines).filter((d) => matchesDateRange(d.date));

  // ------------------------------------------------------------------
  // "Attention Required" panel — merges the most urgent items scattered
  // across the page (critical/high risks, Critical alerts, red-urgency
  // deadlines) into one ranked, drill-downable action list.
  // ------------------------------------------------------------------
  const attentionItems: { type: string; label: string; meta: string; link: string; tone: "red" | "amber" }[] = [
    ...filteredRisks.map((r) => ({ type: "Risk", label: r.title as string, meta: `${r.severity} severity`, link: "/registers", tone: "red" as const })),
    ...notifications
      .filter((n) => n.priority === "Critical" && n.status !== "Acknowledged" && n.status !== "Resolved")
      .map((n) => ({ type: "Alert", label: n.message as string, meta: n.module || "Notification", link: "/notifications", tone: "red" as const })),
    ...vendorInvoices
      .filter((v) => v.status !== "Paid" && v.agingBucket === "90+")
      .map((v) => ({ type: "Vendor Payment", label: `${v.vendor} (${v.invoiceNumber || `#${v.id}`})`, meta: `90+ days overdue`, link: "/vendor-payments", tone: "red" as const })),
    ...unifiedDeadlines
      .filter((d) => d.urgency === "red")
      .map((d) => ({ type: d.module, label: d.title, meta: d.daysLeft !== null && d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d left`, link: d.link, tone: "red" as const })),
  ].slice(0, 8);

  // ------------------------------------------------------------------
  // Per-block Progress & Status — one row per block with its avg project
  // completion, open-risk count, and a clickable high-severity risk count
  // that deep-links to the risk register pre-filtered to that block.
  // Risks link to a project (Risk.projectId → project.blockId), resolved
  // via projectIdToBlockId.
  // ------------------------------------------------------------------
  const perBlockSummary = blocks
    .filter((b) => matchesBlock(b.id))
    .map((b) => {
      const blockProjects = projects.filter((p) => String(p.blockId) === String(b.id));
      const avgCompletion = blockProjects.length
        ? Math.round(blockProjects.reduce((s, p) => s + Number(p.completion || 0), 0) / blockProjects.length)
        : 0;
      const blockRisks = risks.filter(
        (r) => String(projectIdToBlockId[String(r.projectId)]) === String(b.id) && r.status !== "Closed" && r.status !== "Mitigated"
      );
      const highRisks = blockRisks.filter((r) => r.severity === "High" || r.severity === "Critical").length;
      return { id: b.id, name: b.name, status: b.status, avgCompletion, openRisks: blockRisks.length, highRisks };
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Executive Dashboard</h1>
          <p className="text-gray-500 mt-1">Executive overview and key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFiltersOpen(true)} className="gap-2 relative">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 h-4 min-w-4">{activeFilterCount}</Badge>
            )}
          </Button>
          {!isGuest && (
            <Link to="/operational">
              <Button variant="outline">Switch to Operational View</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters — floats over the dashboard instead of taking up permanent
          vertical space; opened via the "Filters" button in the header. */}
      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-20 px-4"
          onClick={() => setFiltersOpen(false)}
        >
          <Card className="w-full max-w-3xl p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
              <div className="ml-auto flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-gray-500">
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={exportBlocksCsv} className="gap-1">
                  <Download className="h-3.5 w-3.5" />
                  Export blocks (CSV)
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(false)} className="gap-1">
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
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
        </div>
      )}

      {/* KPI header — headline numbers (no longer sticky). */}
      {/* Portfolio Health Score + compact KPI strip — headline numbers at a
          glance, RAG-coloured. All cards are clickable and route to the
          relevant detail page. */}
      <div className="flex flex-col lg:flex-row gap-2">
        <Link to="/registers" className="block h-full lg:w-64 shrink-0">
          <Card className={`p-1.5 flex items-center gap-2 h-full border shadow-sm hover:shadow-md transition-shadow ${healthBgClass}`}>
            <div className="relative w-12 h-12 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={healthGaugeData} startAngle={90} endAngle={-270}>
                  <RadialBar background dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-extrabold ${healthColorClass}`}>{healthScore}</span>
              </div>
            </div>
            <div className="min-w-0 grid items-center flex-1">
              <p className="text-xs font-medium text-gray-500 leading-tight truncate">Portfolio Health</p>
              {/* <p className={`text-sm font-bold truncate leading-tight text-right ${healthColorClass}`}>{healthLabel}</p> */}
            </div>
          </Card>
        </Link>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {kpiTiles.map((tile) => (
            <Link key={tile.label} to={tile.link} className="block h-full">
              <Card className="p-1.5 h-full flex flex-col justify-center hover:bg-gray-50 transition-colors">
                <p className="text-sm text-gray-500 truncate leading-tight">{tile.label}</p>
                <p className={`text-lg font-semibold leading-tight ${tile.color}`}>{tile.value}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Attention Required + Licence Action Required — share one row so
          neither pushes the other, and both charts/matrices below, further
          down the page. */}
      {(attentionItems.length > 0 || topExpiringLicence) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
          {attentionItems.length > 0 && (
            <div className="relative h-full">
              <Card className="border-red-200 overflow-hidden h-full flex flex-col">
                <button
                  type="button"
                  onClick={() => setAttentionOpen((o) => !o)}
                  className="w-full flex flex-col gap-1 p-4 text-left hover:bg-red-50/50"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700">Attention Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">{attentionItems.length}</Badge>
                    {!attentionOpen && (
                      <span className="text-xs text-gray-500 truncate ml-1">
                        — {attentionItems[0].label}
                      </span>
                    )}
                    {attentionOpen ? <ChevronUp className="h-4 w-4 ml-auto text-gray-400" /> : <ChevronDown className="h-4 w-4 ml-auto text-gray-400" />}
                  </div>
                </button>
              </Card>

              {/* Expanded list renders as a floating overlay so it never pushes
                  the row (and the Licence card) taller. */}
              {attentionOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAttentionOpen(false)} />
                  <div className="absolute left-0 right-0 top-full mt-2 z-50">
                    <Card className="border-red-200 shadow-xl max-h-[70vh] overflow-y-auto p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {attentionItems.map((item, i) => (
                          <Link
                            key={`${item.type}-${i}`}
                            to={item.link}
                            className="flex items-center justify-between gap-3 p-2 rounded-md border bg-red-50/40 hover:bg-red-50 text-sm"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="text-[10px] uppercase font-semibold text-red-700 shrink-0">{item.type}</span>
                              <span className="truncate text-gray-800">{item.label}</span>
                            </div>
                            <span className="text-xs text-red-600 whitespace-nowrap shrink-0">{item.meta}</span>
                          </Link>
                        ))}
                      </div>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Top Expirable Licence Widget */}
          {topExpiringLicence && (
            <Card className="p-4 bg-orange-50 border-orange-200 shadow-sm h-full flex flex-col md:flex-row items-center justify-between gap-4">
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
        </div>
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

      {/* Analytics / Operations / Assets / Risk & Actions — tabbed instead of
          stacked, so charts, matrices and action panels share one screen
          instead of pushing each other below the fold. Shares the row with
          the Executive Summary card (right half) for Chairman/Board users. */}
      <div className={canSeeChairmanView ? "grid grid-cols-1 lg:grid-cols-2 gap-4 items-start" : "block"}>
      <div className="min-w-0">
      <Tabs value={dashboardTab} onValueChange={setDashboardTab}>
        <TabsList>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
          <TabsTrigger value="operations" className="gap-1.5"><Grid3x3 className="h-4 w-4" />Operations</TabsTrigger>
          <TabsTrigger value="assets" className="gap-1.5"><Package className="h-4 w-4" />Assets</TabsTrigger>
          <TabsTrigger value="risk-actions" className="gap-1.5"><AlertCircle className="h-4 w-4" />Risk &amp; Actions</TabsTrigger>
        </TabsList>

      <TabsContent value="analytics" className="mt-3">
      {/* Analytics & Insights — recharts visualisations from live data (§5.8) */}
      {hasAnalytics && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <h2 className="text-xl font-bold">Analytics &amp; Insights</h2>
            {hasActiveFilters && <Badge variant="outline" className="text-xs">filtered</Badge>}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Budget vs Actual by block/currency */}
            {budgetChartData.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold">Budget vs Actual by Block</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={budgetChartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={currencyFmt} />
                    <RechartsTooltip formatter={(v: any) => Number(v).toLocaleString()} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Approved" fill="#2563eb" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Committed" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Actual" fill="#16a34a" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* AFE portfolio — authorised vs committed vs actual + utilisation gauge */}
            {allAfes.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-semibold">AFE Portfolio — Actuals vs Authorised</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Authorised</p>
                      <p className="text-lg font-semibold">{afePortfolio.authorised.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Committed</p>
                      <p className="text-lg font-semibold text-amber-600">{afePortfolio.committed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Actual to Date</p>
                      <p className="text-lg font-semibold text-emerald-600">{afePortfolio.actual.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                      <RadialBarChart innerRadius="70%" outerRadius="100%" data={afeGaugeData} startAngle={90} endAngle={-270}>
                        <RadialBar background dataKey="value" cornerRadius={8} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold">{afeUtilisation}%</span>
                      <span className="text-xs text-gray-500">utilisation</span>
                    </div>
                  </div>
                </div>
                <Link to="/finance" className="mt-2 inline-block text-sm text-blue-600 hover:underline">View AFE register →</Link>
              </Card>
            )}

            {/* Risk distribution by severity */}
            {/* {riskSeverityData.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  <h3 className="font-semibold">Risk Distribution by Severity</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={riskSeverityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {riskSeverityData.map((entry) => (
                        <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )} */}

            {/* Compliance status breakdown — horizontal stacked bar (denser
                than a donut + legend for a handful of status categories) */}
            {/* {complianceStatusData.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-semibold">Compliance Obligations by Status</h3>
                </div>
                <StackedStatusBar
                  data={complianceStatusData}
                  colorMap={Object.fromEntries(complianceStatusData.map((d, i) => [d.name, STATUS_COLORS[d.name] || CHART_COLORS[i % CHART_COLORS.length]]))}
                />
              </Card>
            )} */}

            {/* Activity status funnel */}
            {/* {activityStatusData.length > 0 && (
              <Card className="p-5 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold">Activity Status Breakdown</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={activityStatusData} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                    <RechartsTooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {activityStatusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#2563eb"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )} */}
          </div>
        </div>
      )}
      </TabsContent>

      <TabsContent value="operations" className="mt-3">
      {/* Operational Insights — workload, risk heat-map, document status,
          alerts and the audit activity feed (§5.8 catalogue quick-wins). */}
      {hasSecondaryAnalytics && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Grid3x3 className="h-5 w-5 text-gray-500" />
            <h2 className="text-xl font-bold">Operational Insights</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Team workload heatmap */}
            {workloadTop.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold">Team Workload (open tasks)</h3>
                  </div>
                  <Link to="/tasks" className="text-sm text-blue-600 hover:underline">View →</Link>
                </div>
                <div className="space-y-2.5">
                  {workloadTop.map((w) => (
                    <div key={w.userId ?? w.name} className="flex items-center gap-3">
                      <span className="w-32 truncate text-sm" title={w.name}>{w.name}</span>
                      <div className="flex-1 h-5 rounded bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded flex items-center justify-end pr-2"
                          style={{ width: `${Math.max((w.openTasks / workloadMax) * 100, 8)}%`, backgroundColor: workloadColor(w.openTasks) }}
                        >
                          <span className="text-[11px] font-semibold text-white">{w.openTasks}</span>
                        </div>
                      </div>
                      {w.overdueTasks > 0 && (
                        <Badge className="bg-red-100 text-red-700 border border-red-200 text-[11px]">{w.overdueTasks} overdue</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Risk heat-map (severity × probability) */}
            {hasRiskData && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                  <h3 className="font-semibold">Risk Heat-Map (severity × probability)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-1 text-center text-sm">
                    <thead>
                      <tr>
                        <th className="text-xs text-gray-400 font-normal"></th>
                        {RISK_LEVELS.slice().reverse().map((p) => (
                          <th key={p} className="text-xs text-gray-500 font-medium px-2 py-1">P: {p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RISK_LEVELS.map((sev) => (
                        <tr key={sev}>
                          <td className="text-xs text-gray-500 font-medium pr-2 text-right whitespace-nowrap">S: {sev}</td>
                          {RISK_LEVELS.slice().reverse().map((prob) => {
                            const count = riskHeatCell(sev, prob);
                            return (
                              <td key={prob} className="p-0">
                                <Link
                                  to="/registers"
                                  className={`flex items-center justify-center h-12 rounded border font-semibold ${riskBandColor(sev, prob)} ${count === 0 ? "opacity-40" : "hover:opacity-80"}`}
                                >
                                  {count}
                                </Link>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-3">Green = low band · Amber = medium · Red = high (severity × probability). Click a cell to open the register.</p>
              </Card>
            )}

            {/* Recent activity feed (Admin only — sourced from the audit log) */}
            {isAdmin && auditFeed.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold">Recent Activity</h3>
                  </div>
                  <Link to="/admin" className="text-sm text-blue-600 hover:underline">Audit log →</Link>
                </div>
                <div className="space-y-2">
                  {auditFeed.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 text-sm border-b last:border-0 pb-2 last:pb-0">
                      <Badge className={`text-[11px] ${auditActionColor(log.action || "")}`}>{log.action || "update"}</Badge>
                      <span className="flex-1 truncate">
                        <span className="font-medium">{log.module || log.entityType}</span>
                        {log.entityId ? <span className="text-gray-400"> #{log.entityId}</span> : null}
                        <span className="text-gray-500"> — {log.userEmail || `user ${log.userId ?? "system"}`}</span>
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
      </TabsContent>

      <TabsContent value="assets" className="mt-3">
      {/* Sleek Asset Health Matrix */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Asset Health Matrix</h2>
          {loadingBlocks && <span className="text-sm text-gray-500 animate-pulse">Loading...</span>}
        </div>

        {blockError ? (
          <Card className="p-4 bg-red-50 border border-red-200">
            <p className="text-red-700">{blockError}</p>
          </Card>
        ) : blocks.length === 0 ? (
          <Card className="p-4">
            <p className="text-gray-600">No blocks found in the database.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredBlocks.map((block) => {
              const isActive = block.status === "Active";
              return (
                <Link to={`/blocks/${block.id}`} key={block.id}>
                  <Card className={`p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-l-4 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-3 ${isActive ? 'border-l-emerald-500 bg-white' : 'border-l-slate-300 bg-slate-50'}`}>
                    <div className="sm:w-[45%] min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-800 truncate pr-2" title={block.name}>{block.name}</h3>
                        <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 shrink-0' : 'shrink-0'}>
                          {block.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="sm:w-[55%] min-w-0 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Operator</span>
                        <span className="font-medium text-right truncate max-w-[150px]">{block.operator || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Area</span>
                        <span className="font-medium">{block.area || '-'}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      </TabsContent>

      <TabsContent value="risk-actions" className="mt-3">
      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-4">
        {/* Critical Risks Panel */}
        <Card className="p-5 border-l-4 border-l-red-500 shadow-sm flex flex-col h-full">
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
        <Card className="p-5">
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
      </TabsContent>
      </Tabs>
      </div>

      {/* Executive Summary — Progress & Status combined with the One-Click
          Summary narrative. Occupies the right half of the row alongside the
          Analytics/Operations/Assets/Risk & Actions tabs. Restricted to the
          Chairman/Board role and any explicitly delegated executives via the
          configurable RBAC matrix (chairman_view.access). */}
      <div className="min-w-0">
      {canSeeChairmanView && (
        <Card className="p-5 border-2 border-amber-200 bg-amber-50/30 print:border-0 print:bg-white">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="text-2xl flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-500" />
              Executive Summary
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
            <p className="text-sm text-gray-500">Loading executive summary...</p>
          ) : (
            <div className="space-y-4">
              {/* Progress & Status */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <ListChecks className="h-4 w-4 text-blue-500" />
                  Progress &amp; Status
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

                {/* Per-block breakdown — status, completion and a clickable
                    high-severity risk count per block, deep-linking to the
                    risk register pre-filtered to that block. */}
                {perBlockSummary.length > 0 && (
                  <div className="mt-4 rounded-md border bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                          <th className="px-3 py-2 font-medium">Block</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium">Completion</th>
                          <th className="px-3 py-2 font-medium">Open Risks</th>
                          <th className="px-3 py-2 font-medium">High-Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perBlockSummary.map((b) => (
                          <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <Link to={`/blocks/${b.id}`} className="font-medium text-gray-800 hover:underline">{b.name}</Link>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-xs">{b.status}</Badge>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <Progress value={b.avgCompletion} className="h-1.5 flex-1" />
                                <span className="text-xs text-gray-500 w-9 shrink-0">{b.avgCompletion}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-gray-600">{b.openRisks}</td>
                            <td className="px-3 py-2">
                              {b.highRisks > 0 ? (
                                <Link
                                  to={`/registers/1?blockId=${b.id}&severity=High`}
                                  className="inline-flex items-center gap-1 text-red-600 font-semibold hover:underline"
                                >
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  {b.highRisks}
                                </Link>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* One-Click Summary — auto-generated narrative combined
                    into the same Progress & Status block. */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    One-Click Summary
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-700">{chairmanSummaryText}</p>
                  {chairmanHighRisks.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {chairmanHighRisks.length} high-severity risk(s) require attention.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
      </div>
      </div>

      {/* Upcoming Deadlines — consolidated table (replaces the three bulky
          countdown cards): more items in a fraction of the vertical space.
          Moved to the bottom of the page per feedback. */}
      {unifiedDeadlines.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Upcoming Deadlines</h2>
            <div className="ml-auto flex gap-2">
              <Badge className="bg-red-100 text-red-700 border border-red-300 text-xs">{unifiedDeadlines.filter((d) => d.urgency === "red").length} Red</Badge>
              <Badge className="bg-amber-100 text-amber-700 border border-amber-300 text-xs">{unifiedDeadlines.filter((d) => d.urgency === "amber").length} Amber</Badge>
            </div>
          </div>
          <div className="divide-y">
            {unifiedDeadlines.slice(0, 10).map((d) => (
              <Link
                key={d.id}
                to={d.link}
                className="flex items-center justify-between gap-3 py-2 text-sm hover:bg-gray-50 -mx-2 px-2 rounded"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${d.urgency === "red" ? "bg-red-500" : d.urgency === "amber" ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <span className="text-[10px] uppercase font-semibold text-gray-400 shrink-0 w-24 truncate">{d.module}</span>
                  <span className="truncate text-gray-800">{d.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-500 hidden sm:inline">{d.date ? formatDisplayDateOrDefault(d.date) : ""}</span>
                  <span className={`text-xs font-medium whitespace-nowrap ${d.urgency === "red" ? "text-red-600" : d.urgency === "amber" ? "text-amber-600" : "text-emerald-600"}`}>
                    {d.daysLeft !== null && d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d left`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

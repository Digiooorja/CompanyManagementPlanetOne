import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../components/ui/dialog";
import {
  ScrollText,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  Building2,
  Search,
  Upload,
  Eye,
  Download,
  FileText,
  Link2,
  GitBranch
} from "lucide-react";
import { licencesApi, blocksApi, documentsApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

// -----------------------------------------------------------------------
// Utility: compute days until expiry (negative = already expired)
// -----------------------------------------------------------------------
function daysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// -----------------------------------------------------------------------
// Utility: determine card colour theme by expiry proximity
//   > 60 days  → green
//   31–60 days → amber/orange
//   1–30 days  → red
//   expired    → maroon/dark-red
// -----------------------------------------------------------------------
function getExpiryTheme(days: number | null): {
  border: string;
  bg: string;
  badge: string;
  label: string;
  icon: React.ReactNode;
} {
  if (days === null) {
    return { border: "border-slate-200", bg: "bg-white", badge: "bg-slate-100 text-slate-600", label: "No Expiry Set", icon: <Clock className="h-4 w-4 text-slate-400" /> };
  }
  if (days < 0) {
    return { border: "border-red-900", bg: "bg-red-50", badge: "bg-red-900 text-white", label: "Expired", icon: <XCircle className="h-4 w-4 text-red-900" /> };
  }
  if (days <= 30) {
    return { border: "border-red-500", bg: "bg-red-50", badge: "bg-red-500 text-white", label: `${days}d remaining`, icon: <AlertTriangle className="h-4 w-4 text-red-500" /> };
  }
  if (days <= 60) {
    return { border: "border-orange-400", bg: "bg-orange-50", badge: "bg-orange-400 text-white", label: `${days}d remaining`, icon: <AlertTriangle className="h-4 w-4 text-orange-500" /> };
  }
  return { border: "border-emerald-400", bg: "bg-white", badge: "bg-emerald-100 text-emerald-700", label: `${days}d remaining`, icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> };
}

const LICENCE_STATUSES = ["Active", "Suspended", "Renewed"];
const LICENCE_PHASES = ["Exploration", "Extension", "Appraisal", "Development", "Production"];

// -----------------------------------------------------------------------
// Empty form state factory
// -----------------------------------------------------------------------
function emptyForm() {
  return {
    licenceNumber: "",
    licenceType: "",
    blockIds: [] as number[],
    issuedBy: "",
    startDate: "",
    expiryDate: "",
    status: "Active",
    notes: "",
    phase: "",
    phaseStartDate: "",
    phaseEndDate: "",
    minWorkObligation: "",
  };
}

export function Licences() {
  const { canEdit, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const [licences, setLicences] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLicence, setSelectedLicence] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [licenceDocuments, setLicenceDocuments] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [linkingDocId, setLinkingDocId] = useState('');
  const [linkingDoc, setLinkingDoc] = useState(false);

  // Controlled Phase Transition dialog (§5.9) — the only way `phase` can
  // change once initially set; requires a mandatory sign-off comment.
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [transitioningLicence, setTransitioningLicence] = useState<any | null>(null);
  const [transitionForm, setTransitionForm] = useState({
    newPhase: "",
    phaseStartDate: "",
    phaseEndDate: "",
    minWorkObligation: "",
    comment: "",
    confirmed: false,
  });
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const openTransition = (licence: any) => {
    setTransitioningLicence(licence);
    setTransitionError(null);
    setTransitionForm({
      newPhase: "",
      phaseStartDate: licence.phaseEndDate ? String(licence.phaseEndDate).slice(0, 10) : "",
      phaseEndDate: "",
      minWorkObligation: licence.minWorkObligation || "",
      comment: "",
      confirmed: false,
    });
    setIsTransitionOpen(true);
  };

  const handleTransitionPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitioningLicence) return;
    setTransitioning(true);
    setTransitionError(null);
    try {
      await licencesApi.transitionPhase(transitioningLicence.id, {
        newPhase: transitionForm.newPhase,
        phaseStartDate: transitionForm.phaseStartDate || undefined,
        phaseEndDate: transitionForm.phaseEndDate || undefined,
        minWorkObligation: transitionForm.minWorkObligation || undefined,
        comment: transitionForm.comment,
        confirmed: true,
      });
      setIsTransitionOpen(false);
      loadData();
    } catch (err: any) {
      setTransitionError(err.message || "Failed to transition licence phase.");
    } finally {
      setTransitioning(false);
    }
  };

  const loadDocuments = async (licId: number) => {
    setLoadingDocs(true);
    try {
      const [docs, allDocs] = await Promise.all([
        documentsApi.getByLicenceId(licId),
        documentsApi.getAll(),
      ]);
      setLicenceDocuments(Array.isArray(docs) ? docs : []);
      setAllDocuments(Array.isArray(allDocs) ? allDocs : []);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Trigger edit mode if URL parameter "edit" matches a licence ID/number
  useEffect(() => {
    if (!loading && licences.length > 0) {
      const editParam = searchParams.get("edit");
      if (editParam) {
        const found = licences.find(
          (l) =>
            String(l.id) === editParam ||
            String(l.licenceNumber).toLowerCase() === editParam.toLowerCase()
        );
        if (found && canEdit) {
          setSelectedLicence(found);
          setForm({
            licenceNumber: found.licenceNumber || "",
            licenceType: found.licenceType || "",
            blockIds: Array.isArray(found.blockIds) ? found.blockIds.map(Number) : [],
            issuedBy: found.issuedBy || "",
            startDate: found.startDate ? String(found.startDate).slice(0, 10) : "",
            expiryDate: found.expiryDate ? String(found.expiryDate).slice(0, 10) : "",
            status: found.status || "Active",
            notes: found.notes || "",
            phase: found.phase || "",
            phaseStartDate: found.phaseStartDate ? String(found.phaseStartDate).slice(0, 10) : "",
            phaseEndDate: found.phaseEndDate ? String(found.phaseEndDate).slice(0, 10) : "",
            minWorkObligation: found.minWorkObligation || "",
          });
          setIsEditOpen(true);
          loadDocuments(found.id);
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("edit");
          setSearchParams(newParams, { replace: true });
        }
      }
    }
  }, [loading, licences, searchParams, canEdit, setSearchParams]);

  // Automatically clear search filter from URL and state when edit/add dialog is closed
  useEffect(() => {
    if (!isEditOpen && !isAddOpen) {
      const searchParam = searchParams.get("search");
      if (searchParam) {
        setSearchQuery("");
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("search");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [isEditOpen, isAddOpen, searchParams, setSearchParams]);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [licData, blockData] = await Promise.all([
        licencesApi.getAll(),
        blocksApi.getAll(),
      ]);
      setLicences(Array.isArray(licData) ? licData : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load licence data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -----------------------------------------------------------------------
  // Derived summary stats
  // -----------------------------------------------------------------------
  const totalActive = licences.filter((l) => l.status === "Active").length;
  const expiringWithin60 = licences.filter((l) => {
    const d = daysUntilExpiry(l.expiryDate);
    return d !== null && d >= 0 && d <= 60;
  }).length;
  const expired = licences.filter((l) => {
    const d = daysUntilExpiry(l.expiryDate);
    return d !== null && d < 0;
  }).length;

  // -----------------------------------------------------------------------
  // Block selector helper: toggle a block ID inside the form array
  // -----------------------------------------------------------------------
  const toggleBlock = (blockId: number) => {
    setForm((prev) => {
      const exists = prev.blockIds.includes(blockId);
      return {
        ...prev,
        blockIds: exists
          ? prev.blockIds.filter((id) => id !== blockId)
          : [...prev.blockIds, blockId],
      };
    });
  };

  // -----------------------------------------------------------------------
  // Dialog openers
  // -----------------------------------------------------------------------
  const openAdd = () => {
    setForm(emptyForm());
    setIsAddOpen(true);
  };

  const openEdit = (licence: any) => {
    setSelectedLicence(licence);
    setForm({
      licenceNumber: licence.licenceNumber || "",
      licenceType: licence.licenceType || "",
      blockIds: Array.isArray(licence.blockIds) ? licence.blockIds.map(Number) : [],
      issuedBy: licence.issuedBy || "",
      startDate: licence.startDate ? String(licence.startDate).slice(0, 10) : "",
      expiryDate: licence.expiryDate ? String(licence.expiryDate).slice(0, 10) : "",
      status: licence.status || "Active",
      notes: licence.notes || "",
      phase: licence.phase || "",
      phaseStartDate: licence.phaseStartDate ? String(licence.phaseStartDate).slice(0, 10) : "",
      phaseEndDate: licence.phaseEndDate ? String(licence.phaseEndDate).slice(0, 10) : "",
      minWorkObligation: licence.minWorkObligation || "",
    });
    setIsEditOpen(true);
    loadDocuments(licence.id);
  };

  // -----------------------------------------------------------------------
  // CRUD handlers
  // -----------------------------------------------------------------------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      await licencesApi.create({
        ...form,
        startDate: form.startDate || null,
        expiryDate: form.expiryDate || null,
      });
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create licence.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicence) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await licencesApi.update(selectedLicence.id, {
        ...form,
        startDate: form.startDate || null,
        expiryDate: form.expiryDate || null,
      });
      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update licence.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, licenceNumber: string) => {
    if (!confirm(`Permanently delete licence "${licenceNumber}"? This action cannot be undone.`)) return;
    try {
      await licencesApi.delete(id);
      loadData();
    } catch (err: any) {
      alert("Failed to delete: " + (err.message || err));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedLicence) return;
    const file = e.target.files[0];
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("documentType", "Licence");
      formData.append("licenceId", String(selectedLicence.id));
      await documentsApi.upload(formData);
      await loadDocuments(selectedLicence.id);
    } catch (err) {
      alert("Failed to upload document");
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDownloadDoc = async (id: number, type: 'download' | 'preview') => {
    try {
      const presigned = await documentsApi.getPresignedUrl(id, type);
      window.open(presigned.url, '_blank');
    } catch (err) {
      alert(`Failed to ${type} document`);
    }
  };

  const handleLinkDocument = async () => {
    if (!linkingDocId || !selectedLicence) return;
    setLinkingDoc(true);
    try {
      await documentsApi.update(Number(linkingDocId), { licenceId: selectedLicence.id });
      setLinkingDocId('');
      await loadDocuments(selectedLicence.id);
    } catch (err) {
      alert('Failed to link document. Please try again.');
    } finally {
      setLinkingDoc(false);
    }
  };

  // -----------------------------------------------------------------------
  // Shared form body rendered inside both Add and Edit dialogs
  // -----------------------------------------------------------------------
  const renderFormBody = (isEditing = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Licence Number *</label>
          <Input
            required
            placeholder="e.g. EXP-DW-2024-001"
            value={form.licenceNumber}
            onChange={(e) => setForm((p) => ({ ...p, licenceNumber: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Licence Name *</label>
          <Input
            required
            placeholder="e.g. Deep Water Exploration"
            value={form.licenceType}
            onChange={(e) => setForm((p) => ({ ...p, licenceType: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Issuing Company</label>
        <Input
          placeholder="e.g. Ministry of Petroleum"
          value={form.issuedBy}
          onChange={(e) => setForm((p) => ({ ...p, issuedBy: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Start Date</label>
          <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Expiry Date</label>
          <Input type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</label>
          <select
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            {LICENCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Licence Phase (§5.9) — editable on creation (establishing the initial
          state); once a licence exists, changing phase requires the audited
          Transition Phase action instead of a plain field edit. */}
      <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Licence Phase</label>
          {isEditing && (
            <span className="text-xs text-slate-400">Use “Transition Phase” to change</span>
          )}
        </div>
        {isEditing ? (
          <p className="text-sm text-slate-700">{form.phase || "Not yet set"}</p>
        ) : (
          <select
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.phase}
            onChange={(e) => setForm((p) => ({ ...p, phase: e.target.value }))}
          >
            <option value="">— Not set —</option>
            {LICENCE_PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phase Start</label>
            <Input
              type="date"
              disabled={isEditing}
              value={form.phaseStartDate}
              onChange={(e) => setForm((p) => ({ ...p, phaseStartDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phase End (countdown)</label>
            <Input
              type="date"
              disabled={isEditing}
              value={form.phaseEndDate}
              onChange={(e) => setForm((p) => ({ ...p, phaseEndDate: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Minimum Work Obligation</label>
          <textarea
            rows={2}
            disabled={isEditing}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:text-slate-500"
            placeholder="e.g. 2 exploration wells, 500km 2D seismic"
            value={form.minWorkObligation}
            onChange={(e) => setForm((p) => ({ ...p, minWorkObligation: e.target.value }))}
          />
        </div>
      </div>

      {/* Multi-block selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Covered Blocks <span className="text-slate-400 font-normal normal-case">(select all that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[48px]">
          {blocks.map((block) => {
            const selected = form.blockIds.includes(Number(block.id));
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => toggleBlock(Number(block.id))}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${selected
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                  }`}
              >
                {block.name}
              </button>
            );
          })}
          {blocks.length === 0 && (
            <span className="text-xs text-slate-400 self-center">No blocks available</span>
          )}
        </div>
        {form.blockIds.length > 0 && (
          <p className="text-xs text-slate-500">{form.blockIds.length} block(s) selected</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Notes / Conditions</label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Renewal conditions, special clauses, regulatory requirements..."
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />
      </div>
    </div>
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading licence registry...</p>
      </div>
    );
  }

  const filteredLicences = licences.filter((lic) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      String(lic.licenceNumber).toLowerCase().includes(q) ||
      String(lic.licenceType).toLowerCase().includes(q) ||
      String(lic.issuedBy).toLowerCase().includes(q) ||
      (Array.isArray(lic.blockNames) && lic.blockNames.some((name: string) => String(name).toLowerCase().includes(q))) ||
      String(lic.status).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Licence Registry</h1>
          <p className="text-slate-500 mt-1">
            Track and manage all regulatory licences, permits, and contracts across concession blocks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {canEdit && (
            <Button onClick={openAdd} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white">
              <Plus className="h-4 w-4" />
              Add Licence
            </Button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <Card className="p-4 bg-red-50 border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span><strong>Error:</strong> {errorMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMsg(null)} className="text-red-700 hover:bg-red-100">Dismiss</Button>
        </Card>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-emerald-400">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Active</p>
            <p className="text-2xl font-bold text-slateald-900">{totalActive}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-orange-400">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Expiring within 60 days</p>
            <p className="text-2xl font-bold text-orange-600">{expiringWithin60}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-red-800">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-800" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Expired</p>
            <p className="text-2xl font-bold text-red-800">{expired}</p>
          </div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search licences by number, name, authority or block..."
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              const newParams = new URLSearchParams(searchParams);
              if (val) {
                newParams.set("search", val);
              } else {
                newParams.delete("search");
              }
              setSearchParams(newParams, { replace: true });
            }}
          />
        </div>
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-md w-fit">
            <span>Showing search results for <strong>"{searchQuery}"</strong></span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("search");
                setSearchParams(newParams, { replace: true });
              }}
              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-xs ml-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Licence Cards Grid */}
      {filteredLicences.length === 0 ? (
        <Card className="p-12 text-center">
          <ScrollText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-1">No licences found</h3>
          <p className="text-slate-400 text-sm mb-4">Start building your licence registry by adding the first record or clearing your search.</p>
          {canEdit && (
            <Button onClick={openAdd} className="bg-slate-900 hover:bg-slate-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add First Licence
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredLicences.map((licence) => {
            const days = daysUntilExpiry(licence.expiryDate);
            const theme = getExpiryTheme(days);
            const phaseDays = daysUntilExpiry(licence.phaseEndDate);
            const phaseTheme = licence.phaseEndDate ? getExpiryTheme(phaseDays) : null;
            const blockNames: string[] = Array.isArray(licence.blockNames) ? licence.blockNames : [];

            return (
              <Card
                key={licence.id}
                className={`p-5 border-2 ${theme.border} ${theme.bg} transition-all duration-200 hover:shadow-lg relative flex flex-col gap-3`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <ScrollText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <h3 className="font-bold text-slate-900 truncate text-base">{licence.licenceNumber}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {licence.licenceType}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {licence.status}
                      </span>
                    </div>
                  </div>
                  {/* Expiry urgency badge */}
                  <span className={`ml-2 flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${theme.badge}`}>
                    {theme.icon}
                    {theme.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-sm text-slate-600">
                  {licence.issuedBy && (
                    <p><span className="font-medium text-slate-700">Issued by:</span> {licence.issuedBy}</p>
                  )}
                  {licence.startDate && (
                    <p><span className="font-medium text-slate-700">Start:</span> {new Date(licence.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  )}
                  {licence.expiryDate && (
                    <p><span className="font-medium text-slate-700">Expiry:</span> {new Date(licence.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  )}
                </div>

                {/* Phase countdown (§5.9) */}
                {licence.phase && (
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GitBranch className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 truncate">{licence.phase} phase</span>
                    </div>
                    {phaseTheme && (
                      <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${phaseTheme.badge}`}>
                        {phaseTheme.icon}
                        {phaseTheme.label}
                      </span>
                    )}
                  </div>
                )}
                {licence.minWorkObligation && (
                  <p className="text-xs text-slate-500"><span className="font-medium text-slate-700">Min. work obligation:</span> {licence.minWorkObligation}</p>
                )}

                {/* Covered blocks */}
                {blockNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 self-center flex-shrink-0" />
                    {blockNames.map((name, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium">
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {licence.notes && (
                  <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2 line-clamp-2">
                    {licence.notes}
                  </p>
                )}

                {/* Action buttons */}
                {canEdit && (
                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(licence)}
                      className="flex items-center gap-1 text-xs flex-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTransition(licence)}
                      className="flex items-center gap-1 text-xs flex-1"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      Transition Phase
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(licence.id, licence.licenceNumber)}
                        className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Licence Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Register New Licence
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {renderFormBody(false)}
            <DialogFooter className="gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Register Licence
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Licence Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Licence
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {renderFormBody(true)}
            
            {/* Attached Documents Section (Moved above footer) */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-slate-500" />
                  Attached Documents
                </h4>
                <div>
                  <input
                    type="file"
                    id="licence-doc-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.getElementById('licence-doc-upload')?.click()}
                    disabled={uploadingDoc}
                    className="h-8"
                  >
                    {uploadingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                    {uploadingDoc ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              </div>

              {/* Link existing document from the library */}
              <div className="flex gap-2 mb-3">
                <select
                  className="flex-1 h-8 text-sm border border-slate-200 rounded-md px-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={linkingDocId}
                  onChange={(e) => setLinkingDocId(e.target.value)}
                >
                  <option value="">— Link an existing library document —</option>
                  {allDocuments
                    .filter(doc => !licenceDocuments.some(ld => ld.id === doc.id))
                    .map(doc => (
                      <option key={doc.id} value={String(doc.id)}>
                        {doc.title || doc.filename}
                      </option>
                    ))
                  }
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLinkDocument}
                  disabled={!linkingDocId || linkingDoc}
                  className="h-8 shrink-0"
                >
                  {linkingDoc
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <><Link2 className="h-3.5 w-3.5 mr-1" />Link</>
                  }
                </Button>
              </div>
              
              <div className="space-y-2">
                {loadingDocs ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
                ) : licenceDocuments.length === 0 ? (
                  <div className="text-center p-4 bg-slate-50 border border-dashed rounded text-sm text-slate-500">
                    No documents attached to this licence yet.
                  </div>
                ) : (
                  licenceDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">{doc.title || doc.filename}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDownloadDoc(doc.id, 'preview')}>
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDownloadDoc(doc.id, 'download')}>
                          <Download className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-slate-200 mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transition Phase Dialog (§5.9) — the only path to change `phase`;
          requires a mandatory sign-off comment + explicit confirmation. */}
      <Dialog open={isTransitionOpen} onOpenChange={setIsTransitionOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Transition Licence Phase
            </DialogTitle>
          </DialogHeader>
          {transitioningLicence && (
            <form onSubmit={handleTransitionPhase} className="space-y-4">
              <p className="text-sm text-slate-600">
                {transitioningLicence.licenceNumber} — currently{" "}
                <span className="font-semibold">{transitioningLicence.phase || "no phase set"}</span>
              </p>

              {transitionError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-sm text-red-700">{transitionError}</div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">New Phase *</label>
                <select
                  required
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={transitionForm.newPhase}
                  onChange={(e) => setTransitionForm((p) => ({ ...p, newPhase: e.target.value }))}
                >
                  <option value="">— Select new phase —</option>
                  {LICENCE_PHASES.filter((p) => p !== transitioningLicence.phase).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phase Start</label>
                  <Input
                    type="date"
                    value={transitionForm.phaseStartDate}
                    onChange={(e) => setTransitionForm((p) => ({ ...p, phaseStartDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phase End (countdown)</label>
                  <Input
                    type="date"
                    value={transitionForm.phaseEndDate}
                    onChange={(e) => setTransitionForm((p) => ({ ...p, phaseEndDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Minimum Work Obligation</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="e.g. 1 appraisal well within 12 months"
                  value={transitionForm.minWorkObligation}
                  onChange={(e) => setTransitionForm((p) => ({ ...p, minWorkObligation: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Sign-off Comment *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Rationale for the transition, regulatory approval reference, etc."
                  value={transitionForm.comment}
                  onChange={(e) => setTransitionForm((p) => ({ ...p, comment: e.target.value }))}
                />
              </div>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={transitionForm.confirmed}
                  onChange={(e) => setTransitionForm((p) => ({ ...p, confirmed: e.target.checked }))}
                />
                I confirm this phase transition is approved and this action will be recorded against my user account.
              </label>

              <DialogFooter className="gap-2 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={transitioning || !transitionForm.newPhase || !transitionForm.comment.trim() || !transitionForm.confirmed}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {transitioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitBranch className="h-4 w-4 mr-2" />}
                  Confirm Transition
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

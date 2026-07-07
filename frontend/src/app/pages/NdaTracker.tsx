import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { FolderLock, Plus, Clock, Edit3, Trash2, FolderOpen, Ban } from "lucide-react";
import { ndasApi, blocksApi, documentsApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

const NDA_TYPES = ["Mutual", "OneWay", "Standstill"];
const NDA_STATUSES = ["Draft", "Active", "Expired", "Terminated"];
const ACCESS_LEVELS = ["View", "Download"];

function emptyForm() {
  return {
    counterparty: "",
    ndaType: "Mutual",
    purpose: "",
    blockId: "",
    effectiveDate: "",
    expiryDate: "",
    owner: "",
    status: "Draft",
    notes: "",
  };
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function NdaTracker() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("nda.manage");
  const [ndas, setNdas] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // Data-room access management for a selected NDA
  const [accessNda, setAccessNda] = useState<any | null>(null);
  const [grants, setGrants] = useState<any[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [newGrantDocId, setNewGrantDocId] = useState("");
  const [newGrantLevel, setNewGrantLevel] = useState("View");
  const [grantSaving, setGrantSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ndaData, blockData, documentData] = await Promise.all([
        ndasApi.getAll(),
        blocksApi.getAll(),
        documentsApi.getAll(),
      ]);
      setNdas(Array.isArray(ndaData) ? ndaData : []);
      setBlocks(Array.isArray(blockData) ? blockData : []);
      setDocuments(Array.isArray(documentData) ? documentData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load NDAs.");
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

  const openEdit = (nda: any) => {
    setEditingId(nda.id);
    setForm({
      counterparty: nda.counterparty || "",
      ndaType: nda.ndaType || "Mutual",
      purpose: nda.purpose || "",
      blockId: nda.blockId ? String(nda.blockId) : "",
      effectiveDate: nda.effectiveDate ? String(nda.effectiveDate).slice(0, 10) : "",
      expiryDate: nda.expiryDate ? String(nda.expiryDate).slice(0, 10) : "",
      owner: nda.owner || "",
      status: nda.status || "Draft",
      notes: nda.notes || "",
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
        effectiveDate: form.effectiveDate || null,
        expiryDate: form.expiryDate || null,
      };
      if (editingId) {
        await ndasApi.update(editingId, payload);
      } else {
        await ndasApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save NDA.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, counterparty: string) => {
    if (!confirm(`Delete NDA with "${counterparty}"? This cannot be undone.`)) return;
    try {
      await ndasApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete NDA.");
    }
  };

  const openAccessManager = async (nda: any) => {
    setAccessNda(nda);
    setNewGrantDocId("");
    setNewGrantLevel("View");
    setGrantsLoading(true);
    try {
      const data = await ndasApi.getGrants(nda.id);
      setGrants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      alert(err.message || "Failed to load data-room grants.");
    } finally {
      setGrantsLoading(false);
    }
  };

  const handleAddGrant = async () => {
    if (!accessNda || !newGrantDocId) return;
    setGrantSaving(true);
    try {
      await ndasApi.createGrant(accessNda.id, { documentId: Number(newGrantDocId), accessLevel: newGrantLevel });
      const data = await ndasApi.getGrants(accessNda.id);
      setGrants(Array.isArray(data) ? data : []);
      setNewGrantDocId("");
    } catch (err: any) {
      alert(err.message || "Failed to grant access.");
    } finally {
      setGrantSaving(false);
    }
  };

  const handleRevokeGrant = async (grantId: number) => {
    if (!accessNda) return;
    try {
      await ndasApi.revokeGrant(accessNda.id, grantId);
      const data = await ndasApi.getGrants(accessNda.id);
      setGrants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      alert(err.message || "Failed to revoke access.");
    }
  };

  const expiringSoon = ndas.filter((n) => {
    const d = daysUntil(n.expiryDate);
    return d !== null && d >= 0 && d <= 30;
  }).length;
  const activeCount = ndas.filter((n) => n.status === "Active").length;

  const grantedDocumentIds = new Set(grants.filter((g) => !g.revokedAt).map((g) => g.documentId));
  const documentOptions = documents.filter((d) => !grantedDocumentIds.has(d.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">NDA &amp; Data Room Tracker</h1>
          <p className="text-gray-500 mt-1">NDAs with counterparties and which data-room documents each may access</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New NDA
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <FolderLock className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total NDAs</p>
              <p className="text-2xl">{ndas.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FolderLock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expiring in 30 days</p>
              <p className="text-2xl">{expiringSoon}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading NDAs...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : ndas.length === 0 ? (
          <div className="text-sm text-gray-600">No NDAs recorded yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Counterparty</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ndas.map((n) => {
                const d = daysUntil(n.expiryDate);
                return (
                  <TableRow key={n.id}>
                    <TableCell>{n.counterparty}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{n.ndaType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDisplayDateOrDefault(n.expiryDate)}
                        {d !== null && d <= 30 && d >= 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {d}d
                          </Badge>
                        )}
                        {d !== null && d < 0 && <Badge variant="destructive">Expired</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{n.owner || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={n.status === "Active" ? "default" : "outline"}>{n.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openAccessManager(n)}>
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Access
                        </Button>
                        {canEdit && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(n)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(n.id, n.counterparty)}>
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
              <h2 className="text-lg font-semibold">{editingId ? "Edit NDA" : "New NDA"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Counterparty *</label>
                    <Input required value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <Select value={form.ndaType} onValueChange={(v) => setForm({ ...form, ndaType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NDA_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Purpose</label>
                  <Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Effective Date</label>
                    <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Expiry Date</label>
                    <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
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
                        {NDA_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Owner</label>
                  <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
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
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create NDA"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {accessNda && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Data Room Access — {accessNda.counterparty}</h2>
              <Button variant="ghost" size="sm" onClick={() => setAccessNda(null)}>Close</Button>
            </div>
            <div className="p-6 space-y-4">
              {canEdit && (
                <div className="flex items-end gap-2 pb-4 border-b">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Grant access to document</label>
                    <Select value={newGrantDocId} onValueChange={setNewGrantDocId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentOptions.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>{d.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <label className="text-sm font-medium mb-1 block">Access</label>
                    <Select value={newGrantLevel} onValueChange={setNewGrantLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCESS_LEVELS.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddGrant} disabled={!newGrantDocId || grantSaving}>
                    {grantSaving ? "Granting..." : "Grant"}
                  </Button>
                </div>
              )}

              {grantsLoading ? (
                <div className="text-sm text-gray-600">Loading access grants...</div>
              ) : grants.length === 0 ? (
                <div className="text-sm text-gray-600">No documents have been granted yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Granted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grants.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell>{g.document?.title || `Document #${g.documentId}`}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{g.accessLevel}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDisplayDateOrDefault(g.grantedAt)}</TableCell>
                        <TableCell>
                          {g.revokedAt ? (
                            <Badge variant="outline">Revoked {formatDisplayDateOrDefault(g.revokedAt)}</Badge>
                          ) : (
                            <Badge variant="default">Granted</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {canEdit && !g.revokedAt && (
                            <Button size="sm" variant="ghost" onClick={() => handleRevokeGrant(g.id)}>
                              <Ban className="h-4 w-4 mr-1 text-red-500" />
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

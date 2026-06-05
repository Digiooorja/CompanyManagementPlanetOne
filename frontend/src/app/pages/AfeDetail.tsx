import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { ArrowLeft, FileText, Download, Trash2, Upload, File, Clock } from "lucide-react";
import { financeApi, documentsApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";
import { formatDisplayDateOrDefault } from "../lib/date";

export function AfeDetail() {
  const { id } = useParams();
  const { user, canEdit, canUpload } = useAuth();
  const [afe, setAfe] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [afeDocs, setAfeDocs] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    item: "",
    amount: "",
    category: "",
    type: "Expense",
    status: "Pending",
    description: "",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAfe = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const afeData = await financeApi.getById(Number(id));
      setAfe(afeData);
      
      setEditForm({
        item: afeData.item || "",
        amount: afeData.amount ? String(afeData.amount) : "",
        category: afeData.category || "",
        type: afeData.type || "Expense",
        status: afeData.status || "Pending",
        description: afeData.description || "",
      });

      // Load related documents
      const allDocs = await documentsApi.getAll();
      const related = (Array.isArray(allDocs) ? allDocs : [])
        .filter((doc: any) => {
          const docAfeNumber = String(doc.afeNumber || doc.relatedAfe || '').toLowerCase();
          const afeNumber = String(afeData.afeNumber || `AFE-${afeData.id}`).toLowerCase();
          return docAfeNumber === afeNumber || doc.afeId === afeData.id;
        });
      setAfeDocs(related);
    } catch (err) {
      console.error('Error loading AFE detail:', err);
      setError('Failed to load AFE details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAfe();
  }, [id]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleUploadDocument(file);
  };

  const handleUploadDocument = async (file: File) => {
    if (!afe) return;
    
    setUploadingDoc(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('documentType', 'AFE Document');
      formData.append('status', 'Active');
      formData.append('afeNumber', afe.afeNumber || `AFE-${afe.id}`);
      formData.append('afeId', String(afe.id));

      const uploaded = await documentsApi.create(formData);
      
      setSuccessMessage(`Document "${file.name}" uploaded successfully`);
      
      // Reload documents
      const allDocs = await documentsApi.getAll();
      const related = (Array.isArray(allDocs) ? allDocs : [])
        .filter((doc: any) => {
          const docAfeNumber = String(doc.afeNumber || doc.relatedAfe || '').toLowerCase();
          const afeNumber = String(afe.afeNumber || `AFE-${afe.id}`).toLowerCase();
          return docAfeNumber === afeNumber || doc.afeId === afe.id;
        });
      setAfeDocs(related);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDocument = async (docId: number) => {
    try {
      const presigned = await documentsApi.getPresignedUrl(docId, 'download');
      window.open(presigned.url, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to generate download link');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentsApi.delete(docId);
      setAfeDocs(afeDocs.filter(doc => doc.id !== docId));
      setSuccessMessage('Document deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  const handleUpdateAfe = async () => {
    if (!afe) return;
    setEditSaving(true);
    setError(null);

    try {
      await financeApi.update(afe.id, {
        ...afe,
        ...editForm,
        amount: Number(editForm.amount),
      });
      
      setSuccessMessage('AFE updated successfully');
      loadAfe();
      setEditOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating AFE:', err);
      setError('Failed to update AFE');
    } finally {
      setEditSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Paid':
        return 'default';
      case 'Pending':
      case 'Under Review':
      case 'Rejected':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link to="/finance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Finance
          </Button>
        </Link>
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading AFE details...</p>
        </Card>
      </div>
    );
  }

  if (!afe) {
    return (
      <div className="space-y-6">
        <Link to="/finance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Finance
          </Button>
        </Link>
        <Card className="p-8">
          <p className="text-center text-red-600">AFE not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/finance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Finance
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {successMessage && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-green-700">{successMessage}</p>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{afe.item || afe.afeNumber}</h1>
            <p className="text-gray-500 mt-1">AFE #{afe.afeNumber || afe.id}</p>
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canEdit}>Edit AFE</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit AFE</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editForm.item}
                    onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option>Pending</option>
                    <option>Under Review</option>
                    <option>Approved</option>
                    <option>Paid</option>
                    <option>Rejected</option>
                  </select>
                </div>
                <div>
                  <Label>Description Details</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateAfe} disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-xl font-semibold">${Number(afe.amount || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="text-lg">{afe.category || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="text-lg">{afe.type || 'Expense'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <Badge className="mt-1" variant={getStatusColor(afe.status)}>
              {afe.status || 'Pending'}
            </Badge>
          </div>
        </div>

        {afe.description && (
          <>
            <Separator className="my-6" />
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{afe.description}</p>
            </div>
          </>
        )}

        <Separator className="my-6" />

        <div>
          <p className="text-sm text-gray-600">Approval Department</p>
          <p className="text-lg">{afe.approvalDepartment || 'Finance'}</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          Delegation Audit Trail
        </h2>
        {(!afe.delegationHistory || afe.delegationHistory.length === 0) ? (
          <p className="text-gray-500 italic p-4 bg-gray-50 rounded border border-dashed text-center">No delegation history available for this AFE yet.</p>
        ) : (
          <div className="space-y-4 ml-2">
            {afe.delegationHistory.map((log: any, index: number) => (
              <div key={index} className="pl-6 border-l-2 border-blue-200 py-1 relative">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-2.5 shadow-[0_0_0_4px_white]"></div>
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium flex items-center gap-2">
                    {log.by}
                    <Badge variant={log.action === 'Approved' ? 'default' : log.action === 'Rejected' ? 'destructive' : 'secondary'}>
                      {log.action}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(log.at).toLocaleString()}</span>
                </div>
                {log.action === 'Delegated' && (
                  <p className="text-sm text-gray-600 mb-1">Forwarded to: <span className="font-medium text-gray-900">{log.to}</span></p>
                )}
                {log.comment && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-2 border border-gray-100 italic">"{log.comment}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Related Documents</h2>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingDoc || !canUpload}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploadingDoc}
          />
        </div>

        {afeDocs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents uploaded for this AFE yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {afeDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium">{doc.title || doc.name}</p>
                    <p className="text-sm text-gray-500">
                      {doc.documentType || doc.type || 'Document'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadDocument(doc.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

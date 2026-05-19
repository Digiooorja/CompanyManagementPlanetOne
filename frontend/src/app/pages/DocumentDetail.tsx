import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "../components/ui/dialog";
import { ArrowLeft, FileText, Download, Share2, Trash2, Clock } from "lucide-react";
import { documentsApi, activitiesApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

export function DocumentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [document, setDocument] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    author: "",
    documentType: "Report",
    status: "Review",
    description: "",
    activityIds: [] as string[]
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const previewableMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

  const loadDocument = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const doc = await documentsApi.getById(Number(id));
      setDocument(doc);

      const latestVersion = Array.isArray(doc?.versions) && doc.versions.length > 0
        ? doc.versions[doc.versions.length - 1]
        : null;
      const previewTarget = latestVersion || doc;

      if (previewTarget?.mimeType && previewableMimeTypes.includes(previewTarget.mimeType)) {
        const presigned = await documentsApi.getPresignedUrl(Number(previewTarget.id), 'preview');
        setPreviewUrl(presigned.url);
      } else {
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error('Error loading document detail:', err);
      setError('Failed to load document details');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const data = await activitiesApi.getAll();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading activities for edit form:', err);
      setActivities([]);
    }
  };

  useEffect(() => {
    loadDocument();
    loadActivities();
  }, [id]);

  useEffect(() => {
    if (!document) return;
    setEditForm({
      title: document.title || document.name || '',
      author: document.author || document.uploadedBy || '',
      documentType: document.documentType || document.type || 'Report',
      status: document.status || 'Review',
      description: document.content || document.description || '',
      activityIds: Array.isArray(document.activityIds)
        ? document.activityIds.map(String)
        : document.activityId
          ? [String(document.activityId)]
          : []
    });
  }, [document]);

  const getLatestDocumentId = () => {
    if (!document) return null;
    if (Array.isArray(document.versions) && document.versions.length > 0) {
      return document.versions[document.versions.length - 1].id;
    }
    return document.id;
  };

  const handleDownload = async () => {
    const latestDocId = getLatestDocumentId();
    if (!latestDocId) return;
    try {
      const presigned = await documentsApi.getPresignedUrl(Number(latestDocId), 'download');
      window.open(presigned.url, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to generate download link');
    }
  };

  const handleUploadNewVersion = () => {
    fileInputRef.current?.click();
  };

  const handleNewVersionFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !document) return;

    setUploadingVersion(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', document.title || document.name || `Document ${document.id}`);
      formData.append(
        'author',
        user ? `${user.firstName || ''} ${user.lastName || user.username}`.trim() : document.author || 'system'
      );
      formData.append('documentType', document.documentType || document.type || 'Report');
      formData.append('status', document.status || 'Review');

      if (document.projectId) {
        formData.append('projectId', String(document.projectId));
      }
      if (document.activityId) {
        formData.append('activityId', String(document.activityId));
      }

      await documentsApi.uploadVersion(document.id, formData);
      await loadDocument();
      setSuccessMessage('New version uploaded successfully.');
    } catch (err) {
      console.error('Error uploading new version:', err);
      setError('Failed to upload new version');
      setSuccessMessage(null);
    } finally {
      setUploadingVersion(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleEditFieldChange = (field: keyof Omit<typeof editForm, 'activityIds'>, value: string) => {
    setEditForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleEditActivitySelection = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(event.target.selectedOptions, (option) => option.value);
    setEditForm((current) => ({
      ...current,
      activityIds: selectedValues
    }));
  };

  const handleSaveDocumentDetails = async () => {
    if (!document) return;

    setEditSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await documentsApi.update(document.id, {
        title: editForm.title,
        author: editForm.author,
        documentType: editForm.documentType,
        status: editForm.status,
        content: editForm.description,
        activityId: editForm.activityIds.length > 0 ? Number(editForm.activityIds[0]) : null,
        activityIds: editForm.activityIds.map(Number)
      });
      await loadDocument();
      setSuccessMessage('Document details saved successfully.');
      setEditOpen(false);
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to update document details');
    } finally {
      setEditSaving(false);
    }
  };

  const documentTitle = document?.title || document?.name || 'Document';
  const documentType = document?.documentType || document?.type || 'Document';
  const documentStatus = document?.status || 'Unknown';
  const documentDescription = document?.content || document?.description || 'No description available';
  const documentVersion = document?.versionNumber != null ? String(document.versionNumber) : '1';
  const documentUploadDate = document?.uploadDate ? new Date(document.uploadDate).toLocaleDateString() : 'Unknown';

  const metadata = [
    { label: 'Document Type', value: documentType },
    { label: 'Block', value: document?.block || document?.blockName || 'Unknown' },
    { label: 'Project', value: document?.project || document?.projectId || 'Unknown' },
    { label: 'Tagged Activities', value: Array.isArray(document?.activityTags) && document.activityTags.length > 0 ? document.activityTags.join(', ') : document?.activityId ? `Activity ${document.activityId}` : 'None' },
    { label: 'File Size', value: document?.size ? `${document.size} bytes` : 'Unknown' },
    { label: 'Version', value: documentVersion },
    { label: 'Created Date', value: documentUploadDate },
    { label: 'Created By', value: document?.author || document?.uploadedBy || 'Unknown' },
    { label: 'Status', value: documentStatus },
  ];

  const workflowSteps = document?.versions?.length > 0
    ? document.versions.map((version: any, index: number) => ({
        step: version.label || `Version ${version.versionNumber || index + 1}`,
        status: version.status || 'Completed',
        date: version.uploadDate ? new Date(version.uploadDate).toLocaleDateString() : documentUploadDate,
        user: version.author || document?.author || 'Unknown',
        version: version.versionNumber != null ? String(version.versionNumber) : `${index + 1}`
      }))
    : [
        { step: 'Uploaded', status: 'Completed', date: documentUploadDate, user: document?.author || 'Unknown', version: documentVersion },
      ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading document details...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-8 bg-red-50 border border-red-200">
          <p className="text-center text-red-700">{error}</p>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <Card className="p-8">
          <p className="text-center text-gray-500">Document not found</p>
        </Card>
      </div>
    );
  }

  const canPreview = previewUrl !== null;
  const isPdf = document.mimeType === 'application/pdf';
  const isImage = document.mimeType?.startsWith('image/');

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={handleNewVersionFile}
      />
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link to="/documents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </Link>
        </div>

        {successMessage && (
          <Card className="p-4 bg-green-50 border border-green-200">
            <p className="text-green-700 text-center">{successMessage}</p>
          </Card>
        )}
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl flex items-center gap-3">
            <FileText className="h-8 w-8" />
            {documentTitle}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <Badge variant="outline">{documentType}</Badge>
            <span>Version {documentVersion}</span>
            <span>Uploaded {documentUploadDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{documentStatus}</Badge>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          variant="outline"
          onClick={() => previewUrl && window.open(previewUrl, '_blank')}
          disabled={!canPreview}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button variant="outline" onClick={handleUploadNewVersion} disabled={uploadingVersion}>
          Upload New Version
        </Button>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg">File Preview</h3>
              {Array.isArray(document?.versions) && document?.versions.length > 1 ? (
                <p className="text-sm text-gray-500">Preview and download always use the latest version.</p>
              ) : null}
            </div>
            <div className="bg-gray-100 rounded-lg h-96 overflow-hidden">
              {canPreview ? (
                isPdf ? (
                  <iframe
                    src={previewUrl || ''}
                    title="Document Preview"
                    className="h-full w-full"
                  />
                ) : isImage ? (
                  <img src={previewUrl || ''} alt={documentTitle} className="h-full w-full object-contain" />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-6">
                    <FileText className="h-16 w-16 mx-auto mb-3" />
                    <p>Preview available, but this file type is not rendered inline.</p>
                    <Button variant="link" onClick={handleDownload} className="mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Download to view
                    </Button>
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-6">
                  <FileText className="h-16 w-16 mx-auto mb-3" />
                  <p>Document preview not available</p>
                  <Button variant="link" onClick={handleDownload} className="mt-2">
                    <Download className="h-4 w-4 mr-2" />
                    Download to view
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg mb-3">Description</h3>
            <p className="text-gray-700">{documentDescription}</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Version History
            </h3>
            <div className="space-y-3">
              {workflowSteps.map((version: { step: string; status: string; date: string; user: string; version?: string }, index: number) => (
                <div key={index}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Badge variant={index === 0 ? 'default' : 'outline'}>
                        v{version.step === 'Uploaded' ? documentVersion : version.step}
                      </Badge>
                      <div>
                        <p className="text-sm">{version.step}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {version.date} by {version.user}
                        </p>
                      </div>
                    </div>
                    {index > 0 && (
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {index < workflowSteps.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Metadata</h4>
            <div className="space-y-3 text-sm">
              {metadata.map((item, index) => (
                <div key={index}>
                  <p className="text-gray-600">{item.label}</p>
                  <p className="mt-1">{item.value}</p>
                  {index < metadata.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Actions</h4>
            <div className="space-y-2">
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Edit Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Document Details</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        value={editForm.title}
                        onChange={(event) => handleEditFieldChange('title', event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-author">Author</Label>
                      <Input
                        id="edit-author"
                        value={editForm.author}
                        onChange={(event) => handleEditFieldChange('author', event.target.value)}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="edit-document-type">Document Type</Label>
                        <Select
                          value={editForm.documentType}
                          onValueChange={(value) => handleEditFieldChange('documentType', value)}
                        >
                          <SelectTrigger id="edit-document-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Technical">Technical</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Report">Report</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-status">Status</Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(value) => handleEditFieldChange('status', value)}
                        >
                          <SelectTrigger id="edit-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Review">Review</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Revision">Revision</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(event) => handleEditFieldChange('description', event.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-activities">Tagged Activities</Label>
                      <select
                        id="edit-activities"
                        multiple
                        value={editForm.activityIds}
                        onChange={handleEditActivitySelection}
                        className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {activities.map((activity) => (
                          <option key={activity.id} value={String(activity.id)}>
                            {activity.name || activity.title || `Activity ${activity.id}`}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">Hold Control (Windows) or Command (Mac) to select multiple activities.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSaveDocumentDetails} disabled={editSaving}>
                      {editSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="w-full" onClick={handleUploadNewVersion} disabled={uploadingVersion}>
                Upload New Version
              </Button>
              <Button variant="outline" className="w-full">
                Request Review
              </Button>
              <Button variant="outline" className="w-full">
                Move to Folder
              </Button>
              <Button variant="outline" className="w-full">
                Export Metadata
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

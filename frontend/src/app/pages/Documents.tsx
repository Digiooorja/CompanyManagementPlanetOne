import { useState, useEffect, useMemo, ChangeEvent, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Search, Plus, FileText, FolderOpen, Download } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../components/ui/dialog";
import { documentsApi, blocksApi, activitiesApi, projectsApi, departmentsApi, licencesApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";

export function Documents() {
  const [searchParams] = useSearchParams();
  // §5.8 guaranteed drill-down: pre-apply the block filter forwarded via
  // query params from the Executive Dashboard's filter bar.
  const [filterBlock, setFilterBlock] = useState(searchParams.get("blockId") || "all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [licences, setLicences] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    author: "",
    documentType: "Technical",
    status: "Draft",
    category: "Other",
    confidentialityLevel: "Public",
    awaitingResponseFrom: "",
    responseDueDate: "",
    tags: "",
    blockId: "",
    projectId: "",
    activityIds: [] as string[],
    departmentId: "",
    licenceId: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, canEdit, canUpload } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [documentData, blockData, projectData, departmentData, licenceData] = await Promise.all([
          documentsApi.getAll(),
          blocksApi.getAll(),
          // get all projects and use block filtering client-side
          projectsApi.getAll ? projectsApi.getAll() : [],
          departmentsApi.getAll(),
          licencesApi.getAll()
        ]);
        setDocuments(Array.isArray(documentData) ? documentData : []);
        setBlocks(Array.isArray(blockData) ? blockData : []);
        setProjects(Array.isArray(projectData) ? projectData : []);
        setDepartments(Array.isArray(departmentData) ? departmentData : []);
        setLicences(Array.isArray(licenceData) ? licenceData : []);
      } catch (err) {
        console.error('Error loading documents page data:', err);
        setDocuments([]);
        setBlocks([]);
        setProjects([]);
        setError('Unable to load documents data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchActivitiesForProject = async (projectId: string) => {
    if (!projectId) {
      setActivities([]);
      return;
    }

    try {
      const data = await activitiesApi.getByProjectId(Number(projectId));
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setActivities([]);
    }
  };

  const handleUploadChange = (field: keyof typeof uploadForm, value: string) => {
    setUploadForm((current) => {
      if (field === 'blockId') {
        return {
          ...current,
          blockId: value,
          projectId: '',
          activityIds: []
        };
      }

      return {
        ...current,
        [field]: value
      };
    });
  };

  const handleProjectChange = async (projectId: string) => {
    setUploadForm((current) => ({
      ...current,
      projectId,
      activityIds: []
    }));
    await fetchActivitiesForProject(projectId);
  };

  const activityOptions = useMemo(() => {
    const seen = new Set<string>();
    const parentMap = new Map<string, any[]>();
    const roots: any[] = [];

    activities.forEach((activity) => {
      const id = String(activity.id);
      const parentId = activity.parentActivityId ? String(activity.parentActivityId) : null;
      if (parentId) {
        const list = parentMap.get(parentId) || [];
        list.push(activity);
        parentMap.set(parentId, list);
      } else {
        roots.push(activity);
      }
    });

    const buildLabel = (activity: any, indentLevel = 0) => {
      const label = activity.name || activity.title || `Activity ${activity.id}`;
      if (indentLevel === 0) {
        return label;
      }
      const indentation = '\u00A0\u00A0'.repeat(indentLevel);
      return `${indentation}↳ ${label}`;
    };

    const result: Array<{ id: string; label: string }> = [];

    const addActivity = (activity: any, indentLevel = 0) => {
      const id = String(activity.id);
      if (seen.has(id)) return;
      seen.add(id);
      result.push({ id, label: buildLabel(activity, indentLevel) });
      const children = parentMap.get(id) || activity.subActivities || [];
      if (Array.isArray(children)) {
        children.forEach((child) => addActivity(child, indentLevel + 1));
      }
    };

    if (roots.length > 0) {
      roots.forEach((activity) => addActivity(activity, 0));
    } else {
      activities.forEach((activity) => addActivity(activity, 0));
    }

    return result;
  }, [activities]);

  const handleActivitySelection = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(event.target.selectedOptions, (option) => option.value);
    setUploadForm((current) => ({
      ...current,
      activityIds: selectedValues
    }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleUploadDocument = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', uploadForm.title || file.name);
      formData.append(
        'author',
        user ? `${user.firstName || ''} ${user.lastName || user.username}`.trim() : uploadForm.author || 'unknown'
      );
      formData.append('documentType', uploadForm.documentType);
      formData.append('status', uploadForm.status);
      formData.append('category', uploadForm.category);
      formData.append('confidentialityLevel', uploadForm.confidentialityLevel);
      if (uploadForm.awaitingResponseFrom) {
        formData.append('awaitingResponseFrom', uploadForm.awaitingResponseFrom);
      }
      if (uploadForm.responseDueDate) {
        formData.append('responseDueDate', uploadForm.responseDueDate);
      }
      if (uploadForm.tags) {
        formData.append(
          'tags',
          JSON.stringify(uploadForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean))
        );
      }
      if (uploadForm.blockId) {
        formData.append('blockId', uploadForm.blockId);
      }
      if (uploadForm.projectId) {
        formData.append('projectId', uploadForm.projectId);
      }
      if (uploadForm.activityIds.length > 0) {
        formData.append('activityIds', JSON.stringify(uploadForm.activityIds));
      }
      if (uploadForm.departmentId) {
        formData.append('departmentId', uploadForm.departmentId);
      }
      if (uploadForm.licenceId) {
        formData.append('licenceId', uploadForm.licenceId);
      }

      await documentsApi.upload(formData);

      const refreshedDocuments = await documentsApi.getAll();
      setDocuments(Array.isArray(refreshedDocuments) ? refreshedDocuments : []);
      setIsUploadOpen(false);
      setFile(null);
      setUploadForm({
        title: '',
        author: '',
        documentType: 'Technical',
        status: 'Draft',
        category: 'Other',
        confidentialityLevel: 'Public',
        awaitingResponseFrom: '',
        responseDueDate: '',
        tags: '',
        blockId: '',
        projectId: '',
        activityIds: [],
        departmentId: '',
        licenceId: ''
      });
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (documentId: number) => {
    try {
      setDownloadingId(documentId);
      setError(null);
      const presigned = await documentsApi.getPresignedUrl(documentId, 'download');
      window.open(presigned.url, '_blank');
    } catch (err) {
      console.error('Error fetching document download link:', err);
      setError('Failed to generate download link');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreviewDocument = async (documentId: number) => {
    try {
      setPreviewingId(documentId);
      setError(null);
      const presigned = await documentsApi.getPresignedUrl(documentId, 'preview');
      window.open(presigned.url, '_blank');
    } catch (err) {
      console.error('Error fetching document preview link:', err);
      setError('Failed to generate preview link');
    } finally {
      setPreviewingId(null);
    }
  };

  const getDocumentProjectName = (document: any) => {
    if (document?.project) {
      return document.project;
    }
    const project = projects.find((projectItem) => String(projectItem.id) === String(document?.projectId));
    return project?.name || document?.projectId || '-';
  };

  const getDocumentBlockName = (document: any) => {
    if (document?.block || document?.blockName) {
      return document.block || document.blockName;
    }

    const project = projects.find((projectItem) => String(projectItem.id) === String(document?.projectId));
    if (!project) {
      return document?.block || '-';
    }

    const block = blocks.find((blockItem) => String(blockItem.id) === String(project.blockId));
    return block?.name || document?.block || '-';
  };

  const getDocumentActivities = (document: any) => {
    const truncateName = (name: string) => {
      if (!name) return '';
      return name.length > 10 ? `${name.slice(0, 10)}...` : name;
    };

    if (Array.isArray(document.activityTags) && document.activityTags.length > 0) {
      return document.activityTags.map(truncateName).join(', ');
    }
    if (document.activityId) {
      return `Activity ${document.activityId}`;
    }
    return '-';
  };

  const documentTypeOptions = useMemo(() => {
    const typeSet = new Set<string>();
    documents.forEach((doc) => {
      const type = String(doc.documentType || doc.type || '').trim();
      if (type) {
        typeSet.add(type);
      }
    });
    return Array.from(typeSet).sort((a, b) => a.localeCompare(b));
  }, [documents]);

  const documentCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Technical: 0,
      Finance: 0,
      HSE: 0,
      Legal: 0,
      Report: 0,
    };

    documents.forEach((doc) => {
      const rawType = String(doc.documentType || doc.type || '').toLowerCase();
      if (rawType.includes('technical')) {
        counts.Technical += 1;
      } else if (/finance|financial/.test(rawType)) {
        counts.Finance += 1;
      } else if (/hse|health|safety/.test(rawType)) {
        counts.HSE += 1;
      } else if (rawType.includes('legal')) {
        counts.Legal += 1;
      } else if (rawType.includes('report')) {
        counts.Report += 1;
      }
    });

    return counts;
  }, [documents]);

  const renderedDocuments = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return documents.filter((doc) => {
      const project = projects.find((projectItem) => String(projectItem.id) === String(doc?.projectId));
      const block = blocks.find((blockItem) => String(blockItem.id) === String(project?.blockId));
      const documentType = String(doc.documentType || doc.type || '').toLowerCase();

      if (filterBlock !== 'all' && String(block?.id) !== String(filterBlock)) {
        return false;
      }

      if (filterType !== 'all' && filterType) {
        if (!documentType.includes(String(filterType).toLowerCase())) {
          return false;
        }
      }

      if (filterStatus !== 'all' && filterStatus) {
        if (String(doc.status || '').toLowerCase() !== String(filterStatus).toLowerCase()) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        doc.title,
        doc.name,
        doc.filename,
        doc.documentType,
        doc.type,
        doc.status,
        getDocumentProjectName(doc),
        getDocumentBlockName(doc),
        Array.isArray(doc.activityTags) ? doc.activityTags.join(' ') : '',
        doc.uploadedBy,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [documents, searchQuery, filterBlock, filterType, filterStatus, blocks, projects]);

  const getActiveUserName = () => {
    if (!user) return '-';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '-';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Final":
        return "default";
      case "Under Review":
        return "secondary";
      case "Superseded":
        return "outline";
      case "Draft":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Document Management</h1>
          <p className="text-gray-500 mt-1">Centralized document library</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canUpload}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a file and optionally tag it to a block, project, activity, or department.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="document-title">Title</Label>
                <Input
                  id="document-title"
                  value={uploadForm.title}
                  onChange={(event) => handleUploadChange('title', event.target.value)}
                  placeholder="Document title"
                />
              </div>
              <div>
                <Label htmlFor="document-author">Author</Label>
                <Input
                  id="document-author"
                  value={uploadForm.author}
                  onChange={(event) => handleUploadChange('author', event.target.value)}
                  placeholder="Author name"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="document-department">Department</Label>
                  <select
                    id="document-department"
                    className="mt-1 block w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={uploadForm.departmentId}
                    onChange={(event) => handleUploadChange('departmentId', event.target.value)}
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={String(department.id)}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="document-block">Block</Label>
                  <select
                    id="document-block"
                    className="mt-1 block w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={uploadForm.blockId}
                    onChange={(event) => handleUploadChange('blockId', event.target.value)}
                  >
                    <option value="">Select block</option>
                    {blocks.map((block) => (
                      <option key={block.id} value={String(block.id)}>
                        {block.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="document-project">Project</Label>
                  <select
                    id="document-project"
                    className="mt-1 block w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={uploadForm.projectId}
                    onChange={(event) => handleProjectChange(event.target.value)}
                  >
                    <option value="">Select project</option>
                    {projects
                      .filter((project) =>
                        uploadForm.blockId ? String(project.blockId) === uploadForm.blockId : true
                      )
                      .map((project) => (
                        <option key={project.id} value={String(project.id)}>
                          {project.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="document-activities">Tagged Activities</Label>
                <select
                  id="document-activities"
                  multiple
                  className="mt-1 block w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={uploadForm.activityIds}
                  onChange={handleActivitySelection}
                  disabled={!uploadForm.projectId}
                >
                  {activityOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple activities.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="document-type">Document Type</Label>
                  <select
                    id="document-type"
                    className="mt-1 block w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={uploadForm.documentType}
                    onChange={(event) => handleUploadChange('documentType', event.target.value)}
                  >
                    <option value="Technical">Technical</option>
                    <option value="HSE">HSE</option>
                    <option value="Finance">Finance</option>
                    <option value="Report">Report</option>
                    <option value="Licence">Licence</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="document-status">Status</Label>
                  <select
                    id="document-status"
                    className="mt-1 block w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={uploadForm.status}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => handleUploadChange('status', event.target.value)}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Final">Final</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="document-category">Category</Label>
                  <select
                    id="document-category"
                    className="mt-1 block w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={uploadForm.category}
                    onChange={(event) => handleUploadChange('category', event.target.value)}
                  >
                    <option value="Contract">Contract</option>
                    <option value="Letter">Letter</option>
                    <option value="Notice">Notice</option>
                    <option value="Report">Report</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="document-confidentiality">Confidentiality Level</Label>
                  <select
                    id="document-confidentiality"
                    className="mt-1 block w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={uploadForm.confidentialityLevel}
                    onChange={(event) => handleUploadChange('confidentialityLevel', event.target.value)}
                  >
                    <option value="Public">Public</option>
                    <option value="Internal">Internal</option>
                    <option value="Confidential">Confidential</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="document-awaiting-response">Awaiting Response From</Label>
                  <Input
                    id="document-awaiting-response"
                    placeholder="e.g. NOC, Ministry of Energy"
                    value={uploadForm.awaitingResponseFrom}
                    onChange={(event) => handleUploadChange('awaitingResponseFrom', event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="document-response-due">Response Due Date</Label>
                  <Input
                    id="document-response-due"
                    type="date"
                    value={uploadForm.responseDueDate}
                    onChange={(event) => handleUploadChange('responseDueDate', event.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="document-tags">Tags (comma-separated)</Label>
                <Input
                  id="document-tags"
                  placeholder="e.g. drilling, phase-2, urgent"
                  value={uploadForm.tags}
                  onChange={(event) => handleUploadChange('tags', event.target.value)}
                />
              </div>
              {/* Licence selector — only shown when document type is 'Licence' */}
              {uploadForm.documentType === 'Licence' && (
                <div className="pt-2">
                  <Label htmlFor="document-licence">Link to Licence</Label>
                  <select
                    id="document-licence"
                    className="mt-1 block w-full rounded-md border bg-input-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={uploadForm.licenceId}
                    onChange={(event) => handleUploadChange('licenceId', event.target.value)}
                  >
                    <option value="">— Select a licence (recommended) —</option>
                    {licences.map((licence) => (
                      <option key={licence.id} value={String(licence.id)}>
                        {licence.licenceNumber} {licence.licenceType ? `(${licence.licenceType})` : ''}
                      </option>
                    ))}
                  </select>
                  {!uploadForm.licenceId && (
                    <p className="mt-1 text-xs text-amber-600">
                      ⚠️ No licence selected — document will be saved to the library unlinked.
                      You can link it later from the Edit Licence dialog.
                    </p>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="document-file">File</Label>

                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-fit"
                  >
                    Browse
                  </Button>

                  <div className="min-h-[38px] flex-1 rounded-md border bg-input-background px-3 py-2 text-sm text-gray-700 shadow-sm flex items-center">
                    {file ? file.name : "No file selected"}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  id="document-file"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={handleUploadDocument} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search documents..."
              className="pl-10"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Select value={filterBlock} onValueChange={setFilterBlock}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blocks</SelectItem>
              {blocks.map((block) => (
                <SelectItem key={block.id} value={String(block.id)}>
                  {block.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {documentTypeOptions.map((typeOption) => (
                <SelectItem key={typeOption} value={typeOption}>
                  {typeOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="Final">Final</SelectItem>
              <SelectItem value="Superseded">Superseded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading documents...</p>
        </Card>
      ) : (
        <>
      {/* Document Folders */}
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
        <Card
          className={`flex-none w-[220px] p-4 cursor-pointer hover:bg-gray-50 transition-all border ${
            filterType === 'Technical' ? 'bg-blue-50/50 ring-2 ring-blue-500 border-transparent shadow-sm' : 'border-gray-200'
          }`}
          onClick={() => setFilterType(filterType === 'Technical' ? 'all' : 'Technical')}
        >
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Technical</p>
              <p className="text-sm text-gray-500">{documentCategoryCounts.Technical} files</p>
            </div>
          </div>
        </Card>
        <Card
          className={`flex-none w-[220px] p-4 cursor-pointer hover:bg-gray-50 transition-all border ${
            filterType === 'Finance' ? 'bg-green-50/50 ring-2 ring-green-500 border-transparent shadow-sm' : 'border-gray-200'
          }`}
          onClick={() => setFilterType(filterType === 'Finance' ? 'all' : 'Finance')}
        >
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Finance</p>
              <p className="text-sm text-gray-500">{documentCategoryCounts.Finance} files</p>
            </div>
          </div>
        </Card>
        <Card
          className={`flex-none w-[220px] p-4 cursor-pointer hover:bg-gray-50 transition-all border ${
            filterType === 'HSE' ? 'bg-orange-50/50 ring-2 ring-orange-500 border-transparent shadow-sm' : 'border-gray-200'
          }`}
          onClick={() => setFilterType(filterType === 'HSE' ? 'all' : 'HSE')}
        >
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-orange-600" />
            <div>
              <p className="font-medium text-gray-900">HSE</p>
              <p className="text-sm text-gray-500">{documentCategoryCounts.HSE} files</p>
            </div>
          </div>
        </Card>
        <Card
          className={`flex-none w-[220px] p-4 cursor-pointer hover:bg-gray-50 transition-all border ${
            filterType === 'Legal' ? 'bg-purple-50/50 ring-2 ring-purple-500 border-transparent shadow-sm' : 'border-gray-200'
          }`}
          onClick={() => setFilterType(filterType === 'Legal' ? 'all' : 'Legal')}
        >
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Legal</p>
              <p className="text-sm text-gray-500">{documentCategoryCounts.Legal} files</p>
            </div>
          </div>
        </Card>
        <Card
          className={`flex-none w-[220px] p-4 cursor-pointer hover:bg-gray-50 transition-all border ${
            filterType === 'Report' ? 'bg-rose-50/50 ring-2 ring-rose-500 border-transparent shadow-sm' : 'border-gray-200'
          }`}
          onClick={() => setFilterType(filterType === 'Report' ? 'all' : 'Report')}
        >
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-rose-600" />
            <div>
              <p className="font-medium text-gray-900">Report</p>
              <p className="text-sm text-gray-500">{documentCategoryCounts.Report} files</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Documents Table */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Activities</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderedDocuments.map((doc) => (
              <TableRow
                key={doc.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                <TableCell className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <Link
                    to={`/documents/${doc.id}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {doc.name || doc.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{doc.type || doc.documentType || 'Report'}</Badge>
                </TableCell>
                <TableCell>{getDocumentBlockName(doc)}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {getDocumentProjectName(doc)}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {getDocumentActivities(doc)}
                </TableCell>
                <TableCell>{formatDisplayDateOrDefault(doc.uploadDate)}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {doc.uploadedBy || getActiveUserName()}
                </TableCell>
                <TableCell>{doc.size}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(doc.status)}>
                    {doc.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Link to={`/documents/${doc.id}`} onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewDocument(doc.id);
                      }}
                      disabled={previewingId === doc.id}
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDocument(doc.id);
                      }}
                      disabled={downloadingId === doc.id}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
        </>
      )}
    </div>
  );
}

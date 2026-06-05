import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "../components/ui/dialog";
import { ArrowLeft, Calendar, User, FileText, MessageSquare, Plus, Trash2, CheckCircle, UploadCloud, Search, Link2, X } from "lucide-react";
import { activitiesApi, commentsApi, departmentsApi, documentsApi, usersApi } from "../../services/api";

export function ActivityDetail() {
  const { id } = useParams();
  const [activity, setActivity] = useState<any>(null);
  const [subActivities, setSubActivities] = useState<any[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [commentDepartmentId, setCommentDepartmentId] = useState<number | string>('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubActivityForm, setShowSubActivityForm] = useState(false);
  const [newSubActivity, setNewSubActivity] = useState({
    name: '',
    description: '',
    status: 'Active',
    priority: 'Medium',
    progress: 0,
    plannedStartDate: '',
    plannedEndDate: '',
    plannedCost: '',
    actualCost: ''
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({
    name: '',
    description: '',
    status: 'Active',
    priority: 'Medium',
    assignedTo: '',
    plannedStartDate: '',
    plannedEndDate: '',
    actualStartDate: '',
    actualEndDate: '',
    plannedCost: '',
    actualCost: '',
    progress: 0
  });
  const navigate = useNavigate();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [linkingDocId, setLinkingDocId] = useState<number | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("Technical");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activityActionLoading, setActivityActionLoading] = useState(false);
  const { user, canEdit, canUpload } = useAuth();
  const departmentName = user?.department || user?.departmentDetails?.name || '';
  const isOperationsUser = departmentName.toLowerCase().includes('operation');
  const isFinanceUser = departmentName.toLowerCase().includes('finance');
  const isAdminUser = user?.role === 'Admin';
  const canEditFields = canEdit && (isAdminUser || isOperationsUser);
  const canEditActualCost = canEdit && (isAdminUser || isFinanceUser);
  const canCreateActivity = canEdit && (isAdminUser || isOperationsUser);

  const buildUserDisplayName = (user: any) => {
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username || 'Unknown User';
    const departmentName = user?.department || user?.departmentDetails?.name || 'Unknown Department';
    return `${departmentName} - ${displayName}`;
  };

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);
      if (id) {
        const [activityData, commentData, departmentData, documentData, usersData] = await Promise.all([
          activitiesApi.getById(parseInt(id)),
          commentsApi.getByActivityId(parseInt(id)),
          departmentsApi.getAll(),
          documentsApi.getByActivityId(parseInt(id)),
          usersApi.getAll()
        ]);


        console.log(`[Frontend] Fetched activity ${id}, progress=${activityData.progress}%, subActivities=${activityData.subActivities?.length || 0}, project=${activityData.project?.name}`);

        const transformedActivity = {
          ...activityData,
          title: activityData.title || activityData.name,
          project: activityData.project // Keep full project object with id and name
        };
        setActivity(transformedActivity);

        const transformedSubActivities = (activityData.subActivities || []).map((sub: any) => ({
          ...sub,
          title: sub.title || sub.name
        }));
        setSubActivities(transformedSubActivities);

        setComments(Array.isArray(commentData) ? commentData : []);
        setDepartments(Array.isArray(departmentData) ? departmentData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);

        const collectActivityIds = (items: any[] = []): number[] =>
          items.flatMap((item) => [Number(item.id), ...collectActivityIds(item.subActivities || [])]);

        const activityIds = Array.from(
          new Set([Number(id), ...(activityData.subActivities ? collectActivityIds(activityData.subActivities) : [])])
        );

        const allDocumentData = [
          ...(Array.isArray(documentData) ? documentData : []),
          ...(await Promise.all(
            activityIds.map((activityId) => documentsApi.getByActivityId(activityId))
          )).flat()
        ];

        const uniqueDocuments = Array.from(
          new Map(
            allDocumentData.map((doc: any) => [doc.id, doc])
          ).values()
        );

        setLinkedDocuments(
          uniqueDocuments.map((doc: any) => ({
            ...doc,
            name: doc.title || doc.name,
            type: doc.documentType || doc.type,
            uploadDate: doc.uploadDate ? new Date(doc.uploadDate).toISOString().split('T')[0] : ''
          }))
        );

        if (Array.isArray(departmentData) && departmentData.length > 0) {
          setCommentDepartmentId(departmentData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError('Failed to load activity details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityDetails();
  }, [id]);

  const normalizeDateInputValue = (value: string | Date | null | undefined) => {
    if (!value) return '';
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().split('T')[0];
  };

  const resetSubActivityForm = () => {
    const parentPlannedStartDate = activity?.plannedStartDate
      ? normalizeDateInputValue(activity.plannedStartDate)
      : '';

    setNewSubActivity({
      name: '',
      description: '',
      status: 'Active',
      priority: 'Medium',
      progress: 0,
      plannedStartDate: parentPlannedStartDate,
      plannedEndDate: '',
      plannedCost: '',
      actualCost: ''
    });
  };

  const handleCreateSubActivity = async () => {
    if (!newSubActivity.name.trim() || !newSubActivity.description.trim()) {
      setError('Sub-activity name and description are required');
      return;
    }

    const plannedCost = parseFloat(newSubActivity.plannedCost) || 0;
    const actualCost = parseFloat(newSubActivity.actualCost) || 0;
    if (plannedCost < 0 || actualCost < 0) {
      setError('Costs must be zero or positive values');
      return;
    }

    const parentPlannedCost = Number(activity?.plannedCost || 0);
    if (parentPlannedCost > 0) {
      const existingPlannedTotal = subActivities.reduce(
        (sum, sub) => sum + Number(sub.plannedCost || 0),
        0
      );
      if (existingPlannedTotal + plannedCost > parentPlannedCost) {
        const message = 'This sub-activity would exceed the main activity planned budget. Please reduce the sub-activity planned cost.';
        window.alert(message);
        setError(message);
        return;
      }
    }

    try {
      await activitiesApi.createSubActivity(parseInt(id!), {
        ...newSubActivity,
        plannedCost,
        actualCost
      });
      await fetchActivityDetails();
      resetSubActivityForm();
      setShowSubActivityForm(false);
      setError(null);
    } catch (err) {
      console.error('Error creating sub-activity:', err);
      const message = err instanceof Error ? err.message : 'Failed to create sub-activity';
      setError(message);
    }
  };

  const handleDeleteSubActivity = async (subActivityId: number) => {
    try {
      await activitiesApi.delete(subActivityId);
      await fetchActivityDetails();
    } catch (err) {
      console.error('Error deleting sub-activity:', err);
      setError('Failed to delete sub-activity');
    }
  };

  const handleUpdateSubActivityStatus = async (subActivityId: number, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'Completed') {
        updates.progress = 100;
      }
      await activitiesApi.update(subActivityId, updates);
      await fetchActivityDetails();
    } catch (err) {
      console.error('Error updating sub-activity:', err);
      setError('Failed to update sub-activity');
    }
  };

  const handleUpdateProgress = async (subActivityId: number, newProgress: number) => {
    try {
      setActivityActionLoading(true);
      console.log(`[Frontend] Updating sub-activity ${subActivityId} progress to ${newProgress}%`);
      const result = await activitiesApi.update(subActivityId, { progress: newProgress });
      console.log(`[Frontend] Update successful, result:`, result);
      await fetchActivityDetails();
      setError(null);
    } catch (err) {
      console.error('Error updating progress:', err);
      setError(`Failed to update progress: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActivityActionLoading(false);
    }
  };

  const handleUpdateActivityProgressValue = async (progressValue: number) => {
    if (!activity) return;
    if (subActivities.length > 0) {
      setError('Progress is auto-calculated from sub-activities and cannot be set manually.');
      return;
    }
    
    if (Number.isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      setError('Progress must be between 0 and 100');
      return;
    }
    try {
      setActivityActionLoading(true);
      const updated: any = await activitiesApi.update(activity.id, { progress: progressValue });
      setActivity({ ...activity, progress: updated.progress });
    } catch (err) {
      console.error('Error updating activity progress:', err);
      setError('Failed to update activity progress');
    } finally {
      setActivityActionLoading(false);
    }
  };

  const handleChangeActivityStatus = async () => {
    if (!activity) return;
    const statusOrder = ['Active', 'Inactive', 'Completed'];
    const nextStatus = statusOrder[(statusOrder.indexOf(activity.status) + 1) % statusOrder.length] || 'Active';
    try {
      setActivityActionLoading(true);
      const updated: any = await activitiesApi.update(activity.id, { status: nextStatus });
      setActivity({ ...activity, status: updated.status });
    } catch (err) {
      console.error('Error changing activity status:', err);
      setError('Failed to change activity status');
    } finally {
      setActivityActionLoading(false);
    }
  };

  const handleOpenLinkModal = async () => {
    try {
      setIsLinkModalOpen(true);
      const docs = await documentsApi.getAll();
      setAllDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error('Error fetching all documents:', err);
    }
  };

  const handleSelectLinkDocument = async (doc: any) => {
    try {
      setLinkingDocId(doc.id);
      const currentActivityId = Number(id);
      const existingIds = Array.isArray(doc.activityIds) ? doc.activityIds.map(Number) : [];
      
      const updatePayload: any = {};
      if (!doc.activityId) {
        updatePayload.activityId = currentActivityId;
      }
      if (!existingIds.includes(currentActivityId)) {
        updatePayload.activityIds = [...existingIds, currentActivityId];
      }
      
      if (Object.keys(updatePayload).length > 0) {
        await documentsApi.update(doc.id, updatePayload);
      }
      
      await fetchActivityDetails();
      setIsLinkModalOpen(false);
      setLinkSearchQuery("");
    } catch (err) {
      console.error('Error linking document:', err);
      setError('Failed to link document');
    } finally {
      setLinkingDocId(null);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    try {
      setUploadingDoc(true);
      setUploadError(null);
      
      const authorName = user ? `${user.firstName || ''} ${user.lastName || user.username}`.trim() : 'unknown';
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('author', authorName);
      formData.append('documentType', uploadType);
      formData.append('status', 'Review');
      if (activity?.projectId) {
        formData.append('projectId', String(activity.projectId));
      }
      formData.append('activityId', String(id));
      formData.append('activityIds', JSON.stringify([Number(id)]));
      
      await documentsApi.upload(formData);
      
      await fetchActivityDetails();
      
      setUploadFile(null);
      setUploadTitle('');
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error('Error uploading document:', err);
      setUploadError('Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const availableDocuments = useMemo(() => {
    const linkedIds = new Set(linkedDocuments.map((d) => Number(d.id)));
    return allDocuments.filter((doc) => {
      if (linkedIds.has(Number(doc.id))) return false;
      if (linkSearchQuery.trim()) {
        const query = linkSearchQuery.toLowerCase();
        const title = String(doc.title || doc.name || '').toLowerCase();
        return title.includes(query);
      }
      return true;
    });
  }, [allDocuments, linkedDocuments, linkSearchQuery]);

  const getDocumentSourceLabel = (doc: any) => {
    if (Array.isArray(doc.activityTags) && doc.activityTags.length > 0) {
      return `Activity: ${doc.activityTags.join(', ')}`;
    }
    if (doc.activityId) {
      return `Activity: ${doc.activityId}`;
    }
    if (doc.project) {
      return `Project: ${doc.project}`;
    }
    if (doc.projectId) {
      return `Project ID: ${doc.projectId}`;
    }
    return 'Linked document';
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (!commentDepartmentId) {
      setError('Please select a department for the comment');
      return;
    }

    if (!activity) return;

    try {
      setActivityActionLoading(true);
      const comment = await commentsApi.create({
        activityId: activity.id,
        content: newComment.trim(),
        departmentId: Number(commentDepartmentId)
      });
      setComments([comment, ...comments]);
      setNewComment('');
      setError(null);
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment');
    } finally {
      setActivityActionLoading(false);
    }
  };

  const handleEditActivity = () => {
    if (!activity || (!canEditFields && !canEditActualCost)) return;

    const matchedAssignedUser = users.find((user: any) => {
      const displayName = buildUserDisplayName(user);
      const rawName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
      return activity.assignedTo === displayName || activity.assignedTo === user?.username || activity.assignedTo === rawName;
    });

    setActivityForm({
      name: activity.name || '',
      description: activity.description || '',
      status: activity.status || 'Active',
      priority: activity.priority || 'Medium',
      assignedTo: matchedAssignedUser ? buildUserDisplayName(matchedAssignedUser) : activity.assignedTo || '',
      plannedStartDate: activity.plannedStartDate || '',
      plannedEndDate: activity.plannedEndDate || '',
      actualStartDate: activity.actualStartDate || '',
      actualEndDate: activity.actualEndDate || '',
      plannedCost: activity.plannedCost != null ? String(activity.plannedCost) : '',
      actualCost: activity.actualCost != null ? String(activity.actualCost) : '',
      progress: subActivities.length === 0 && activity.progress != null ? activity.progress : 0
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveActivity = async () => {
    if (!activity) return;
    if (!canEditFields && !canEditActualCost) {
      setError('You do not have permission to update this activity');
      return;
    }

    try {
      setActivityActionLoading(true);
      const updatedPayload: any = {};

      if (canEditFields) {
        updatedPayload.name = activityForm.name.trim();
        updatedPayload.description = activityForm.description.trim();
        updatedPayload.status = activityForm.status;
        updatedPayload.priority = activityForm.priority;
        updatedPayload.assignedTo = activityForm.assignedTo.trim();
        updatedPayload.plannedStartDate = activityForm.plannedStartDate;
        updatedPayload.plannedEndDate = activityForm.plannedEndDate;
        updatedPayload.actualStartDate = activityForm.actualStartDate;
        updatedPayload.actualEndDate = activityForm.actualEndDate;
        updatedPayload.plannedCost = activityForm.plannedCost ? parseFloat(activityForm.plannedCost) : 0;
        // Only allow manual progress when there are no sub-activities;
        // otherwise it is auto-calculated from sub-activity completion.
        if (subActivities.length === 0) {
          updatedPayload.progress = Number(activityForm.progress) || 0;
        }
      }

      if (canEditActualCost) {
        updatedPayload.actualCost = activityForm.actualCost ? parseFloat(activityForm.actualCost) : 0;
      }

      const updated: any = await activitiesApi.update(activity.id, updatedPayload);
      setActivity({
        ...activity,
        ...updated,
        title: updated.title || updated.name || activity.title,
        project: typeof updated.project === 'object' ? updated.project?.name : updated.project || activity.project
      });
      setError(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('Error editing activity:', err);
      setError('Failed to edit activity');
    } finally {
      setActivityActionLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!activity) return;
    const assignedTo = window.prompt('Reassign activity to', activity.assignedTo || '');
    if (assignedTo === null) return;
    try {
      setActivityActionLoading(true);
      const updated: any = await activitiesApi.update(activity.id, { assignedTo });
      setActivity({ ...activity, assignedTo: updated.assignedTo });
    } catch (err) {
      console.error('Error reassigning activity:', err);
      setError('Failed to reassign activity');
    } finally {
      setActivityActionLoading(false);
    }
  };

  const handleChangeDueDate = async () => {
    if (!activity) return;
    const plannedEnd = window.prompt('Enter new planned end date (YYYY-MM-DD)', activity.plannedEndDate || '');
    if (plannedEnd === null) return;
    try {
      setActivityActionLoading(true);
      const updated: any = await activitiesApi.update(activity.id, { plannedEndDate: plannedEnd });
      setActivity({ ...activity, plannedEndDate: updated.plannedEndDate });
    } catch (err) {
      console.error('Error changing due date:', err);
      setError('Failed to change due date');
    } finally {
      setActivityActionLoading(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!activity) return;
    if (!window.confirm('Delete this activity?')) return;
    try {
      await activitiesApi.delete(activity.id);
      navigate('/activities');
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading activity details...</p>
        </Card>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="space-y-6">
        <Card className="p-8">
          <p className="text-center text-gray-500">Activity not found</p>
        </Card>
      </div>
    );
  }

  // Fallback data structure if needed
  const displayActivity = activity || {
    id: parseInt(id || '1'),
    name: "Activity",
    description: "No description available",
    status: "Active",
    priority: "Medium",
    progress: 0,
    assignedTo: "Unassigned",
    plannedEndDate: new Date().toISOString().split('T')[0]
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "In Progress":
        return "secondary";
      case "Active":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "destructive";
      case "High":
        return "default";
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
      <div className="flex items-center gap-2 text-sm">
        <Link to="/projects" className="text-blue-600 hover:underline">
          Projects
        </Link>
        {activity?.project && (
          <>
            <span className="text-gray-400">/</span>
            <Link to={`/projects/${activity.project.id}`} className="text-blue-600 hover:underline">
              {typeof activity.project === 'object' ? activity.project.name : activity.project}
            </Link>
          </>
        )}
        {activity?.hierarchy && activity.hierarchy.length > 1 && (
          activity.hierarchy.slice(0, -1).map((item: any) => (
            <span key={`breadcrumb-${item.id}`} className="flex items-center gap-2">
              <span className="text-gray-400">/</span>
              <Link to={`/activities/${item.id}`} className="text-blue-600 hover:underline">
                {item.name}
              </Link>
            </span>
          ))
        )}
        {activity?.hierarchy && activity.hierarchy.length > 0 && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium">{activity.hierarchy[activity.hierarchy.length - 1].name}</span>
          </>
        )}
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl">{displayActivity.name}</h1>
          <div className="flex flex-col gap-3 mt-2 text-sm text-gray-600">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm text-gray-700">
                {displayActivity.description || "No description available"}
              </div>
              <div className="text-sm text-gray-700">
                Created: {displayActivity.createdAt ? new Date(displayActivity.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : "Unknown"}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {displayActivity.plannedStartDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Planned Start: {new Date(displayActivity.plannedStartDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                )}
              {displayActivity.plannedEndDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Planned End: {new Date(displayActivity.plannedEndDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                )}
              {displayActivity.assignedTo && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {displayActivity.assignedTo}
                </div>
              )}
            </div>
            {(displayActivity.plannedCost != null || displayActivity.actualCost != null) && (
              <div className="flex flex-wrap items-center gap-4">
                {displayActivity.plannedCost != null && (
                  <div className="text-sm text-gray-700">
                    Planned: ${Number(displayActivity.plannedCost).toLocaleString()}
                  </div>
                )}
                {displayActivity.actualCost != null && (
                  <div className="text-sm text-gray-700">
                    Actual: ${Number(displayActivity.actualCost).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {displayActivity.priority && (
            <Badge variant={getPriorityColor(displayActivity.priority)}>
              {displayActivity.priority}
            </Badge>
          )}
          <Badge variant="secondary">{displayActivity.status}</Badge>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* Progress */}
      <Card className="p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg">Progress</h3>
            <span className="text-2xl">{displayActivity.progress}%</span>
          </div>
          <Progress value={displayActivity.progress} className="h-3" />
          <div className="flex gap-2 mt-4 flex-wrap items-center">
            {subActivities.length === 0 ? (
              <div className="flex items-center gap-2 mr-4 bg-gray-50 border border-gray-200 rounded-md py-1 px-2">
                <label className="text-sm font-medium text-gray-700">Progress</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  className="w-16 h-7 text-center px-1"
                  defaultValue={displayActivity.progress}
                  disabled={!canEditFields || activityActionLoading}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 100) {
                      if (val !== displayActivity.progress) {
                        handleUpdateActivityProgressValue(val);
                      }
                    } else {
                      e.target.value = String(displayActivity.progress);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                />
                <span className="text-sm font-medium text-gray-700">%</span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic mr-4">Progress is auto-calculated from sub-activities</p>
            )}
            <Button size="sm" variant="outline" onClick={handleChangeActivityStatus} disabled={!canEditFields || activityActionLoading}>
              Change Status
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sub-Activities */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Sub-Activities</h3>
              {canCreateActivity ? (
                <Button 
                  size="sm" 
                  onClick={() => {
                    if (!showSubActivityForm) {
                      resetSubActivityForm();
                    }
                    setShowSubActivityForm(!showSubActivityForm);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sub-Activity
                </Button>
              ) : (
                <Button size="sm" variant="secondary" disabled title="Only Operations department users can add sub-activities">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sub-Activity
                </Button>
              )}
            </div>

            {showSubActivityForm && (
              <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded">
                <div>
                  <label className="block text-sm font-medium mb-1">Sub-Activity Name</label>
                  <Input
                    placeholder="Enter sub-activity name"
                    value={newSubActivity.name}
                    onChange={(e) => setNewSubActivity({...newSubActivity, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    placeholder="Enter sub-activity description"
                    rows={3}
                    value={newSubActivity.description}
                    onChange={(e) => setNewSubActivity({...newSubActivity, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <Select value={newSubActivity.priority} onValueChange={(value) => setNewSubActivity({...newSubActivity, priority: value})}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Select value={newSubActivity.status} onValueChange={(value) => setNewSubActivity({...newSubActivity, status: value})}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Completed">Completed</option>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Planned Start Date</label>
                    <Input
                      type="date"
                      value={newSubActivity.plannedStartDate}
                      onChange={(e) => setNewSubActivity({...newSubActivity, plannedStartDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Planned End Date</label>
                    <Input
                      type="date"
                      value={newSubActivity.plannedEndDate}
                      onChange={(e) => setNewSubActivity({...newSubActivity, plannedEndDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Planned Cost</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newSubActivity.plannedCost}
                      onChange={(e) => setNewSubActivity({...newSubActivity, plannedCost: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Actual Cost</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newSubActivity.actualCost}
                      onChange={(e) => setNewSubActivity({...newSubActivity, actualCost: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateSubActivity}>Create</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowSubActivityForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {subActivities.length === 0 ? (
              <p className="text-gray-500 text-sm">No sub-activities yet. Create one to get started!</p>
            ) : (
              <div className="space-y-3">
                {subActivities.map((subActivity) => (
                  <div key={subActivity.id} className="p-4 border rounded hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Link
                          to={`/activities/${subActivity.id}`}
                          className="block font-medium text-slate-900 hover:underline"
                        >
                          {subActivity.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">{subActivity.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityColor(subActivity.priority)}>
                          {subActivity.priority}
                        </Badge>
                        <Badge variant={getStatusColor(subActivity.status)}>
                          {subActivity.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteSubActivity(subActivity.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                        <div>Planned Cost: ${Number(subActivity.plannedCost || 0).toLocaleString()}</div>
                        <div>Actual Cost: ${Number(subActivity.actualCost || 0).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium">{subActivity.progress}%</span>
                      </div>
                      <Progress value={subActivity.progress} className="h-2" />
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateSubActivityStatus(subActivity.id, 'Completed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                        {!(subActivity.subActivities && subActivity.subActivities.length > 0) ? (
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md py-1 px-2">
                            <label className="text-sm font-medium text-gray-700">Progress</label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              defaultValue={subActivity.progress}
                              className="w-16 h-7 text-center px-1"
                              onBlur={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val) && val >= 0 && val <= 100) {
                                  if (val !== subActivity.progress) {
                                    handleUpdateProgress(subActivity.id, val);
                                  }
                                } else {
                                  e.target.value = String(subActivity.progress);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                            />
                            <span className="text-sm font-medium text-gray-700">%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Auto-calculated from sub-activities</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Linked Documents */}
          <Card className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2 font-semibold">
              <FileText className="h-5 w-5 text-gray-700" />
              Linked Documents
            </h3>
            
            <div className="space-y-4">
              {/* Premium Dotted Drag-and-Upload Box */}
              {canUpload && (
                <div
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-xl cursor-pointer bg-gray-50/50 hover:bg-blue-50/20 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm text-blue-600 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-3 group-hover:text-blue-600 transition-colors">
                    Upload New Document
                  </p>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Directly attach files to this activity concessions
                  </p>
                </div>
              )}

              {/* Linked Documents List */}
              {linkedDocuments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4 italic bg-gray-50/30 rounded-lg border border-gray-100">
                  No documents linked to this activity yet.
                </p>
              ) : (
                <div className="grid gap-3">
                  {linkedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3.5 border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/30 rounded-xl transition-all shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50/60 rounded-lg text-blue-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{doc.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-50 font-normal">
                              {doc.type}
                            </Badge>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-[11px] text-gray-400">
                              {doc.uploadDate}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md inline-block">
                            {getDocumentSourceLabel(doc)}
                          </p>
                        </div>
                      </div>
                      <Link to={`/documents/${doc.id}`}>
                        <Button size="sm" variant="outline" className="h-8 hover:bg-gray-100">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 flex items-center justify-center gap-1.5 h-9 bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
              onClick={handleOpenLinkModal}
            >
              <Link2 className="h-4 w-4 text-gray-500" />
              Link Existing Document
            </Button>
          </Card>

          {/* Comments */}
          <Card className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments
            </h3>
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500">No comments yet. Add the first department-tagged comment.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">{comment.author?.username || comment.user || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : comment.date}</span>
                          {comment.department?.name && (
                            <Badge variant="outline" className="text-xs">
                              {comment.department.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.content || comment.text}</p>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Comment Department</label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={commentDepartmentId}
                  onChange={(e) => setCommentDepartmentId(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <Textarea
                placeholder="Add a comment..."
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button size="sm" onClick={handlePostComment} disabled={activityActionLoading}>
                Post Comment
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Details</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Status</p>
                <Badge variant="secondary" className="mt-1">
                  {displayActivity.status}
                </Badge>
              </div>
              <Separator />
              {displayActivity.priority && (
                <>
                  <div>
                    <p className="text-gray-600">Priority</p>
                    <Badge variant={getPriorityColor(displayActivity.priority)} className="mt-1">
                      {displayActivity.priority}
                    </Badge>
                  </div>
                  <Separator />
                </>
              )}
              {displayActivity.assignedTo && (
                <>
                  <div>
                    <p className="text-gray-600">Assigned To</p>
                    <p className="mt-1">{displayActivity.assignedTo}</p>
                  </div>
                  <Separator />
                </>
              )}
              {displayActivity.plannedEndDate && (
                <>
                  <div>
                    <p className="text-gray-600">Planned End Date</p>
                    <p className="mt-1">{new Date(displayActivity.plannedEndDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</p>
                  </div>
                  <Separator />
                </>
              )}
              <div>
                <p className="text-gray-600">Total Sub-Activities</p>
                <p className="mt-1 text-lg font-medium">{subActivities.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Actions</h4>
            <div className="space-y-2">
              {canEditFields || canEditActualCost ? (
                <Button variant="outline" className="w-full" onClick={handleEditActivity}>
                  Edit Activity
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled title="Only Operations or Finance can edit this activity">
                  Edit Activity
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={handleReassign} disabled={!canEditFields} title={!canEditFields ? 'Only Operations department users can reassign' : undefined}>
                Reassign
              </Button>
              <Button variant="outline" className="w-full" onClick={handleChangeDueDate} disabled={!canEditFields} title={!canEditFields ? 'Only Operations department users can change planned end date' : undefined}>
                Change Planned End
              </Button>
              <Button variant="destructive" className="w-full" onClick={handleDeleteActivity} disabled={!canEditFields} title={!canEditFields ? 'Only Operations department users can delete activities' : undefined}>
                Delete Activity
              </Button>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Activity</DialogTitle>
                  <DialogDescription>
                    Update the activity details and save your changes.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      disabled={!canEditFields}
                      value={activityForm.name}
                      onChange={(event) => setActivityForm({ ...activityForm, name: event.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      disabled={!canEditFields}
                      value={activityForm.description}
                      onChange={(event) => setActivityForm({ ...activityForm, description: event.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        disabled={!canEditFields}
                        value={activityForm.status}
                        onValueChange={(value) => setActivityForm({ ...activityForm, status: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select
                        disabled={!canEditFields}
                        value={activityForm.priority}
                        onValueChange={(value) => setActivityForm({ ...activityForm, priority: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Assigned To</label>
                      <Input
                        disabled={!canEditFields}
                        list="users-datalist-edit"
                        placeholder="Type or select a user..."
                        value={activityForm.assignedTo}
                        onChange={(event) => setActivityForm({ ...activityForm, assignedTo: event.target.value })}
                      />
                      <datalist id="users-datalist-edit">
                        {users.map((u: any) => {
                          const displayName = buildUserDisplayName(u);
                          const rawName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username;
                          return <option key={u.id} value={rawName}>{u.departmentDetails?.name || u.department || 'No Dept'}</option>;
                        })}
                      </datalist>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Planned Start</label>
                      <Input
                        disabled={!canEditFields}
                        type="date"
                        value={activityForm.plannedStartDate}
                        onChange={(event) => setActivityForm({ ...activityForm, plannedStartDate: event.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Planned End</label>
                      <Input
                        disabled={!canEditFields}
                        type="date"
                        value={activityForm.plannedEndDate}
                        onChange={(event) => setActivityForm({ ...activityForm, plannedEndDate: event.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Progress (%)</label>
                      {subActivities.length > 0 ? (
                        <div className="flex items-center gap-2 px-3 py-2 border rounded bg-gray-50">
                          <span className="text-sm text-gray-500 italic">
                            Auto-calculated from sub-activities ({activity?.progress ?? 0}%)
                          </span>
                        </div>
                      ) : (
                        <Input
                          disabled={!canEditFields}
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={String(activityForm.progress)}
                          onChange={(event) => setActivityForm({ ...activityForm, progress: Number(event.target.value) })}
                        />
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Actual Start</label>
                      <Input
                        disabled={!canEditFields}
                        type="date"
                        value={activityForm.actualStartDate}
                        onChange={(event) => setActivityForm({ ...activityForm, actualStartDate: event.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Actual End</label>
                      <Input
                        disabled={!canEditFields}
                        type="date"
                        value={activityForm.actualEndDate}
                        onChange={(event) => setActivityForm({ ...activityForm, actualEndDate: event.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Planned Cost</label>
                      <Input
                        disabled={!canEditFields}
                        type="number"
                        step="0.01"
                        value={activityForm.plannedCost}
                        onChange={(event) => setActivityForm({ ...activityForm, plannedCost: event.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Actual Cost</label>
                      <Input
                        disabled={!canEditActualCost}
                        type="number"
                        step="0.01"
                        value={activityForm.actualCost}
                        onChange={(event) => setActivityForm({ ...activityForm, actualCost: event.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="space-x-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSaveActivity} disabled={activityActionLoading}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Link Existing Document Dialog */}
            <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-bold text-gray-900">
                    <Link2 className="h-5 w-5 text-blue-600" />
                    Link Existing Document
                  </DialogTitle>
                  <DialogDescription>
                    Search and select a document from the system to link it to this activity.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search documents by title..."
                      value={linkSearchQuery}
                      onChange={(e) => setLinkSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {availableDocuments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No available documents found matching your search.
                      </p>
                    ) : (
                      availableDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border border-gray-100 hover:bg-gray-50 rounded-lg transition-all"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.title || doc.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {doc.documentType || doc.type || 'General'} • By {doc.author || 'System'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSelectLinkDocument(doc)}
                            disabled={linkingDocId === doc.id}
                            className="h-8 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border-none"
                          >
                            {linkingDocId === doc.id ? 'Linking...' : 'Link'}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Upload New Document Dialog */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-bold text-gray-900">
                    <UploadCloud className="h-5 w-5 text-blue-600" />
                    Upload Document
                  </DialogTitle>
                  <DialogDescription>
                    Select and configure a document to upload and attach directly to this activity.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-2">
                  {uploadError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                      {uploadError}
                    </div>
                  )}

                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Select File</label>
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setUploadFile(file);
                        if (file && !uploadTitle) {
                          setUploadTitle(file.name);
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Document Title</label>
                    <Input
                      placeholder="Enter document title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Document Type</label>
                    <Select value={uploadType} onValueChange={setUploadType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="HSE">HSE</SelectItem>
                        <SelectItem value="Report">Report</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="space-x-2">
                  <DialogClose asChild>
                    <Button variant="outline" disabled={uploadingDoc}>Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleUploadDocument}
                    disabled={uploadingDoc || !uploadFile}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {uploadingDoc ? 'Uploading...' : 'Upload File'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
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
import { ArrowLeft, Calendar, User, FileText, MessageSquare, Plus, Trash2, CheckCircle } from "lucide-react";
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
  const [activityActionLoading, setActivityActionLoading] = useState(false);
  const { user } = useAuth();
  const departmentName = user?.department || user?.departmentDetails?.name || '';
  const isOperationsUser = departmentName.toLowerCase().includes('operation');
  const isFinanceUser = departmentName.toLowerCase().includes('finance');
  const isAdminUser = user?.role === 'Admin';
  const canEditFields = isAdminUser || isOperationsUser;
  const canEditActualCost = isAdminUser || isFinanceUser;
  const canCreateActivity = isAdminUser || isOperationsUser;

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
        setLinkedDocuments(
          Array.isArray(documentData)
            ? documentData.map((doc: any) => ({
                ...doc,
                name: doc.title || doc.name,
                type: doc.documentType || doc.type,
                uploadDate: doc.uploadDate ? new Date(doc.uploadDate).toISOString().split('T')[0] : ''
              }))
            : []
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

  const handleUpdateActivityProgress = async () => {
    if (!activity) return;
    if (subActivities.length > 0) {
      setError('Progress is auto-calculated from sub-activities and cannot be set manually.');
      return;
    }
    const progressInput = window.prompt('Enter new progress value (0-100)', String(activity.progress ?? 0));
    if (progressInput === null) return;
    const progressValue = Number(progressInput);
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

  const handleLinkDocument = () => {
    const name = window.prompt('Enter document name to link');
    if (!name) return;
    const newDoc = {
      id: Date.now(),
      name,
      type: 'Linked',
      uploadDate: new Date().toISOString().split('T')[0]
    };
    setLinkedDocuments([newDoc, ...linkedDocuments]);
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
              <Button size="sm" variant="outline" onClick={handleUpdateActivityProgress} disabled={!canEditFields || activityActionLoading}>
                Update Progress
              </Button>
            ) : (
              <p className="text-xs text-gray-500 italic">Progress is auto-calculated from sub-activities</p>
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
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={subActivity.progress}
                              onChange={(e) => handleUpdateProgress(subActivity.id, parseInt(e.target.value, 10))}
                              className="w-40"
                            />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={subActivity.progress}
                              onChange={(e) => handleUpdateProgress(subActivity.id, Math.max(0, Math.min(100, Number(e.target.value || 0))))}
                              className="w-16 text-sm px-2 py-1 border rounded"
                            />
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
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Linked Documents
            </h3>
            <div className="space-y-2">
              {linkedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <div>
                      <p className="text-sm">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {doc.type} • {doc.uploadDate}
                      </p>
                    </div>
                  </div>
                  <Link to={`/documents/${doc.id}`}>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3" onClick={handleLinkDocument}>
              Link Document
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
                      <Select
                        disabled={!canEditFields}
                        value={activityForm.assignedTo}
                        onValueChange={(value) => setActivityForm({ ...activityForm, assignedTo: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user: any) => {
                            const displayName = buildUserDisplayName(user);
                            return (
                              <SelectItem key={user.id} value={displayName}>
                                {displayName}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
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
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Search, Plus, LayoutList, LayoutGrid, ChevronDown, ChevronRight } from "lucide-react";
import { Progress } from "../components/ui/progress";
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
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { activitiesApi, projectsApi, usersApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";

// Activities are loaded from the API; no local defaults are used.

export function Activities() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newActivity, setNewActivity] = useState<any>({
    title: "",
    projectId: null,
    assignedTo: "",
    plannedStartDate: "",
    plannedEndDate: "",
    plannedCost: '',
    priority: "Medium",
    status: "Active",
    description: "",
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, canEdit } = useAuth();
  const departmentName = user?.department || user?.departmentDetails?.name || '';
  const isOperationsUser = departmentName.toLowerCase().includes('operation');
  const canCreateActivity = canEdit && (user?.role === 'Admin' || isOperationsUser);

  // Load activities and projects
  async function fetchActivities() {
    try {
      setLoading(true);
      setError(null);
      const data = await activitiesApi.getAll();
      const transformedData = (Array.isArray(data) ? data : []).map((activity: any) => ({
        ...activity,
        // Ensure title is available
        title: activity.title || activity.name,
        // Extract project name from project object if it exists
        project: typeof activity.project === 'object' ? activity.project?.name : activity.project,
        // Transform sub-activities
        subActivities: (activity.subActivities || []).map((sub: any) => ({
          ...sub,
          title: sub.title || sub.name
        }))
      }));
      setActivities(transformedData);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setActivities([]);
      setError('Could not load activities from server');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjects() {
    try {
      const data = await projectsApi.getAll();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    }
  }

  async function fetchUsers() {
    try {
      const data = await usersApi.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  }

  useEffect(() => {
    fetchActivities();
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    const handler = (e: any) => setSearchQuery(e?.detail?.query || "");
    window.addEventListener('globalSearch', handler as EventListener);
    return () => window.removeEventListener('globalSearch', handler as EventListener);
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredActivities = normalizedSearch
    ? activities.filter((a) => {
        const text = [a.title, a.project, a.assignedTo, a.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        // also check sub-activities
        const subText = (a.subActivities || [])
          .map((s: any) => (s.title || s.name || '')).join(' ').toLowerCase();
        return text.includes(normalizedSearch) || subText.includes(normalizedSearch);
      })
    : activities;

  const toggleActivityExpand = (id: number) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedActivities(newExpanded);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "Active":
        return "secondary";
      case "Inactive":
        return "outline";
      default:
        return "outline";
    }
  };

  const parentActivities = filteredActivities
    .filter(a => !a.parentActivityId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  // Kanban columns use the real Activity.status enum ('Active' | 'Inactive' |
  // 'Completed' — see backend/models/Activity.js) rather than 'To Do'/'In
  // Progress' strings that no create/edit form or API path ever sets (bug
  // fixed 2026-07-07 — those two columns were permanently empty before).
  const inactiveActivities = parentActivities.filter((a) => a.status === "Inactive");
  const activeActivities = parentActivities.filter((a) => a.status === "Active");
  const completedActivities = parentActivities.filter((a) => a.status === "Completed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Activities</h1>
          <p className="text-gray-500 mt-1">Track and manage project activities with sub-tasks</p>
        </div>
          <div className="flex items-center gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          {canCreateActivity ? (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Activity</DialogTitle>
                  <DialogDescription>Add a new activity to the project</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label>Title</Label>
                    <Input value={newActivity.title} onChange={(e) => setNewActivity({...newActivity, title: e.target.value})} />
                  </div>
                  <div>
                    <Label>Project</Label>
                    <select
                      data-slot="select"
                      className="w-full rounded-md border px-3 py-1"
                      value={newActivity.projectId ?? ''}
                      onChange={(e) => setNewActivity({ ...newActivity, projectId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">-- Select project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Assigned To</Label>
                    <Input 
                      list="users-datalist-create"
                      placeholder="Type or select a user..."
                      value={newActivity.assignedTo} 
                      onChange={(e) => setNewActivity({...newActivity, assignedTo: e.target.value})} 
                    />
                    <datalist id="users-datalist-create">
                      {users.map((u: any) => {
                        const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username;
                        const dept = u.departmentDetails?.name || u.department || 'No Dept';
                        return <option key={u.id} value={name}>{dept}</option>;
                      })}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label>Planned Start</Label>
                      <Input type="date" value={newActivity.plannedStartDate} onChange={(e) => setNewActivity({...newActivity, plannedStartDate: e.target.value})} />
                    </div>
                    <div>
                      <Label>Planned End</Label>
                      <Input type="date" value={newActivity.plannedEndDate} onChange={(e) => setNewActivity({...newActivity, plannedEndDate: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <select
                      className="w-full rounded-md border px-3 py-1"
                      value={newActivity.priority}
                      onChange={(e) => setNewActivity({...newActivity, priority: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <Label>Planned Cost</Label>
                    <Input type="number" step="0.01" value={newActivity.plannedCost} onChange={(e) => setNewActivity({...newActivity, plannedCost: e.target.value})} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select
                      className="w-full rounded-md border px-3 py-1"
                      value={newActivity.status}
                      onChange={(e) => setNewActivity({...newActivity, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={newActivity.description} onChange={(e) => setNewActivity({...newActivity, description: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={async () => {
                      try {
                        setCreating(true);
                        await activitiesApi.create({
                          name: newActivity.title,
                          title: newActivity.title,
                          projectId: newActivity.projectId,
                          assignedTo: newActivity.assignedTo,
                          plannedStartDate: newActivity.plannedStartDate,
                          plannedEndDate: newActivity.plannedEndDate,
                          plannedCost: newActivity.plannedCost ? parseFloat(newActivity.plannedCost) : 0,
                          priority: newActivity.priority,
                          description: newActivity.description,
                          status: newActivity.status,
                        });
                        setIsCreateOpen(false);
                        setNewActivity({ title: '', projectId: null, assignedTo: '', plannedStartDate: '', plannedEndDate: '', priority: 'Medium', status: 'Active', description: '' });
                        await fetchActivities();
                      } catch (err) {
                        console.error('Create activity error', err);
                        setError('Failed to create activity');
                      } finally {
                        setCreating(false);
                        setLoading(false);
                      }
                    }}
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="secondary" disabled title="Only Operations department users can create activities">
              <Plus className="h-4 w-4 mr-2" />
              New Activity
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search activities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading activities...</p>
        </Card>
      ) : (
        <>
          {viewMode === "table" ? (
        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parentActivities.map((activity) => (
                <>
                  <TableRow key={`activity-${activity.id}`} className="hover:bg-gray-50">
                    <TableCell className="w-10">
                      {activity.subActivities && activity.subActivities.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActivityExpand(activity.id)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedActivities.has(activity.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/activities/${activity.id}`}
                        className="hover:underline font-medium"
                      >
                        {activity.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {activity.project}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.assignedTo}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(activity.priority)}>
                        {activity.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={activity.progress} className="h-2 w-20" />
                        <span className="text-sm">{activity.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDisplayDateOrDefault(activity.plannedEndDate)}</TableCell>
                    <TableCell>
                      <Link to={`/activities/${activity.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>

                  {expandedActivities.has(activity.id) && activity.subActivities && activity.subActivities.length > 0 && (
                    (activity.subActivities as any[])
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((subActivity: any) => (
                      <TableRow key={`subactivity-${subActivity.id}`} className="bg-gray-50 hover:bg-gray-100 cursor-pointer">
                        <TableCell></TableCell>
                        <TableCell>
                          <Link to={`/activities/${subActivity.id}`} className="pl-6 text-sm font-medium text-gray-700 hover:underline block">
                            ↳ {subActivity.title}
                          </Link>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(subActivity.status)}>
                            {subActivity.status}
                          </Badge>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={subActivity.progress} className="h-2 w-20" />
                            <span className="text-sm">{subActivity.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <Link to={`/activities/${subActivity.id}`}>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inactive Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Inactive</h3>
              <Badge variant="outline">{inactiveActivities.length}</Badge>
            </div>
            <div className="space-y-3">
              {inactiveActivities.map((activity) => (
                <Card key={activity.id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <Link to={`/activities/${activity.id}`}>
                        <h4 className="font-medium hover:underline">
                          {activity.title}
                        </h4>
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.project}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(activity.priority)}>
                        {activity.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Planned End: {formatDisplayDateOrDefault(activity.plannedEndDate)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Assigned: {activity.assignedTo}
                    </div>
                    {activity.subActivities && activity.subActivities.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          Sub-activities ({activity.subActivities.length})
                        </p>
                        <div className="space-y-1">
                          {activity.subActivities.map((sub: any) => (
                            <div key={sub.id} className="text-xs text-gray-600 pl-2">
                              <span className="text-gray-400">└</span> {sub.title}
                              <Badge variant={getStatusColor(sub.status)} className="ml-2 text-xs">
                                {sub.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Active Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Active</h3>
              <Badge variant="outline">{activeActivities.length}</Badge>
            </div>
            <div className="space-y-3">
              {activeActivities.map((activity) => (
                <Card key={activity.id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <Link to={`/activities/${activity.id}`}>
                        <h4 className="font-medium hover:underline">
                          {activity.title}
                        </h4>
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.project}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(activity.priority)}>
                        {activity.priority}
                      </Badge>
                    </div>
                    <div>
                      <Progress value={activity.progress} className="h-2" />
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.progress}% complete
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      Planned End: {formatDisplayDateOrDefault(activity.plannedEndDate)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Assigned: {activity.assignedTo}
                    </div>
                    {activity.subActivities && activity.subActivities.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          Sub-activities ({activity.subActivities.length})
                        </p>
                        <div className="space-y-1">
                          {activity.subActivities.map((sub: any) => (
                            <div key={sub.id} className="text-xs text-gray-600 pl-2">
                              <span className="text-gray-400">└</span> {sub.title}
                              <Badge variant={getStatusColor(sub.status)} className="ml-2 text-xs">
                                {sub.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Completed</h3>
              <Badge variant="outline">{completedActivities.length}</Badge>
            </div>
            <div className="space-y-3">
              {completedActivities.map((activity) => (
                <Card key={activity.id} className="p-4 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <Link to={`/activities/${activity.id}`}>
                        <h4 className="font-medium hover:underline">
                          {activity.title}
                        </h4>
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.project}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(activity.priority)}>
                        {activity.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Completed: {formatDisplayDateOrDefault(activity.plannedEndDate)}
                    </div>
                    <div className="text-sm text-gray-600">
                      By: {activity.assignedTo}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

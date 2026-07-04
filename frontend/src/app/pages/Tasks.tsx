import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Plus, Clock, AlertCircle, CheckCircle, Search, Filter, Users, MessageSquare, History, ListTree, Paperclip, Upload } from "lucide-react";
import { tasksApi, usersApi, commentsApi, departmentsApi, documentsApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";
import { formatDisplayDateOrDefault } from "../lib/date";

export function Tasks() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [workload, setWorkload] = useState<any[]>([]);
  const [workloadLoading, setWorkloadLoading] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [searchQuery, setSearchQuery] = useState("");
  // §5.8 guaranteed drill-down: pre-apply the status filter forwarded via
  // query params from the Executive Dashboard's filter bar.
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Not Started",
    priority: "Medium",
    dueDate: "",
    assignedToId: "self"
  });

  // Task detail modal (subtasks, comments, history, attachments — §5.3)
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<"subtasks" | "comments" | "history" | "attachments">("subtasks");
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [taskDocuments, setTaskDocuments] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [progressInput, setProgressInput] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [commentDepartmentId, setCommentDepartmentId] = useState<string>("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [myData, assignedData, usersData, departmentsData] = await Promise.all([
        tasksApi.getMyTasks(),
        tasksApi.getAssignedByMe(),
        usersApi.getAll().catch(() => []), // Fallback if admin users API differs
        departmentsApi.getAll().catch(() => [])
      ]);
      setMyTasks(Array.isArray(myData) ? myData : []);
      setAssignedTasks(Array.isArray(assignedData) ? assignedData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      const deptList = Array.isArray(departmentsData) ? departmentsData : [];
      setDepartments(deptList);
      if (deptList.length > 0) setCommentDepartmentId(String(deptList[0].id));
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkload = async () => {
    try {
      setWorkloadLoading(true);
      const data = await tasksApi.getWorkload();
      setWorkload(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load workload", err);
    } finally {
      setWorkloadLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "workload") loadWorkload();
  }, [activeTab]);

  const openTaskDetail = async (task: any) => {
    setSelectedTask(task);
    setDetailTab("subtasks");
    setProgressInput(task.progress ?? 0);
    setDetailLoading(true);
    try {
      const [subs, comments, history, docs] = await Promise.all([
        tasksApi.getSubtasks(task.id).catch(() => []),
        commentsApi.getByTaskId(task.id).catch(() => []),
        tasksApi.getHistory(task.id).catch(() => []),
        documentsApi.getByTaskId(task.id).catch(() => [])
      ]);
      setSubtasks(Array.isArray(subs) ? subs : []);
      setTaskComments(Array.isArray(comments) ? comments : []);
      setTaskHistory(Array.isArray(history) ? history : []);
      setTaskDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error("Failed to load task detail", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeTaskDetail = () => {
    setSelectedTask(null);
    setNewSubtaskTitle("");
    setNewCommentText("");
  };

  const handleSaveProgress = async () => {
    if (!selectedTask) return;
    setSavingProgress(true);
    try {
      const updated: any = await tasksApi.update(selectedTask.id, { progress: progressInput });
      setSelectedTask(updated);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update progress.");
    } finally {
      setSavingProgress(false);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newSubtaskTitle.trim()) return;
    try {
      await tasksApi.create({ title: newSubtaskTitle.trim(), parentTaskId: selectedTask.id, assignedToId: selectedTask.assignedToId });
      setNewSubtaskTitle("");
      const subs = await tasksApi.getSubtasks(selectedTask.id);
      setSubtasks(Array.isArray(subs) ? subs : []);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add subtask.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newCommentText.trim() || !commentDepartmentId) return;
    try {
      const comment = await commentsApi.create({
        taskId: selectedTask.id,
        content: newCommentText.trim(),
        departmentId: Number(commentDepartmentId)
      });
      setTaskComments((prev) => [...prev, comment]);
      setNewCommentText("");
    } catch (err: any) {
      alert(err.message || "Failed to add comment.");
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedTask) return;
    const file = e.target.files[0];
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name);
      fd.append("documentType", "Report");
      fd.append("taskId", String(selectedTask.id));
      await documentsApi.upload(fd);
      const docs = await documentsApi.getByTaskId(selectedTask.id);
      setTaskDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      alert("Failed to upload attachment");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tasksApi.create({
        ...formData,
        assignedToId: formData.assignedToId && formData.assignedToId !== "self" ? parseInt(formData.assignedToId) : undefined
      });
      setShowModal(false);
      setFormData({
        title: "",
        description: "",
        status: "Not Started",
        priority: "Medium",
        dueDate: "",
        assignedToId: "self"
      });
      loadData();
    } catch (err) {
      console.error("Failed to create task", err);
      alert("Failed to create task");
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      await tasksApi.update(taskId, { status: newStatus });
      loadData();
    } catch (err: any) {
      console.error("Failed to update status", err);
      alert(err.message || "Failed to update status.");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "destructive";
      case "High": return "default";
      case "Medium": return "outline";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "In Progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Blocked": return "bg-red-100 text-red-800 border-red-200";
      case "Overdue": return "bg-red-100 text-red-900 border-red-300 font-semibold";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getFilteredTasks = (tasks: any[]) => {
    return tasks.filter(task => {
      const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const currentList = activeTab === "assigned-by-me" ? assignedTasks : myTasks;
  const filteredList = getFilteredTasks(currentList);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage your work and delegate assignments</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="my-tasks">My Tasks ({myTasks.length})</TabsTrigger>
              <TabsTrigger value="assigned-by-me">Assigned by Me ({assignedTasks.length})</TabsTrigger>
              <TabsTrigger value="workload" className="gap-1">
                <Users className="h-3.5 w-3.5" />
                Workload
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === "workload" ? (
          <div className="p-6">
            {workloadLoading ? (
              <p className="text-sm text-gray-500">Loading workload...</p>
            ) : workload.length === 0 ? (
              <p className="text-sm text-gray-500">No open tasks assigned to anyone yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Open Tasks</TableHead>
                    <TableHead>Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workload.map((w, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell>{w.openTasks}</TableCell>
                      <TableCell>
                        {w.overdueTasks > 0 ? (
                          <Badge variant="destructive">{w.overdueTasks}</Badge>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
        <>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              {activeTab === "assigned-by-me" && <TableHead>Assignee</TableHead>}
              {activeTab === "my-tasks" && <TableHead>Assigner</TableHead>}
              <TableHead>Priority</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading tasks...</TableCell>
              </TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  No tasks found in this view.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <button
                      type="button"
                      className="font-medium text-gray-900 hover:text-blue-600 hover:underline text-left"
                      onClick={() => openTaskDetail(task)}
                    >
                      {task.title}
                    </button>
                    <div className="text-xs text-gray-500 line-clamp-1">{task.description}</div>
                    {task.parentTaskId && (
                      <Badge variant="outline" className="mt-1 text-[10px] gap-1">
                        <ListTree className="h-2.5 w-2.5" />
                        Subtask
                      </Badge>
                    )}
                  </TableCell>
                  
                  {activeTab === "assigned-by-me" && (
                    <TableCell className="text-sm">
                      {task.Assignee ? `${task.Assignee.firstName} ${task.Assignee.lastName}` : 'Unassigned'}
                    </TableCell>
                  )}
                  {activeTab === "my-tasks" && (
                    <TableCell className="text-sm">
                      {task.Assigner ? `${task.Assigner.firstName} ${task.Assigner.lastName}` : 'System'}
                    </TableCell>
                  )}

                  <TableCell>
                    <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  </TableCell>
                  <TableCell className="w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${task.progress >= 100 ? "bg-green-500" : "bg-blue-500"}`}
                          style={{ width: `${Math.min(100, Math.max(0, task.progress || 0))}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{task.progress ?? 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {task.dueDate ? formatDisplayDateOrDefault(task.dueDate) : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select 
                        value={task.status} 
                        onValueChange={(val) => handleUpdateStatus(task.id, val)}
                      >
                        <SelectTrigger className="h-8 w-full text-xs">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(task.relatedType === 'Activity' || task.relatedType === 'Workflow') && (
                      <Link to={task.relatedType === 'Activity' ? `/activities/${task.relatedId}` : `/workflows/${task.relatedId}`}>
                        <Button size="sm" variant="outline" className="h-8">Open</Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </>
        )}
      </Card>

      {/* Create Task Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle>Create New Task</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Task Title *</label>
                  <Input 
                    required 
                    placeholder="e.g., Review Q3 Financials" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea 
                    placeholder="Provide details..." 
                    className="h-24"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Assign To</label>
                    <Select 
                      value={formData.assignedToId} 
                      onValueChange={(val) => setFormData({...formData, assignedToId: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user (default: self)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Assign to myself</SelectItem>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id.toString()}>{u.firstName} {u.lastName} ({u.username})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Due Date</label>
                    <Input 
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority</label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(val) => setFormData({...formData, priority: val})}
                    >
                      <SelectTrigger>
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
                  <div>
                    <label className="text-sm font-medium mb-1 block">Initial Status</label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(val) => setFormData({...formData, status: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task Detail Modal — subtasks, comments, attachments, status history (§5.3) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b bg-gray-50/50 flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{selectedTask.title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{selectedTask.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeTaskDetail}>Close</Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Progress with owner-confirmation gating (server-enforced) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Progress</label>
                  <span className="text-sm text-gray-500">{progressInput}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progressInput}
                    onChange={(e) => setProgressInput(Number(e.target.value))}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSaveProgress} disabled={savingProgress}>
                    {savingProgress ? "Saving..." : "Save"}
                  </Button>
                </div>
                {progressInput >= 100 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Marking 100% requires owner confirmation — only the assigned owner or an Admin can save this.
                  </p>
                )}
              </div>

              <Tabs value={detailTab} onValueChange={(v) => setDetailTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="subtasks" className="gap-1"><ListTree className="h-3.5 w-3.5" />Subtasks ({subtasks.length})</TabsTrigger>
                  <TabsTrigger value="comments" className="gap-1"><MessageSquare className="h-3.5 w-3.5" />Comments ({taskComments.length})</TabsTrigger>
                  <TabsTrigger value="attachments" className="gap-1"><Paperclip className="h-3.5 w-3.5" />Attachments ({taskDocuments.length})</TabsTrigger>
                  <TabsTrigger value="history" className="gap-1"><History className="h-3.5 w-3.5" />History</TabsTrigger>
                </TabsList>

                {detailLoading ? (
                  <p className="text-sm text-gray-500 mt-4">Loading...</p>
                ) : (
                  <>
                    <TabsContent value="subtasks" className="space-y-3 mt-4">
                      {subtasks.length === 0 ? (
                        <p className="text-sm text-gray-500">No subtasks yet.</p>
                      ) : (
                        subtasks.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-2 rounded border">
                            <div>
                              <p className="text-sm font-medium">{s.title}</p>
                              <p className="text-xs text-gray-500">{s.status} · {s.progress ?? 0}%</p>
                            </div>
                            <Badge variant="outline" className={getStatusColor(s.status)}>{s.status}</Badge>
                          </div>
                        ))
                      )}
                      <form onSubmit={handleAddSubtask} className="flex gap-2 pt-2">
                        <Input
                          placeholder="New subtask title"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        />
                        <Button type="submit" size="sm">Add</Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="comments" className="space-y-3 mt-4">
                      {taskComments.length === 0 ? (
                        <p className="text-sm text-gray-500">No comments yet.</p>
                      ) : (
                        taskComments.map((c) => (
                          <div key={c.id} className="p-2 rounded border bg-gray-50">
                            <p className="text-sm">{c.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {c.author ? `${c.author.firstName || ''} ${c.author.lastName || ''}`.trim() || c.author.username : 'Unknown'} · {formatDisplayDateOrDefault(c.createdAt)}
                            </p>
                          </div>
                        ))
                      )}
                      <form onSubmit={handleAddComment} className="space-y-2 pt-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Select value={commentDepartmentId} onValueChange={setCommentDepartmentId}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="submit" size="sm">Post</Button>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="attachments" className="space-y-3 mt-4">
                      {taskDocuments.length === 0 ? (
                        <p className="text-sm text-gray-500">No attachments yet.</p>
                      ) : (
                        taskDocuments.map((d) => (
                          <div key={d.id} className="flex items-center justify-between p-2 rounded border">
                            <span className="text-sm">{d.title || d.filename}</span>
                            <Badge variant="outline">{d.documentType}</Badge>
                          </div>
                        ))
                      )}
                      <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer pt-2">
                        <Upload className="h-4 w-4" />
                        {uploadingDoc ? "Uploading..." : "Upload attachment"}
                        <input type="file" className="hidden" onChange={handleUploadAttachment} disabled={uploadingDoc} />
                      </label>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-2 mt-4">
                      {taskHistory.length === 0 ? (
                        <p className="text-sm text-gray-500">No history recorded yet.</p>
                      ) : (
                        taskHistory.map((h) => (
                          <div key={h.id} className="p-2 rounded border text-sm">
                            <span className="font-medium">{h.action}</span>
                            <span className="text-gray-500"> by {h.userEmail || 'system'} · {formatDisplayDateOrDefault(h.createdAt)}</span>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

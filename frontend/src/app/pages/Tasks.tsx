import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { Plus, Clock, AlertCircle, CheckCircle, Search, Filter } from "lucide-react";
import { tasksApi, usersApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";
import { formatDisplayDateOrDefault } from "../lib/date";

export function Tasks() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Not Started",
    priority: "Medium",
    dueDate: "",
    assignedToId: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [myData, assignedData, usersData] = await Promise.all([
        tasksApi.getMyTasks(),
        tasksApi.getAssignedByMe(),
        usersApi.getAll().catch(() => []) // Fallback if admin users API differs
      ]);
      setMyTasks(Array.isArray(myData) ? myData : []);
      setAssignedTasks(Array.isArray(assignedData) ? assignedData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tasksApi.create({
        ...formData,
        assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : undefined
      });
      setShowModal(false);
      setFormData({
        title: "",
        description: "",
        status: "Not Started",
        priority: "Medium",
        dueDate: "",
        assignedToId: ""
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
    } catch (err) {
      console.error("Failed to update status", err);
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

  const currentList = activeTab === "my-tasks" ? myTasks : assignedTasks;
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
            </TabsList>
          </Tabs>
        </div>
        
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
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading tasks...</TableCell>
              </TableRow>
            ) : filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  No tasks found in this view.
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{task.description}</div>
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
                        <SelectItem value="">Assign to myself</SelectItem>
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
    </div>
  );
}

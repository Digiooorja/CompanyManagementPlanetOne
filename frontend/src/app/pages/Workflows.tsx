import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { GitBranch, Clock, CheckCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { workflowsApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

export function Workflows() {
  const { user } = useAuth();
  const [workflowItems, setWorkflowItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "Document Approval",
    priority: "Medium",
    dueDate: "",
    description: "",
    currentStep: "Manager Review"
  });

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowsApi.getAll();
      setWorkflowItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading workflows", err);
      setError("Unable to load workflows from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workflowsApi.create({
        ...formData,
        submittedBy: user?.username || 'Unknown',
        submitDate: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({
        title: "",
        type: "Document Approval",
        priority: "Medium",
        dueDate: "",
        description: "",
        currentStep: "Manager Review"
      });
      loadWorkflows();
    } catch (err) {
      console.error("Failed to create workflow", err);
      alert("Failed to create workflow");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Awaiting Action":
        return "destructive";
      case "In Progress":
        return "default";
      case "Approved":
        return "secondary";
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
      default:
        return "outline";
    }
  };

  const awaitingAction = workflowItems.filter((w) => w.status === "Awaiting Action");
  const inProgress = workflowItems.filter((w) => w.status === "In Progress");
  const completedThisWeek = workflowItems.filter((w) => ["Approved", "Completed"].includes(w.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Workflows</h1>
          <p className="text-gray-500 mt-1">Manage approval workflows and processes</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Awaiting Action</p>
              <p className="text-2xl">{awaitingAction.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <GitBranch className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl">{inProgress.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed This Week</p>
              <p className="text-2xl">{completedThisWeek}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workflow Inbox */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Workflow Inbox</h2>
        {loading ? (
          <div className="text-sm text-gray-600">Loading workflows...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : workflowItems.length === 0 ? (
          <div className="text-sm text-gray-600">No workflows available.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Submit Date</TableHead>
                <TableHead>Current Step</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflowItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      to={`/workflows/${item.id}`}
                      className="hover:underline"
                    >
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {item.submittedBy}
                  </TableCell>
                  <TableCell>{formatDisplayDateOrDefault(item.submitDate)}</TableCell>
                  <TableCell className="text-sm">{item.currentStep}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDisplayDateOrDefault(item.dueDate)}</TableCell>
                  <TableCell>
                    <Link to={`/workflows/${item.id}`}>
                      <Button size="sm">
                        {item.status === "Awaiting Action" ? "Action" : "View"}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create Workflow Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle>Create New Workflow</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateWorkflow} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Workflow Title *</label>
                  <Input 
                    required 
                    placeholder="e.g., Q3 Report Approval" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(val) => setFormData({...formData, type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Document Approval">Document Approval</SelectItem>
                        <SelectItem value="Equipment Request">Equipment Request</SelectItem>
                        <SelectItem value="HSE Audit">HSE Audit</SelectItem>
                        <SelectItem value="Custom">Custom Process</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Send To (Current Step)</label>
                    <Select 
                      value={formData.currentStep} 
                      onValueChange={(val) => setFormData({...formData, currentStep: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select step" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manager Review">Manager Review</SelectItem>
                        <SelectItem value="Executive Management">Executive Management</SelectItem>
                        <SelectItem value="HSE">HSE Review</SelectItem>
                        <SelectItem value="Finance & Accounts">Finance & Accounts</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
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

                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea 
                    placeholder="Provide details for reviewers..." 
                    className="h-20"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Workflow</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

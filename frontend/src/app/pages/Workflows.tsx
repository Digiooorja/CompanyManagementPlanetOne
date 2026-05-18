import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { GitBranch, Clock, CheckCircle } from "lucide-react";

export function Workflows() {
  const workflowItems = [
    {
      id: 1,
      title: "AFE Amendment - Block A",
      type: "Finance Approval",
      submittedBy: "Sarah Johnson",
      submitDate: "2026-04-30",
      currentStep: "Executive Approval",
      status: "Awaiting Action",
      priority: "High",
      dueDate: "2026-05-05",
    },
    {
      id: 2,
      title: "Drilling Contract Review",
      type: "Contract Approval",
      submittedBy: "Mike Chen",
      submitDate: "2026-04-29",
      currentStep: "Legal Review",
      status: "In Progress",
      priority: "High",
      dueDate: "2026-05-06",
    },
    {
      id: 3,
      title: "HSE Incident Report",
      type: "HSE Review",
      submittedBy: "Emma Davis",
      submitDate: "2026-04-28",
      currentStep: "Management Acknowledgment",
      status: "Awaiting Action",
      priority: "Critical",
      dueDate: "2026-05-02",
    },
    {
      id: 4,
      title: "Environmental Permit Renewal",
      type: "Regulatory Approval",
      submittedBy: "James Wilson",
      submitDate: "2026-04-27",
      currentStep: "Internal Review",
      status: "In Progress",
      priority: "Medium",
      dueDate: "2026-05-10",
    },
    {
      id: 5,
      title: "Well Completion Report",
      type: "Technical Review",
      submittedBy: "Lisa Brown",
      submitDate: "2026-04-25",
      currentStep: "Completed",
      status: "Approved",
      priority: "Medium",
      dueDate: "2026-05-01",
    },
  ];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Workflows</h1>
          <p className="text-gray-500 mt-1">Manage approval workflows and processes</p>
        </div>
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
              <p className="text-2xl">8</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workflow Inbox */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Workflow Inbox</h2>
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
                <TableCell>{item.submitDate}</TableCell>
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
                <TableCell>{item.dueDate}</TableCell>
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
      </Card>
    </div>
  );
}

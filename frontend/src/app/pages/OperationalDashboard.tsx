import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { AlertCircle, FileText, CheckCircle, Clock, Calendar } from "lucide-react";

export function OperationalDashboard() {
  const myTasks = [
    {
      id: 1,
      title: "Review drilling plan for Well B-3",
      project: "Block B - Phase 2",
      priority: "High",
      dueDate: "2026-05-05",
      status: "In Progress",
    },
    {
      id: 2,
      title: "Approve safety inspection report",
      project: "Block A - Operations",
      priority: "Critical",
      dueDate: "2026-05-03",
      status: "Pending",
    },
    {
      id: 3,
      title: "Update environmental monitoring data",
      project: "Block C - Planning",
      priority: "Medium",
      dueDate: "2026-05-08",
      status: "Not Started",
    },
    {
      id: 4,
      title: "Complete AFE documentation",
      project: "Block A - Well Extension",
      priority: "High",
      dueDate: "2026-05-06",
      status: "In Progress",
    },
  ];

  const upcomingDeadlines = [
    { date: "2026-05-03", event: "Safety Inspection Report Due", type: "Document" },
    { date: "2026-05-05", event: "Drilling Plan Review", type: "Activity" },
    { date: "2026-05-06", event: "AFE Approval Deadline", type: "Finance" },
    { date: "2026-05-10", event: "Monthly Production Report", type: "Document" },
    { date: "2026-05-15", event: "Environmental Compliance Check", type: "Activity" },
  ];

  const workflowInbox = [
    {
      id: 1,
      title: "AFE Amendment - Block A",
      type: "Approval Required",
      submittedBy: "Sarah Johnson",
      date: "2026-04-30",
    },
    {
      id: 2,
      title: "Drilling Contract Review",
      type: "Review Required",
      submittedBy: "Mike Chen",
      date: "2026-04-29",
    },
    {
      id: 3,
      title: "HSE Incident Report",
      type: "Acknowledgment Required",
      submittedBy: "Emma Davis",
      date: "2026-04-28",
    },
  ];

  const quickStats = [
    { label: "Open Risks", value: 12, trend: "up", color: "text-orange-600" },
    { label: "Pending Documents", value: 8, trend: "down", color: "text-blue-600" },
    { label: "Active Workflows", value: 15, trend: "up", color: "text-purple-600" },
    { label: "Overdue Tasks", value: 3, trend: "down", color: "text-red-600" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "destructive";
      case "High":
        return "default";
      case "Medium":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Operational Dashboard</h1>
          <p className="text-gray-500 mt-1">Your daily tasks and activity overview</p>
        </div>
        <Link to="/">
          <Button variant="outline">Switch to Executive View</Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className={`text-2xl mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={stat.trend === "up" ? "text-red-500" : "text-green-500"}>
                <span className="text-xs">
                  {stat.trend === "up" ? "↑" : "↓"}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* My Tasks */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">My Tasks</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.title}</TableCell>
                <TableCell className="text-sm text-gray-600">{task.project}</TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                </TableCell>
                <TableCell>{task.dueDate}</TableCell>
                <TableCell>
                  <Badge variant="outline">{task.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link to={`/activities/${task.id}`}>
                    <Button size="sm" variant="ghost">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card className="p-6">
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Deadlines
          </h2>
          <div className="space-y-3">
            {upcomingDeadlines.map((deadline, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
              >
                <div className="flex flex-col items-center justify-center bg-white rounded p-2 min-w-[60px] border">
                  <span className="text-xs text-gray-500">
                    {new Date(deadline.date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </span>
                  <span className="text-xl">
                    {new Date(deadline.date).getDate()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">{deadline.event}</p>
                  <Badge variant="outline" className="mt-1">
                    {deadline.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Workflow Inbox */}
        <Card className="p-6">
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Workflow Inbox
          </h2>
          <div className="space-y-3">
            {workflowInbox.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm">{item.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{item.type}</Badge>
                    <span className="text-xs text-gray-500">
                      by {item.submittedBy}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                </div>
                <Link to={`/workflows/${item.id}`}>
                  <Button size="sm">Action</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

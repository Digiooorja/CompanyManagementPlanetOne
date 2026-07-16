import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { AlertCircle, FileText, CheckCircle, Clock, Calendar } from "lucide-react";
import { formatDisplayDateOrDefault } from "../lib/date";
import { workflowsApi, documentsApi, activitiesApi, projectsApi, tasksApi, risksApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

export function OperationalDashboard() {
  const [myTasks, setMyTasks] = useState<any[]>([]);

  const [workflowInbox, setWorkflowInbox] = useState<any[]>([]);
  const [workflowInboxLoading, setWorkflowInboxLoading] = useState(true);
  const [workflowInboxError, setWorkflowInboxError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);

  const { user } = useAuth();
  const departmentName = user?.departmentDetails?.name || user?.department || '';

  useEffect(() => {
    const loadInbox = async () => {
      setWorkflowInboxLoading(true);
      setWorkflowInboxError(null);
      try {
        const inboxItems = await workflowsApi.getInbox(departmentName || undefined);
        setWorkflowInbox(Array.isArray(inboxItems) ? inboxItems : []);
      } catch (err) {
        console.error('Error loading workflow inbox:', err);
        setWorkflowInboxError('Unable to load workflow inbox');
        setWorkflowInbox([]);
      } finally {
        setWorkflowInboxLoading(false);
      }
    };

    loadInbox();

    const fetchTasks = async () => {
      try {
        const tasks = await tasksApi.getMyTasks();
        setMyTasks(Array.isArray(tasks) ? tasks : []);
      } catch (err) {
        console.error('Error fetching my tasks:', err);
      }
    };
    fetchTasks();
  }, [departmentName]);

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const [docs, acts, projs, rks] = await Promise.all([
          documentsApi.getAll(),
          activitiesApi.getAll(),
          projectsApi.getAll(),
          risksApi.getAll().catch(() => []),
        ]);
        setDocuments(Array.isArray(docs) ? docs : []);
        setActivities(Array.isArray(acts) ? acts : []);
        setProjects(Array.isArray(projs) ? projs : []);
        setRisks(Array.isArray(rks) ? rks : []);
      } catch (err) {
        console.error('Error loading dashboard search data:', err);
        setDocuments([]);
        setActivities([]);
        setProjects([]);
        setRisks([]);
      }
    };

    fetchSearchData();
  }, []);

  const filteredMyTasks = myTasks;

  // Real, live upcoming deadlines (replaces a previous hardcoded placeholder
  // list) — sourced from open activities and my open tasks, so every entry
  // links back to its real source record (§5.8 "guaranteed drill-down").
  const upcomingDeadlines = [
    ...activities
      .filter((a) => a.endDate && a.status !== 'Completed')
      .map((a) => ({ date: a.endDate, event: a.name || a.title || 'Activity deadline', type: 'Activity', link: `/activities/${a.id}` })),
    ...myTasks
      .filter((t) => t.dueDate && t.status !== 'Completed')
      .map((t) => ({ date: t.dueDate, event: t.title || 'Task due', type: 'Task', link: `/tasks` })),
  ]
    .filter((d) => new Date(d.date).getTime() >= Date.now() - 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  const filteredUpcomingDeadlines = upcomingDeadlines;

  const filteredWorkflowInbox = workflowInbox;

  // Real, live quick stats (replaces previous hardcoded 12/8/15/3 placeholders)
  // — each stat links back to its underlying filtered list (§5.8 drill-down).
  const openRisksCount = risks.filter((r) => r.status !== 'Closed' && r.status !== 'Mitigated').length;
  const pendingDocumentsCount = documents.filter((d) => d.status === 'Under Review' || d.status === 'Draft').length;
  const activeWorkflowsCount = workflowInbox.length;
  const overdueTasksCount = myTasks.filter((t) => t.status === 'Overdue').length;

  const quickStats = [
    { label: "Open Risks", value: openRisksCount, color: "text-orange-600", link: "/registers" },
    { label: "Pending Documents", value: pendingDocumentsCount, color: "text-blue-600", link: `/documents?status=${encodeURIComponent('Under Review')}` },
    { label: "Active Workflows", value: activeWorkflowsCount, color: "text-purple-600", link: "/workflows" },
    { label: "Overdue Tasks", value: overdueTasksCount, color: "text-red-600", link: "/tasks?status=Overdue" },
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
          <Link key={index} to={stat.link}>
            <Card className="p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-2xl mt-1 ${stat.color}`}>{stat.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* My Tasks */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">My Tasks</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMyTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-6">No tasks currently assigned to you.</TableCell>
              </TableRow>
            ) : (
              filteredMyTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell className="text-sm text-gray-600 truncate max-w-[200px]">{task.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  </TableCell>
                  <TableCell>{task.dueDate ? formatDisplayDateOrDefault(task.dueDate) : '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link to={task.relatedType === 'Activity' ? `/activities/${task.relatedId}` : task.relatedType === 'Workflow' ? `/workflows/${task.relatedId}` : `/tasks`}>
                      <Button size="sm" variant="ghost">Action</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
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
            {filteredUpcomingDeadlines.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming activity or task deadlines.</p>
            ) : (
              filteredUpcomingDeadlines.map((deadline, index) => (
              <Link
                key={index}
                to={deadline.link || '/tasks'}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
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
              </Link>
              ))
            )}
          </div>
        </Card>

        {/* Workflow Inbox */}
        <Card className="p-6">
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Workflow Inbox
          </h2>
          {workflowInboxLoading ? (
            <p className="text-sm text-gray-500">Loading workflow inbox...</p>
          ) : workflowInboxError ? (
            <p className="text-sm text-red-600">{workflowInboxError}</p>
          ) : filteredWorkflowInbox.length === 0 ? (
            <p className="text-sm text-gray-500">No workflow inbox items available.</p>
          ) : (
            <div className="space-y-3">
              {filteredWorkflowInbox.map((item) => (
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
                    <p className="text-xs text-gray-500 mt-1">{item.submitDate || item.date || ''}</p>
                  </div>
                  <Link to={`/workflows/${item.id}`}>
                    <Button size="sm">Action</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, BarChart3, FileText, AlertTriangle, Download, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProjectGanttChart } from '../components/ProjectGanttChart';
import { projectsApi, activitiesApi, documentsApi, risksApi } from '../../services/api';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  block?: string;
  manager?: string;
  budget?: number;
  spent?: number;
  completion?: number;
  startDate?: string;
  endDate?: string;
}

interface Activity {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  status: string;
  assignedTo?: string;
  progress?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  plannedCost?: number;
  actualCost?: number;
  parentActivityId?: number | null;
  subactivities?: Activity[];
}

interface GanttActivity extends Activity {
  subactivities: Activity[];
}

interface ActivityRow extends Activity {
  level: number;
}

interface DocumentItem {
  id: number;
  projectId: number;
  title?: string;
  name?: string;
  type: string;
  uploadDate: string;
  status: string;
  fileUrl?: string;
}

interface Risk {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  severity: string;
  probability: string;
  status: string;
  owner: string;
}

const currencyFormat = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `$${Number(value).toLocaleString()}`;
};

const getStatusVariant = (status: string) => {
  const lower = status?.toLowerCase();
  if (lower.includes('completed') || lower.includes('active') || lower.includes('on track')) return 'default';
  if (lower.includes('progress') || lower.includes('planning')) return 'secondary';
  if (lower.includes('delayed') || lower.includes('cancelled') || lower.includes('risk')) return 'destructive';
  return 'outline';
};

const getSeverityColor = (severity: string) => {
  const value = severity?.toLowerCase();
  if (value === 'critical' || value === 'high') return '#f87171';
  if (value === 'medium') return '#fbbf24';
  if (value === 'low') return '#34d399';
  return '#cbd5e1';
};

const getProbabilityColor = (probability: string) => {
  const value = probability?.toLowerCase();
  if (value === 'high') return '#f87171';
  if (value === 'medium') return '#fbbf24';
  if (value === 'low') return '#34d399';
  return '#cbd5e1';
};

function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<number[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'gantt' | 'activities' | 'plan-actual' | 'budget' | 'documents' | 'risks'>('gantt');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('Project ID not provided');
        setLoading(false);
        return;
      }

      const numericId = Number(id);
      if (Number.isNaN(numericId)) {
        setError('Invalid project ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [projectData, activitiesData, documentsData, risksData] = await Promise.all([
          projectsApi.getById(numericId),
          activitiesApi.getByProjectId(numericId),
          documentsApi.getByProjectId(numericId),
          risksApi.getByProjectId(numericId),
        ]);

        setProject(projectData);
        setActivities(activitiesData || []);
        setDocuments(documentsData || []);
        setRisks(risksData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const activityRows = useMemo(() => {
    const buildRows = (parentId: number | null, level: number): ActivityRow[] => {
      return activities
        .filter((item) => item.parentActivityId === parentId)
        .flatMap((item) => {
          const row: ActivityRow = { ...item, level };
          if (expandedActivities.includes(item.id)) {
            return [row, ...buildRows(item.id, level + 1)];
          }
          return [row];
        });
    };

    return buildRows(null, 0);
  }, [activities, expandedActivities]);

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

  const statistics = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let onSchedule = 0;
    let delayed = 0;
    let ahead = 0;
    let underBudget = 0;
    let overBudget = 0;

    activities.forEach((activity) => {
      const status = activity.status?.toLowerCase();
      if (status === 'completed') completed += 1;
      if (status === 'in progress') inProgress += 1;
      if (status === 'not started') notStarted += 1;

      const plannedEnd = activity.plannedEndDate ? new Date(activity.plannedEndDate) : null;
      const actualEnd = activity.actualEndDate ? new Date(activity.actualEndDate) : null;
      const today = new Date();

      if (!actualEnd) {
        if (plannedEnd && today <= plannedEnd) onSchedule += 1;
        else if (plannedEnd && today > plannedEnd) delayed += 1;
      } else {
        if (plannedEnd && actualEnd > plannedEnd) delayed += 1;
        else if (plannedEnd && actualEnd < plannedEnd) ahead += 1;
        else if (plannedEnd) onSchedule += 1;
      }

      if (activity.plannedCost != null && activity.actualCost != null) {
        if (activity.actualCost <= activity.plannedCost) {
          underBudget += activity.plannedCost - activity.actualCost;
        } else {
          overBudget += activity.actualCost - activity.plannedCost;
        }
      }
    });

    const activeRisks = risks.filter((risk) => risk.status?.toLowerCase() === 'active').length;
    const completion = activities.length > 0 ? Math.round((completed / activities.length) * 100) : 0;

    return {
      completed,
      inProgress,
      notStarted,
      onSchedule,
      delayed,
      ahead,
      underBudget,
      overBudget,
      totalVariance: overBudget - underBudget,
      activeRisks,
      completion,
    };
  }, [activities, risks]);

  const mainActivities = useMemo(
    () => activities.filter((item) => !item.parentActivityId),
    [activities]
  );

  const activityBudgetTotal = useMemo(
    () => mainActivities.reduce((sum, activity) => sum + Number(activity.plannedCost ?? 0), 0),
    [mainActivities]
  );

  const activitySpentTotal = useMemo(
    () => mainActivities.reduce((sum, activity) => sum + Number(activity.actualCost ?? 0), 0),
    [mainActivities]
  );

  const budgetChartData = useMemo(() => {
    const budgetValue = mainActivities.length > 0 ? activityBudgetTotal : Number(project?.budget ?? 0);
    const spentValue = mainActivities.length > 0 ? activitySpentTotal : Number(project?.spent ?? 0);

    if (!project?.startDate || !project?.endDate || budgetValue <= 0) return [];
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const months: { month: string; budget: number; actual: number }[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const totalMonths = Math.max((end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1, 1);
    const monthlyBudget = budgetValue / totalMonths;
    const monthlyActual = spentValue / totalMonths;

    while (current <= end) {
      months.push({
        month: current.toLocaleDateString('en-US', { month: 'short' }),
        budget: Math.round(monthlyBudget / 1000),
        actual: Math.round(monthlyActual / 1000),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }, [project, activities.length, activityBudgetTotal, activitySpentTotal]);

  const planVsActualData = useMemo(
    () =>
      mainActivities.map((activity) => ({
        name: activity.name.length > 16 ? `${activity.name.slice(0, 16)}...` : activity.name,
        planned: activity.plannedCost ?? 0,
        actual: activity.actualCost ?? 0,
      })),
    [mainActivities]
  );

  const ganttActivities = useMemo<GanttActivity[]>(() => {
    return activities
      .filter((activity) => !activity.parentActivityId)
      .map((parent) => ({
        ...parent,
        subactivities: activities.filter((item) => item.parentActivityId === parent.id),
      }));
  }, [activities]);

  const toggleExpand = (activityId: number) => {
    setExpandedActivities((current) =>
      current.includes(activityId) ? current.filter((id) => id !== activityId) : [...current, activityId]
    );
  };

  const handleMoveActivity = async (activityId: number, direction: 'up' | 'down') => {
    try {
      setUpdatingOrderId(activityId);
      await activitiesApi.updateOrder(activityId, direction);
      // Reload activities to reflect the new order
      const activitiesData = await activitiesApi.getByProjectId(Number(id));
      setActivities(activitiesData || []);
    } catch (err) {
      console.error('Error updating activity order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update activity order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-gray-600">Loading project details...</p>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <p className="text-red-600">{error ?? 'Project not found'}</p>
          <Link to="/projects">
            <Button className="mt-4">Back to Projects</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const budgetValue = mainActivities.length > 0 ? activityBudgetTotal : Number(project.budget ?? 0);
  const spentValue = mainActivities.length > 0 ? activitySpentTotal : Number(project.spent ?? 0);
  const remainingValue = Math.max(budgetValue - spentValue, 0);
  const utilization = budgetValue > 0 ? Math.round((spentValue / budgetValue) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link to="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>

        <div className="space-y-1 md:text-right">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Budget</p>
          <p className="text-3xl font-bold mt-2">{currencyFormat(budgetValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Spent</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{currencyFormat(spentValue)}</p>
          <Progress value={utilization} className="h-2 mt-2" />
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Completion</p>
          <p className="text-3xl font-bold mt-2">{statistics.completion}%</p>
          <Progress value={statistics.completion} className="h-2 mt-2" />
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active Risks</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{statistics.activeRisks}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Block</p>
          <p className="text-lg font-semibold mt-2">{project.block ?? '-'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Manager</p>
          <p className="text-lg font-semibold mt-2">{project.manager ?? '-'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge className="mt-2">{project.status}</Badge>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Duration</p>
          <p className="text-lg font-semibold mt-2">
            {project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
              : '-'} -{' '}
            {project.endDate ? new Date(project.endDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
              : '-'}
          </p>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="plan-actual">Plan vs Actual</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        <TabsContent value="gantt" className="mt-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5" />
              Project Gantt Chart
            </div>
            <ProjectGanttChart
              activities={ganttActivities}
              projectStartDate={project.startDate || ''}
              projectEndDate={project.endDate || ''}
            />
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <Card className="p-6">
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2">{statistics.completed}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold mt-2">{statistics.inProgress}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Not Started</p>
                <p className="text-3xl font-bold mt-2">{statistics.notStarted}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-3xl font-bold mt-2">{activities.length}</p>
              </Card>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Planned Dates</TableHead>
                    <TableHead>Actual Dates</TableHead>
                    <TableHead>Planned Cost</TableHead>
                    <TableHead>Actual Cost</TableHead>
                    <TableHead>Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityRows.map((activity) => {
                    const hasChildren = activities.some((item) => item.parentActivityId === activity.id);
                    return (
                      <TableRow
                        key={activity.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => navigate(`/activities/${activity.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2" style={{ paddingLeft: activity.level * 24 }}>
                            <span>{activity.name}</span>
                            {hasChildren ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(activity.id);
                                }}
                              >
                                {expandedActivities.includes(activity.id) ? '−' : '+'}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(activity.status)}>{activity.status}</Badge>
                        </TableCell>
                        <TableCell>{activity.assignedTo || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={activity.progress ?? 0} className="h-2 w-24" />
                            <span className="text-sm">{activity.progress ?? 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {activity.plannedStartDate ? new Date(activity.plannedStartDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                            : '-'}
                          <span className="mx-1">→</span>
                          {activity.plannedEndDate ? new Date(activity.plannedEndDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {activity.actualStartDate ? new Date(activity.actualStartDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                            : '-'}
                          <span className="mx-1">→</span>
                          {activity.actualEndDate ? new Date(activity.actualEndDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                            : '-'}
                        </TableCell>
                        <TableCell>{currencyFormat(activity.plannedCost)}</TableCell>
                        <TableCell>{currencyFormat(activity.actualCost)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveActivity(activity.id, 'up');
                              }}
                              disabled={updatingOrderId === activity.id || activity.level > 0}
                              title="Move activity up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveActivity(activity.id, 'down');
                              }}
                              disabled={updatingOrderId === activity.id || activity.level > 0}
                              title="Move activity down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="plan-actual" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">On Schedule</p>
              <p className="text-3xl font-bold mt-2">{statistics.onSchedule}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Delayed</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{statistics.delayed}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Ahead</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{statistics.ahead}</p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 mt-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Under Budget</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{currencyFormat(statistics.underBudget)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Over Budget</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{currencyFormat(statistics.overBudget)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Variance</p>
              <p className="text-3xl font-bold mt-2">{currencyFormat(Math.abs(statistics.totalVariance))}</p>
            </Card>
          </div>

          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Cost Variance</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={planVsActualData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${currencyFormat(value)}`, '']} />
                <Legend />
                <Bar dataKey="planned" fill="#3b82f6" name="Planned Cost" />
                <Bar dataKey="actual" fill="#10b981" name="Actual Cost" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-3xl font-bold mt-2">{currencyFormat(budgetValue)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{currencyFormat(spentValue)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{currencyFormat(remainingValue)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Utilization</p>
              <p className="text-3xl font-bold mt-2">{utilization}%</p>
              <Progress value={utilization} className="h-2 mt-2" />
            </Card>
          </div>

          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Budget vs Actual</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={budgetChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${value}K`, '']} />
                <Legend />
                <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                <Bar dataKey="actual" fill="#10b981" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card className="p-6">
            {documents.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => navigate(`/documents/${doc.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {doc.title ?? doc.name}
                          </div>
                        </TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{new Date(doc.uploadDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadDocument(doc.id);
                            }}
                            disabled={downloadingId === doc.id}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">No documents available for this project.</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="mt-6">
          <Card className="p-6">
            {risks.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risk</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {risks.map((risk) => (
                      <TableRow key={risk.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {risk.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: getSeverityColor(risk.severity), color: '#111827' }}>
                            {risk.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: getProbabilityColor(risk.probability), color: '#111827' }}>
                            {risk.probability}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(risk.status)}>{risk.status}</Badge>
                        </TableCell>
                        <TableCell>{risk.owner}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">No risks logged for this project.</div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProjectDetail;

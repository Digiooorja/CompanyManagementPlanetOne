import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Progress } from "../components/ui/progress";
import { ArrowLeft, Calendar, User, DollarSign, AlertTriangle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ProjectGanttChart } from "../components/ProjectGanttChart";

export function ProjectDetailHardcoded() {
  const { id } = useParams();

  const projects = [
    {
      id: 1,
      name: "DWTCP Deep Water",
      block: "Block A",
      status: "Active",
      startDate: "2026-03-01",
      endDate: "2026-12-31",
      budget: 15000000,
      spent: 11250000,
      completion: 75,
      manager: "Sarah Johnson",
      description: "Development and completion of exploration well A-1 including drilling, casing, and initial production testing.",
    },
    {
      id: 2,
      name: "Shallow Water",
      block: "Block B",
      status: "Completed",
      startDate: "2024-11-15",
      endDate: "2025-03-20",
      budget: 3500000,
      spent: 3480000,
      completion: 100,
      manager: "Mike Chen",
      description: "Phase 2 seismic survey operations in shallow water areas.",
    },
    {
      id: 3,
      name: "Onshore",
      block: "Block A",
      status: "Planning",
      startDate: "2026-07-01",
      endDate: "2027-02-28",
      budget: 18000000,
      spent: 2700000,
      completion: 15,
      manager: "Emma Davis",
      description: "Onshore drilling operations for exploration and development.",
    },
  ];

  const project = projects.find(p => p.id === parseInt(id || "1")) || projects[0];

  const projectActivities = {
    1: [ // DWTCP Deep Water
      {
        id: 1,
        name: "Site Preparation",
        status: "Completed",
        assignedTo: "Mike Chen",
        progress: 100,
        plannedStartDate: "2026-03-01",
        plannedEndDate: "2026-04-15",
        actualStartDate: "2026-03-01",
        actualEndDate: "2026-04-12",
        plannedCost: 500000,
        actualCost: 475000,
        subactivities: [
          {
            id: 1.1,
            name: "Site Survey",
            status: "Completed",
            assignedTo: "Mike Chen",
            progress: 100,
            plannedStartDate: "2026-03-01",
            plannedEndDate: "2026-03-10",
            actualStartDate: "2026-03-01",
            actualEndDate: "2026-03-08",
            plannedCost: 150000,
            actualCost: 145000
          },
          {
            id: 1.2,
            name: "Equipment Setup",
            status: "Completed",
            assignedTo: "Mike Chen",
            progress: 100,
            plannedStartDate: "2026-03-11",
            plannedEndDate: "2026-04-15",
            actualStartDate: "2026-03-09",
            actualEndDate: "2026-04-12",
            plannedCost: 350000,
            actualCost: 330000
          }
        ]
      },
      {
        id: 2,
        name: "Drilling Operations",
        status: "In Progress",
        assignedTo: "James Wilson",
        progress: 75,
        plannedStartDate: "2026-04-16",
        plannedEndDate: "2026-08-30",
        actualStartDate: "2026-04-16",
        actualEndDate: null,
        plannedCost: 8000000,
        actualCost: 6000000,
        subactivities: [
          {
            id: 2.1,
            name: "Wellbore Preparation",
            status: "Completed",
            assignedTo: "James Wilson",
            progress: 100,
            plannedStartDate: "2026-04-16",
            plannedEndDate: "2026-05-15",
            actualStartDate: "2026-04-16",
            actualEndDate: "2026-05-12",
            plannedCost: 2000000,
            actualCost: 1950000
          },
          {
            id: 2.2,
            name: "Drilling Phase 1",
            status: "In Progress",
            assignedTo: "James Wilson",
            progress: 80,
            plannedStartDate: "2026-05-16",
            plannedEndDate: "2026-07-15",
            actualStartDate: "2026-05-13",
            actualEndDate: null,
            plannedCost: 4000000,
            actualCost: 3200000
          },
          {
            id: 2.3,
            name: "Drilling Phase 2",
            status: "Not Started",
            assignedTo: "James Wilson",
            progress: 0,
            plannedStartDate: "2026-07-16",
            plannedEndDate: "2026-08-30",
            actualStartDate: null,
            actualEndDate: null,
            plannedCost: 2000000,
            actualCost: 0
          }
        ]
      },
      {
        id: 3,
        name: "Casing Installation",
        status: "Not Started",
        assignedTo: "Emma Davis",
        progress: 0,
        plannedStartDate: "2026-09-01",
        plannedEndDate: "2026-11-15",
        actualStartDate: null,
        actualEndDate: null,
        plannedCost: 3500000,
        actualCost: 0,
        subactivities: [
          {
            id: 3.1,
            name: "Casing Procurement",
            status: "Not Started",
            assignedTo: "Emma Davis",
            progress: 0,
            plannedStartDate: "2026-09-01",
            plannedEndDate: "2026-09-30",
            actualStartDate: null,
            actualEndDate: null,
            plannedCost: 800000,
            actualCost: 0
          },
          {
            id: 3.2,
            name: "Installation Work",
            status: "Not Started",
            assignedTo: "Emma Davis",
            progress: 0,
            plannedStartDate: "2026-10-01",
            plannedEndDate: "2026-11-15",
            actualStartDate: null,
            actualEndDate: null,
            plannedCost: 2700000,
            actualCost: 0
          }
        ]
      },
      {
        id: 4,
        name: "Production Testing",
        status: "Not Started",
        assignedTo: "Lisa Brown",
        progress: 0,
        plannedStartDate: "2026-11-16",
        plannedEndDate: "2026-12-31",
        actualStartDate: null,
        actualEndDate: null,
        plannedCost: 2500000,
        actualCost: 0,
        subactivities: [
          {
            id: 4.1,
            name: "Testing Equipment Setup",
            status: "Not Started",
            assignedTo: "Lisa Brown",
            progress: 0,
            plannedStartDate: "2026-11-16",
            plannedEndDate: "2026-12-01",
            actualStartDate: null,
            actualEndDate: null,
            plannedCost: 500000,
            actualCost: 0
          },
          {
            id: 4.2,
            name: "Flow Testing",
            status: "Not Started",
            assignedTo: "Lisa Brown",
            progress: 0,
            plannedStartDate: "2026-12-02",
            plannedEndDate: "2026-12-31",
            actualStartDate: null,
            actualEndDate: null,
            plannedCost: 2000000,
            actualCost: 0
          }
        ]
      },
    ],
    2: [ // Shallow Water
      {
        id: 1,
        name: "Equipment Mobilization",
        status: "Completed",
        assignedTo: "Mike Chen",
        progress: 100,
        plannedStartDate: "2024-11-15",
        plannedEndDate: "2024-12-01",
        actualStartDate: "2024-11-15",
        actualEndDate: "2024-11-30",
        plannedCost: 200000,
        actualCost: 195000
      },
      {
        id: 2,
        name: "Seismic Data Acquisition",
        status: "Completed",
        assignedTo: "James Wilson",
        progress: 100,
        plannedStartDate: "2024-12-02",
        plannedEndDate: "2025-02-15",
        actualStartDate: "2024-12-02",
        actualEndDate: "2025-02-10",
        plannedCost: 2500000,
        actualCost: 2450000
      },
      {
        id: 3,
        name: "Data Processing",
        status: "Completed",
        assignedTo: "Emma Davis",
        progress: 100,
        plannedStartDate: "2025-02-16",
        plannedEndDate: "2025-03-20",
        actualStartDate: "2025-02-16",
        actualEndDate: "2025-03-18",
        plannedCost: 750000,
        actualCost: 740000
      },
    ],
    3: [ // Onshore
      {
        id: 1,
        name: "Site Survey",
        status: "Completed",
        assignedTo: "Mike Chen",
        progress: 100,
        plannedStartDate: "2026-07-01",
        plannedEndDate: "2026-08-15",
        actualStartDate: "2026-07-01",
        actualEndDate: "2026-08-10",
        plannedCost: 300000,
        actualCost: 285000
      },
      {
        id: 2,
        name: "Rig Mobilization",
        status: "In Progress",
        assignedTo: "James Wilson",
        progress: 60,
        plannedStartDate: "2026-08-16",
        plannedEndDate: "2026-10-30",
        actualStartDate: "2026-08-16",
        actualEndDate: null,
        plannedCost: 2000000,
        actualCost: 1200000
      },
      {
        id: 3,
        name: "Drilling Operations",
        status: "Not Started",
        assignedTo: "Emma Davis",
        progress: 0,
        plannedStartDate: "2026-10-31",
        plannedEndDate: "2027-02-28",
        actualStartDate: null,
        actualEndDate: null,
        plannedCost: 15000000,
        actualCost: 0
      },
    ],
  };

  const activities = projectActivities[project.id as keyof typeof projectActivities] || projectActivities[1];

  const budgetDataMap = {
    1: [ // DWTCP Deep Water
      { month: "Mar", budget: 1000000, actual: 950000 },
      { month: "Apr", budget: 1500000, actual: 1400000 },
      { month: "May", budget: 2000000, actual: 2100000 },
      { month: "Jun", budget: 1800000, actual: 1750000 },
      { month: "Jul", budget: 2200000, actual: 2300000 },
      { month: "Aug", budget: 1900000, actual: 1850000 },
    ],
    2: [ // Shallow Water
      { month: "Nov", budget: 300000, actual: 295000 },
      { month: "Dec", budget: 800000, actual: 780000 },
      { month: "Jan", budget: 900000, actual: 920000 },
      { month: "Feb", budget: 700000, actual: 685000 },
      { month: "Mar", budget: 500000, actual: 495000 },
    ],
    3: [ // Onshore
      { month: "Jul", budget: 500000, actual: 285000 },
      { month: "Aug", budget: 800000, actual: 0 },
      { month: "Sep", budget: 1200000, actual: 0 },
      { month: "Oct", budget: 1500000, actual: 0 },
      { month: "Nov", budget: 1800000, actual: 0 },
      { month: "Dec", budget: 2000000, actual: 0 },
    ],
  };

  const budgetData = budgetDataMap[project.id as keyof typeof budgetDataMap] || budgetDataMap[1];

  const documents = [
    { id: 1, name: "Drilling Plan", type: "Technical", uploadDate: "2025-05-15", status: "Approved" },
    { id: 2, name: "Safety Procedures", type: "HSE", uploadDate: "2025-05-20", status: "Approved" },
    { id: 3, name: "AFE Documentation", type: "Finance", uploadDate: "2025-06-01", status: "Approved" },
    { id: 4, name: "Progress Report - Q1", type: "Report", uploadDate: "2026-04-01", status: "Review" },
  ];

  const risks = [
    { id: 1, title: "Drilling Equipment Delay", severity: "High", probability: "Medium", status: "Active", owner: "Mike Chen" },
    { id: 2, title: "Weather Conditions", severity: "Medium", probability: "High", status: "Mitigated", owner: "Sarah Johnson" },
    { id: 3, title: "Budget Overrun", severity: "High", probability: "Low", status: "Active", owner: "Emma Davis" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl">{project.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <Badge variant="outline">{project.block}</Badge>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {project.startDate} - {project.endDate}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {project.manager}
            </div>
          </div>
        </div>
        <Badge variant="default">{project.status}</Badge>
      </div>

      <p className="text-gray-700">{project.description}</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Budget</p>
          <p className="text-xl mt-1">${(project.budget / 1000000).toFixed(1)}M</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Spent</p>
          <p className="text-xl mt-1">${(project.spent / 1000000).toFixed(1)}M</p>
          <Progress value={(project.spent / project.budget) * 100} className="h-1 mt-2" />
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Completion</p>
          <p className="text-xl mt-1">{project.completion}%</p>
          <Progress value={project.completion} className="h-1 mt-2" />
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Risks</p>
          <p className="text-xl mt-1">{risks.filter(r => r.status === "Active").length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activities" className="w-full">
        <TabsList>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="plan-actual">Plan vs Actual</TabsTrigger>
          <TabsTrigger value="budget">Budget (AFE)</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="activities" className="mt-6">
          <Card className="p-6">
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
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.status}</Badge>
                    </TableCell>
                    <TableCell>{activity.assignedTo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={activity.progress} className="h-2 w-24" />
                        <span className="text-sm">{activity.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{activity.plannedStartDate} - {activity.plannedEndDate}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{activity.actualStartDate || '-'} - {activity.actualEndDate || '-'}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      ${(activity.plannedCost / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell className="text-sm">
                      ${(activity.actualCost / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell>
                      <Link to={`/activities/${activity.id}`}>
                        <Button size="sm" variant="ghost">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Gantt Chart Tab */}
        <TabsContent value="gantt" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Project Gantt Chart
            </h3>
            <ProjectGanttChart
              activities={activities}
              projectStartDate={project.startDate}
              projectEndDate={project.endDate}
            />
          </Card>
        </TabsContent>

        {/* Plan vs Actual Tab */}
        <TabsContent value="plan-actual" className="mt-6">
          <div className="space-y-6">
            {/* Schedule Variance */}
            <Card className="p-6">
              <h3 className="text-lg mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Variance Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">On Schedule</p>
                  <p className="text-2xl font-bold text-green-600">
                    {activities.filter(a => {
                      if (!a.actualEndDate) return false;
                      const plannedDays = Math.ceil((new Date(a.plannedEndDate).getTime() - new Date(a.plannedStartDate).getTime()) / (1000 * 60 * 60 * 24));
                      const actualDays = Math.ceil((new Date(a.actualEndDate).getTime() - new Date(a.actualStartDate).getTime()) / (1000 * 60 * 60 * 24));
                      return Math.abs(plannedDays - actualDays) <= 3;
                    }).length}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Delayed</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {activities.filter(a => {
                      if (!a.actualEndDate) return false;
                      const plannedEnd = new Date(a.plannedEndDate);
                      const actualEnd = new Date(a.actualEndDate);
                      return actualEnd > plannedEnd;
                    }).length}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Ahead of Schedule</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {activities.filter(a => {
                      if (!a.actualEndDate) return false;
                      const plannedEnd = new Date(a.plannedEndDate);
                      const actualEnd = new Date(a.actualEndDate);
                      return actualEnd < plannedEnd;
                    }).length}
                  </p>
                </div>
              </div>
            </Card>

            {/* Cost Variance */}
            <Card className="p-6">
              <h3 className="text-lg mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Variance Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Under Budget</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${activities.filter(a => a.actualCost < a.plannedCost).reduce((sum, a) => sum + (a.plannedCost - a.actualCost), 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Over Budget</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${activities.filter(a => a.actualCost > a.plannedCost).reduce((sum, a) => sum + (a.actualCost - a.plannedCost), 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Variance</p>
                  <p className={`text-2xl font-bold ${activities.reduce((sum, a) => sum + (a.actualCost - a.plannedCost), 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${Math.abs(activities.reduce((sum, a) => sum + (a.actualCost - a.plannedCost), 0)).toLocaleString()}
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activities.map(a => ({
                  name: a.name.length > 15 ? a.name.substring(0, 15) + '...' : a.name,
                  planned: a.plannedCost / 1000,
                  actual: a.actualCost / 1000
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Cost (K)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`$${value}K`, '']} />
                  <Legend />
                  <Bar dataKey="planned" fill="#3b82f6" name="Planned Cost" />
                  <Bar dataKey="actual" fill="#10b981" name="Actual Cost" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget vs Actual (AFE)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                <Bar dataKey="actual" fill="#10b981" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type}</Badge>
                    </TableCell>
                    <TableCell>{doc.uploadDate}</TableCell>
                    <TableCell>
                      <Badge variant={doc.status === "Approved" ? "default" : "secondary"}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link to={`/documents/${doc.id}`}>
                        <Button size="sm" variant="ghost">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="mt-6">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      {risk.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant={risk.severity === "High" ? "destructive" : "default"}>
                        {risk.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{risk.probability}</TableCell>
                    <TableCell>
                      <Badge variant={risk.status === "Active" ? "destructive" : "default"}>
                        {risk.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{risk.owner}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">Manage</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

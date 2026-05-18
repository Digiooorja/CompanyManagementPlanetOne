import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { ArrowLeft, Plus, Search, Filter, Download } from "lucide-react";

export function RegisterDetail() {
  const { id } = useParams();

  const register = {
    id: 1,
    name: "Risk Register",
    description: "Track and manage project and operational risks",
    entries: 47,
    lastUpdated: "2026-04-30",
  };

  const entries = [
    {
      id: 1,
      riskId: "RISK-001",
      title: "Drilling Equipment Delay",
      category: "Operational",
      severity: "High",
      probability: "Medium",
      impact: "Schedule delay 5-7 days",
      mitigation: "Backup equipment sourced",
      owner: "Mike Chen",
      status: "Active",
      lastReview: "2026-04-28",
    },
    {
      id: 2,
      riskId: "RISK-002",
      title: "Weather Conditions - Offshore",
      category: "Environmental",
      severity: "Medium",
      probability: "High",
      impact: "Operational delays",
      mitigation: "Weather monitoring system",
      owner: "Sarah Johnson",
      status: "Mitigated",
      lastReview: "2026-04-30",
    },
    {
      id: 3,
      riskId: "RISK-003",
      title: "Budget Overrun - Block A",
      category: "Financial",
      severity: "High",
      probability: "Low",
      impact: "15% budget increase",
      mitigation: "Monthly budget reviews",
      owner: "Emma Davis",
      status: "Active",
      lastReview: "2026-04-25",
    },
    {
      id: 4,
      riskId: "RISK-004",
      title: "Regulatory Compliance Gap",
      category: "Compliance",
      severity: "Critical",
      probability: "Low",
      impact: "Licence suspension",
      mitigation: "Compliance audits",
      owner: "James Wilson",
      status: "Active",
      lastReview: "2026-04-29",
    },
    {
      id: 5,
      riskId: "RISK-005",
      title: "Supply Chain Disruption",
      category: "Operational",
      severity: "Medium",
      probability: "Medium",
      impact: "Material delays",
      mitigation: "Alternative suppliers",
      owner: "Lisa Brown",
      status: "Monitoring",
      lastReview: "2026-04-27",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
      case "Active":
        return "destructive";
      case "Mitigated":
        return "default";
      case "Monitoring":
        return "secondary";
      case "Closed":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/registers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Registers
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl">{register.name}</h1>
          <p className="text-gray-500 mt-1">{register.description}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Entries</p>
          <p className="text-2xl mt-1">{register.entries}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl mt-1 text-red-600">
            {entries.filter((e) => e.status === "Active").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Mitigated</p>
          <p className="text-2xl mt-1 text-green-600">
            {entries.filter((e) => e.status === "Mitigated").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Last Updated</p>
          <p className="text-lg mt-1">{register.lastUpdated}</p>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search entries..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Register Entries Table */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Risk ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Probability</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Review</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-mono text-sm">
                  {entry.riskId}
                </TableCell>
                <TableCell>{entry.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{entry.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getSeverityColor(entry.severity)}>
                    {entry.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{entry.probability}</Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {entry.impact}
                </TableCell>
                <TableCell className="text-sm">{entry.owner}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(entry.status)}>
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{entry.lastReview}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* History Panel */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="text-sm">RISK-002 status changed to Mitigated</p>
              <p className="text-xs text-gray-500 mt-1">
                by Sarah Johnson on 2026-04-30
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="text-sm">RISK-004 reviewed and updated</p>
              <p className="text-xs text-gray-500 mt-1">
                by James Wilson on 2026-04-29
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="text-sm">RISK-001 mitigation plan updated</p>
              <p className="text-xs text-gray-500 mt-1">
                by Mike Chen on 2026-04-28
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

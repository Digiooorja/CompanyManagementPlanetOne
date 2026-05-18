import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { FileText, Download, Search, Calendar, BarChart3, TrendingUp, Shield, DollarSign } from "lucide-react";

export function Reports() {
  const reportCategories = [
    {
      name: "Operations",
      icon: BarChart3,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      count: 12,
    },
    {
      name: "Financial",
      icon: DollarSign,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      count: 8,
    },
    {
      name: "HSE",
      icon: Shield,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
      count: 6,
    },
    {
      name: "Performance",
      icon: TrendingUp,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      count: 10,
    },
  ];

  const reports = [
    {
      id: 1,
      name: "Monthly Production Report",
      category: "Operations",
      description: "Detailed production metrics for all blocks",
      frequency: "Monthly",
      lastGenerated: "2026-05-01",
      format: ["PDF", "Excel"],
      block: "All Blocks",
    },
    {
      id: 2,
      name: "Financial Summary Report",
      category: "Financial",
      description: "AFE status and budget variance analysis",
      frequency: "Monthly",
      lastGenerated: "2026-05-01",
      format: ["PDF", "Excel"],
      block: "All Blocks",
    },
    {
      id: 3,
      name: "HSE Incident Report",
      category: "HSE",
      description: "Safety incidents and compliance status",
      frequency: "Weekly",
      lastGenerated: "2026-04-30",
      format: ["PDF"],
      block: "All Blocks",
    },
    {
      id: 4,
      name: "Well Performance Analysis",
      category: "Operations",
      description: "Production rates and well efficiency",
      frequency: "Quarterly",
      lastGenerated: "2026-04-01",
      format: ["PDF", "Excel"],
      block: "Block A, Block B",
    },
    {
      id: 5,
      name: "Risk Assessment Summary",
      category: "HSE",
      description: "Active risks and mitigation status",
      frequency: "Monthly",
      lastGenerated: "2026-04-30",
      format: ["PDF"],
      block: "All Blocks",
    },
    {
      id: 6,
      name: "Project Progress Dashboard",
      category: "Performance",
      description: "All active projects status and completion",
      frequency: "Weekly",
      lastGenerated: "2026-05-01",
      format: ["PDF", "Excel"],
      block: "All Blocks",
    },
    {
      id: 7,
      name: "Vendor Performance Report",
      category: "Financial",
      description: "Vendor payments and contract compliance",
      frequency: "Quarterly",
      lastGenerated: "2026-04-01",
      format: ["Excel"],
      block: "All Blocks",
    },
    {
      id: 8,
      name: "Compliance Status Report",
      category: "HSE",
      description: "Regulatory compliance and permit status",
      frequency: "Monthly",
      lastGenerated: "2026-04-28",
      format: ["PDF"],
      block: "All Blocks",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and export operational reports</p>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.name} className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${category.bgColor} rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`h-5 w-5 ${category.iconColor}`} />
                </div>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-gray-600">{category.count} reports</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search reports..."
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="hse">HSE</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequencies</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <h3 className="font-medium mb-1">{report.name}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>
              <Badge variant="outline">{report.category}</Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Block(s):</span>
                <span>{report.block}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Frequency:</span>
                <Badge variant="secondary">{report.frequency}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Generated:</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {report.lastGenerated}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              {report.format.map((format) => (
                <Button key={format} size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Export {format}
                </Button>
              ))}
              <Button size="sm" className="ml-auto">
                Generate
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Recently Generated Reports</h2>
        <div className="space-y-2">
          {[
            {
              name: "Monthly Production Report - April 2026",
              date: "2026-05-01 09:15",
              format: "PDF",
            },
            {
              name: "Project Progress Dashboard - Week 18",
              date: "2026-05-01 08:30",
              format: "Excel",
            },
            {
              name: "Financial Summary Report - April 2026",
              date: "2026-05-01 07:45",
              format: "PDF",
            },
            {
              name: "HSE Incident Report - Week 17",
              date: "2026-04-30 16:00",
              format: "PDF",
            },
          ].map((recent, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm">{recent.name}</p>
                  <p className="text-xs text-gray-500">{recent.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{recent.format}</Badge>
                <Button size="sm" variant="ghost">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

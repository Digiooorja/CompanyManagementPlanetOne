import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Progress } from "../components/ui/progress";
import { DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { financeApi } from "../../services/api";

export function Finance() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        await financeApi.getAll();
      } catch (err) {
        console.error('Error fetching finance data:', err);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  const budgetData = [
    { block: "Block A", budget: 25000000, actual: 18500000, variance: 6500000 },
    { block: "Block B", budget: 42000000, actual: 38200000, variance: 3800000 },
    { block: "Block C", budget: 15000000, actual: 2100000, variance: 12900000 },
  ];

  const monthlySpend = [
    { month: "Nov", spend: 8500000 },
    { month: "Dec", spend: 9200000 },
    { month: "Jan", spend: 7800000 },
    { month: "Feb", spend: 8900000 },
    { month: "Mar", spend: 9500000 },
    { month: "Apr", spend: 8100000 },
  ];

  const categorySpend = [
    { name: "Drilling", value: 45000000 },
    { name: "Equipment", value: 18000000 },
    { name: "Personnel", value: 12000000 },
    { name: "Services", value: 8000000 },
    { name: "Other", value: 5000000 },
  ];

  const invoices = [
    {
      id: 1,
      invoiceNo: "INV-2026-001",
      vendor: "Drilling Services Ltd",
      description: "Well A-1 Drilling Operations",
      amount: 2500000,
      dueDate: "2026-05-15",
      status: "Pending",
      aging: 10,
    },
    {
      id: 2,
      invoiceNo: "INV-2026-002",
      vendor: "Equipment Rentals Inc",
      description: "Equipment Lease Q2 2026",
      amount: 450000,
      dueDate: "2026-05-08",
      status: "Approved",
      aging: 3,
    },
    {
      id: 3,
      invoiceNo: "INV-2026-003",
      vendor: "Seismic Survey Co",
      description: "Block C Survey Phase 1",
      amount: 1200000,
      dueDate: "2026-05-20",
      status: "Under Review",
      aging: 15,
    },
    {
      id: 4,
      invoiceNo: "INV-2026-004",
      vendor: "Environmental Consultants",
      description: "Impact Assessment",
      amount: 85000,
      dueDate: "2026-05-05",
      status: "Paid",
      aging: 0,
    },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Approved":
        return "secondary";
      case "Pending":
        return "outline";
      case "Under Review":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Finance</h1>
          <p className="text-gray-500 mt-1">Financial management and AFE tracking</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          New AFE
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading finance data...</p>
        </Card>
      ) : (
        <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-xl">$82.0M</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-xl">$58.8M</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-xl">$23.2M</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Invoices</p>
              <p className="text-xl">$4.2M</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="afe" className="w-full">
        <TabsList>
          <TabsTrigger value="afe">AFE Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="afe" className="space-y-6 mt-6">
          {/* Budget vs Actual by Block */}
          <Card className="p-6">
            <h3 className="text-lg mb-4">Budget vs Actual by Block</h3>
            <div className="space-y-4">
              {budgetData.map((item) => (
                <div key={item.block}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.block}</span>
                    <div className="text-sm text-gray-600">
                      ${(item.actual / 1000000).toFixed(1)}M / $
                      {(item.budget / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <Progress
                    value={(item.actual / item.budget) * 100}
                    className="h-3"
                  />
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                    <span>
                      {((item.actual / item.budget) * 100).toFixed(0)}% spent
                    </span>
                    <span className="text-green-600">
                      ${(item.variance / 1000000).toFixed(1)}M remaining
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Spend Trend */}
            <Card className="p-6">
              <h3 className="text-lg mb-4">Monthly Spend Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlySpend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) =>
                      `$${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Spend by Category */}
            <Card className="p-6">
              <h3 className="text-lg mb-4">Spend by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categorySpend}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) =>
                      `${entry.name}: $${(entry.value / 1000000).toFixed(0)}M`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categorySpend.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `$${(value / 1000000).toFixed(1)}M`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Aging (days)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">
                      {invoice.invoiceNo}
                    </TableCell>
                    <TableCell>{invoice.vendor}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {invoice.description}
                    </TableCell>
                    <TableCell>
                      ${(invoice.amount / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.aging > 10
                            ? "destructive"
                            : invoice.aging > 5
                            ? "default"
                            : "outline"
                        }
                      >
                        {invoice.aging} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg mb-4">Available Financial Reports</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">Monthly Financial Summary</p>
                  <p className="text-sm text-gray-600">April 2026</p>
                </div>
                <Button size="sm" variant="outline">
                  Download PDF
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">AFE Status Report</p>
                  <p className="text-sm text-gray-600">All Blocks - Q2 2026</p>
                </div>
                <Button size="sm" variant="outline">
                  Download Excel
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">Vendor Payment Analysis</p>
                  <p className="text-sm text-gray-600">YTD 2026</p>
                </div>
                <Button size="sm" variant="outline">
                  Download PDF
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}

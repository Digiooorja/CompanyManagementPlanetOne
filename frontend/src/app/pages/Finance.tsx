import { useState, useEffect, useMemo, type MouseEvent } from 'react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '../components/ui/dialog';
import { DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { financeApi, activitiesApi } from '../../services/api';

export function Finance() {
  const { user } = useAuth();
  const [financeItems, setFinanceItems] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAfeOpen, setIsAfeOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [transactionDetails, setTransactionDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [newAfe, setNewAfe] = useState({
    item: '',
    amount: '',
    category: '',
    type: 'Expense',
    activityId: '',
    approvalDepartment: '',
    afeNumber: '',
    status: 'Pending'
  });

  const departmentName = user?.department || user?.departmentDetails?.name || '';
  const canEdit = useMemo(() => {
    const department = String(departmentName).toLowerCase();
    return user?.role === 'Admin' || department.includes('finance') || department.includes('account');
  }, [departmentName, user]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [financeData, activitiesData] = await Promise.all([
          financeApi.getAll(),
          activitiesApi.getAll(),
        ]);
        setFinanceItems(Array.isArray(financeData) ? financeData : []);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      } catch (err) {
        console.error('Error loading finance data:', err);
        setError('Unable to load finance data');
        setFinanceItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const activityOptions = useMemo(() => {
    const options: Array<{ id: number; name: string }> = [];

    activities.forEach((activity) => {
      options.push({ id: activity.id, name: activity.name });
      if (Array.isArray(activity.subActivities)) {
        activity.subActivities.forEach((subActivity: any) => {
          options.push({ id: subActivity.id, name: `↳ ${subActivity.name}` });
        });
      }
    });

    return options;
  }, [activities]);

  const activityMap = useMemo(() => {
    const map = new Map<number, any>();
    activities.forEach((activity) => {
      map.set(activity.id, activity);
      if (Array.isArray(activity.subActivities)) {
        activity.subActivities.forEach((subActivity: any) => map.set(subActivity.id, subActivity));
      }
    });
    return map;
  }, [activities]);

  const invoiceItems = useMemo(
    () => financeItems.filter((item) => item.recordType === 'Invoice'),
    [financeItems]
  );

  const afeItems = useMemo(
    () => financeItems.filter((item) => item.recordType === 'AFE'),
    [financeItems]
  );

  const summary = useMemo(() => {
    const totalBudget = financeItems
      .filter((item) => item.recordType === 'AFE')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalInvoices = invoiceItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paidInvoices = invoiceItems
      .filter((item) => item.status === 'Paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pendingInvoices = invoiceItems
      .filter((item) => item.status !== 'Paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      totalBudget,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
    };
  }, [financeItems, invoiceItems]);

  const budgetData = [
    { block: 'Block A', budget: 25000000, actual: 18500000, variance: 6500000 },
    { block: 'Block B', budget: 42000000, actual: 38200000, variance: 3800000 },
    { block: 'Block C', budget: 15000000, actual: 2100000, variance: 12900000 },
  ];

  const monthlySpend = [
    { month: 'Nov', spend: 8500000 },
    { month: 'Dec', spend: 9200000 },
    { month: 'Jan', spend: 7800000 },
    { month: 'Feb', spend: 8900000 },
    { month: 'Mar', spend: 9500000 },
    { month: 'Apr', spend: 8100000 },
  ];

  const categorySpend = [
    { name: 'Drilling', value: 45000000 },
    { name: 'Equipment', value: 18000000 },
    { name: 'Personnel', value: 12000000 },
    { name: 'Services', value: 8000000 },
    { name: 'Other', value: 5000000 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Approved':
        return 'secondary';
      case 'Pending':
      case 'Under Review':
      case 'Rejected':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleOpenPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    setTransactionDetails(invoice.transactionDetails || '');
    setIsPaymentOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedInvoice) return;
    setSaving(true);

    try {
      await financeApi.update(selectedInvoice.id, {
        ...selectedInvoice,
        status: 'Paid',
        transactionDetails: transactionDetails.trim(),
        transactionDate: new Date().toISOString(),
      });
      const data = await financeApi.getAll();
      setFinanceItems(Array.isArray(data) ? data : []);
      setIsPaymentOpen(false);
      setSelectedInvoice(null);
      setTransactionDetails('');
    } catch (err) {
      console.error('Error saving payment details:', err);
      setError('Unable to save payment details');
    } finally {
      setSaving(false);
    }
  };

  const handleInvoiceStatusChange = async (invoice: any, status: string) => {
    if (status === 'Paid') {
      handleOpenPayment(invoice);
      return;
    }

    setSaving(true);
    try {
      await financeApi.update(invoice.id, { ...invoice, status });
      const data = await financeApi.getAll();
      setFinanceItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error updating invoice status:', err);
      setError('Unable to update invoice status');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAfe = async () => {
    if (!newAfe.item || !newAfe.amount || !newAfe.category) {
      setError('AFE title, amount and category are required');
      return;
    }

    setSaving(true);
    try {
      await financeApi.create({
        item: newAfe.item,
        amount: Number(newAfe.amount),
        category: newAfe.category,
        type: newAfe.type,
        recordType: 'AFE',
        activityId: newAfe.activityId && newAfe.activityId !== 'none' ? Number(newAfe.activityId) : null,
        approvalDepartment: newAfe.approvalDepartment || null,
        afeNumber: newAfe.afeNumber || null,
        status: newAfe.status,
      });
      const data = await financeApi.getAll();
      setFinanceItems(Array.isArray(data) ? data : []);
      setIsAfeOpen(false);
      setNewAfe({
        item: '',
        amount: '',
        category: '',
        type: 'Expense',
        activityId: '',
        approvalDepartment: '',
        afeNumber: '',
        status: 'Pending',
      });
      setError(null);
    } catch (err) {
      console.error('Error creating AFE:', err);
      setError('Unable to create new AFE');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading finance data...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl">Finance</h1>
          <p className="text-gray-500 mt-1">Financial management, invoices, and AFE approvals</p>
        </div>
        
        <Button type="button" onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          e.stopPropagation();
          setError(null);
          setIsAfeOpen( () => true);
          {console.log('Open AFE Dialog')}
        }} disabled={!canEdit}>
          <FileText className="h-4 w-4 mr-2" />
          New AFE
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">AFE Budget</p>
              <p className="text-xl">${(summary.totalBudget / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Invoice Amount</p>
              <p className="text-xl">${(summary.totalInvoices / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid Invoices</p>
              <p className="text-xl">${(summary.paidInvoices / 1000000).toFixed(1)}M</p>
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
              <p className="text-xl">${(summary.pendingInvoices / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="afe" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="afe">AFE Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="summary">Finance Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="afe" className="space-y-6 mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">AFE Requests</h3>
                <p className="text-sm text-gray-500">Approve by the assigned department before invoices can be cleared.</p>
              </div>
            </div>
            {afeItems.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No AFE requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>AFE No.</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Approval Dept</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {afeItems.map((afe) => (
                      <TableRow key={afe.id}>
                        <TableCell>{afe.afeNumber || `AFE-${afe.id}`}</TableCell>
                        <TableCell>{afe.item}</TableCell>
                        <TableCell>${Number(afe.amount || 0).toLocaleString()}</TableCell>
                        <TableCell>{activityMap.get(afe.activityId)?.name || (afe.activityId ? `Activity ${afe.activityId}` : '-')}</TableCell>
                        <TableCell>{afe.approvalDepartment || 'Finance'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(afe.status)}>{afe.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Invoice Register</h3>
                <p className="text-sm text-gray-500">Invoices are linked to activities so cost impacts are transparent.</p>
              </div>
              <div className="text-sm text-gray-600">
                Editing is enabled for Finance and Accounts users.
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approval Dept</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber || `INV-${invoice.id}`}</TableCell>
                      <TableCell>{invoice.item}</TableCell>
                      <TableCell>{activityMap.get(invoice.activityId)?.name || (invoice.activityId ? `Activity ${invoice.activityId}` : '-')}</TableCell>
                      <TableCell>${Number(invoice.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Select
                          value={invoice.status}
                          onValueChange={(value) => canEdit && handleInvoiceStatusChange(invoice, value)}
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Under Review">Under Review</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{invoice.approvalDepartment || 'Finance'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" disabled={!canEdit}>
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenPayment(invoice)}
                            disabled={!canEdit || invoice.status === 'Paid'}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Finance Summary</h3>
            <p className="text-sm text-gray-600">Records are loaded from the finance database and remain editable by Finance and Accounts roles.</p>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAfeOpen} onOpenChange={setIsAfeOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New AFE</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="afe-item">AFE Title</Label>
              <Input
                id="afe-item"
                value={newAfe.item}
                onChange={(e) => setNewAfe((current) => ({ ...current, item: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="afe-amount">Amount</Label>
                <Input
                  id="afe-amount"
                  type="number"
                  value={newAfe.amount}
                  onChange={(e) => setNewAfe((current) => ({ ...current, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="afe-category">Category</Label>
                <Input
                  id="afe-category"
                  value={newAfe.category}
                  onChange={(e) => setNewAfe((current) => ({ ...current, category: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="afe-activity">Linked Activity</Label>
                <Select
                  value={newAfe.activityId}
                  onValueChange={(value) => setNewAfe((current) => ({ ...current, activityId: value }))}
                >
                  <SelectTrigger id="afe-activity">
                    <SelectValue placeholder="Choose activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {activityOptions.map((activity) => (
                      <SelectItem key={activity.id} value={String(activity.id)}>
                        {activity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="afe-department">Approval Department</Label>
                <Input
                  id="afe-department"
                  value={newAfe.approvalDepartment}
                  onChange={(e) => setNewAfe((current) => ({ ...current, approvalDepartment: e.target.value }))}
                  placeholder="Finance, Accounts, etc."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="afe-number">AFE Number</Label>
              <Input
                id="afe-number"
                value={newAfe.afeNumber}
                onChange={(e) => setNewAfe((current) => ({ ...current, afeNumber: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateAfe} disabled={!canEdit || saving}>
              {saving ? 'Saving...' : 'Create AFE'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter transaction details for clearing this invoice and marking it paid.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Invoice</Label>
              <p className="text-sm text-gray-700">{selectedInvoice?.invoiceNumber || `INV-${selectedInvoice?.id}`}</p>
            </div>
            <div>
              <Label>Amount</Label>
              <p className="text-sm text-gray-700">${Number(selectedInvoice?.amount || 0).toLocaleString()}</p>
            </div>
            <div>
              <Label htmlFor="transaction-details">Transaction Details</Label>
              <Textarea
                id="transaction-details"
                value={transactionDetails}
                onChange={(e) => setTransactionDetails(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSavePayment} disabled={!canEdit || saving || !transactionDetails.trim()}>
              {saving ? 'Saving...' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

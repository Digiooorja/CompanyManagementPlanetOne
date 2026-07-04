import { useState, useEffect, Fragment } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "../components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  Search, 
  Plus, 
  UserPlus, 
  Shield, 
  ShieldAlert,
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit3, 
  RefreshCw,
  Loader2
} from "lucide-react";
import { adminApi, departmentsApi, rbacApi, orgChartApi } from "../../services/api";

export function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalActivities: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New role creation form
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formRole, setFormRole] = useState("User");
  const [formDepartmentId, setFormDepartmentId] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formReportingManagerId, setFormReportingManagerId] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formQualifications, setFormQualifications] = useState("");
  const [formStartDate, setFormStartDate] = useState("");

  // Org chart + profile history
  const [orgChart, setOrgChart] = useState<any[]>([]);
  const [orgChartLoading, setOrgChartLoading] = useState(false);
  const [historyUser, setHistoryUser] = useState<any | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [usersData, dashboardMetrics, departmentsData, rolesData, permissionsData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getDashboard(),
        departmentsApi.getAll(),
        rbacApi.getRoles(),
        rbacApi.getPermissions()
      ]);
      setUsers(usersData);
      setMetrics(dashboardMetrics);
      setDepartments(departmentsData);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
      setErrorMsg(err.message || "An error occurred while loading administrative records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreatingRole(true);
    try {
      await rbacApi.createRole({ name: newRoleName.trim(), description: newRoleDescription.trim() || undefined });
      setNewRoleName("");
      setNewRoleDescription("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create role.");
    } finally {
      setCreatingRole(false);
    }
  };

  const handleDeleteRole = async (role: any) => {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      await rbacApi.deleteRole(role.id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete role.");
    }
  };

  const handleTogglePermission = async (role: any, permissionKey: string, checked: boolean) => {
    if (role.name === "Admin") return; // Admin is a technical superuser — matrix has no effect on it
    const newKeys = checked
      ? [...role.permissionKeys, permissionKey]
      : role.permissionKeys.filter((k: string) => k !== permissionKey);

    setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, permissionKeys: newKeys } : r)));
    try {
      await rbacApi.updateRolePermissions(role.id, newKeys);
    } catch (err: any) {
      alert(err.message || "Failed to update permission — reverting.");
      loadData();
    }
  };

  // Listen for navigation-level global search requests
  useEffect(() => {
    const handler = (e: any) => setSearchQuery(e?.detail?.query || "");
    window.addEventListener('globalSearch', handler as EventListener);
    return () => window.removeEventListener('globalSearch', handler as EventListener);
  }, []);

  const openAddDialog = () => {
    setFormUsername("");
    setFormEmail("");
    setFormPassword("");
    setFormFirstName("");
    setFormLastName("");
    setFormRole("User");
    setFormDepartmentId(departments[0]?.id?.toString() || "");
    setFormActive(true);
    setFormEmployeeId("");
    setFormDesignation("");
    setFormReportingManagerId("");
    setFormPhone("");
    setFormQualifications("");
    setFormStartDate("");
    setIsAddOpen(true);
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setFormUsername(user.username || "");
    setFormEmail(user.email || "");
    setFormPassword(""); // Leave empty to keep unchanged
    setFormFirstName(user.firstName || "");
    setFormLastName(user.lastName || "");
    setFormRole(user.role || "User");
    setFormDepartmentId(user.departmentId?.toString() || "");
    setFormActive(user.active !== false);
    setFormEmployeeId(user.employeeId || "");
    setFormDesignation(user.designation || "");
    setFormReportingManagerId(user.reportingManagerId?.toString() || "");
    setFormPhone(user.phone || "");
    setFormQualifications(user.qualifications || "");
    setFormStartDate(user.startDate ? String(user.startDate).slice(0, 10) : "");
    setIsEditOpen(true);
  };

  const loadOrgChart = async () => {
    setOrgChartLoading(true);
    try {
      const data = await orgChartApi.getTree();
      setOrgChart(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load org chart", err);
    } finally {
      setOrgChartLoading(false);
    }
  };

  const openHistory = async (user: any) => {
    setHistoryUser(user);
    setHistoryLoading(true);
    try {
      const data = await adminApi.getUserHistory(user.id);
      setUserHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load user history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderOrgNode = (node: any, depth = 0) => (
    <div key={node.id} style={{ marginLeft: depth * 24 }} className="mb-2">
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:shadow-sm">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
          {node.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">{node.name}</p>
          <p className="text-xs text-slate-500">
            {node.designation || node.role}{node.department ? ` \u2022 ${node.department}` : ""}
          </p>
        </div>
      </div>
      {node.reports?.length > 0 && (
        <div className="mt-2 border-l-2 border-slate-100 pl-2">
          {node.reports.map((child: any) => renderOrgNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await adminApi.createUser({
        username: formUsername,
        email: formEmail,
        password: formPassword || "Password123!",
        firstName: formFirstName,
        lastName: formLastName,
        role: formRole,
        departmentId: formDepartmentId ? parseInt(formDepartmentId) : null,
        active: formActive,
        employeeId: formEmployeeId || null,
        designation: formDesignation || null,
        reportingManagerId: formReportingManagerId ? parseInt(formReportingManagerId) : null,
        phone: formPhone || null,
        qualifications: formQualifications || null,
        startDate: formStartDate || null
      });
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create user account.");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMsg(null);
    try {
      await adminApi.updateUser(selectedUser.id, {
        username: formUsername,
        email: formEmail,
        ...(formPassword ? { password: formPassword } : {}),
        firstName: formFirstName,
        lastName: formLastName,
        role: formRole,
        departmentId: formDepartmentId ? parseInt(formDepartmentId) : null,
        active: formActive,
        employeeId: formEmployeeId || null,
        designation: formDesignation || null,
        reportingManagerId: formReportingManagerId ? parseInt(formReportingManagerId) : null,
        phone: formPhone || null,
        qualifications: formQualifications || null,
        startDate: formStartDate || null
      });
      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update user account.");
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await adminApi.updateUser(user.id, {
        active: !user.active
      });
      loadData();
    } catch (err: any) {
      alert("Failed to toggle status: " + (err.message || err));
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`Are you absolutely sure you want to delete the user account "${username}"? This action is permanent and cannot be undone.`)) {
      return;
    }
    try {
      await adminApi.deleteUser(id);
      loadData();
    } catch (err: any) {
      alert("Failed to delete user account: " + (err.message || err));
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredUsers = normalizedSearch
    ? users.filter((u) => {
        const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
        return [
          u.username,
          u.email,
          u.role,
          u.department,
          fullName
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
    : users;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4 py-12">
        <Card className="w-full max-w-lg p-8 border border-red-100 bg-white/70 backdrop-blur-md shadow-xl rounded-2xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
          {/* Subtle background red glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-500 rounded-2xl flex items-center justify-center shadow-inner animate-pulse">
              <ShieldAlert className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Administrative Clearance Required
              </h2>
              <Badge variant="destructive" className="px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider">
                Access Restricted
              </Badge>
            </div>

            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Your account is currently identified as <strong className="text-slate-800">{user?.firstName} {user?.lastName} ({user?.role || 'Guest'})</strong>. 
              Only certified system administrators are permitted to enter the security governance and user provisioning portal.
            </p>

            <div className="w-full pt-4">
              <Button 
                onClick={() => navigate("/operational")} 
                className="w-full py-2.5 font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all duration-300 transform active:scale-[0.98]"
              >
                Return to Safety Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Synchronizing with system database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Administration Portal</h1>
          <p className="text-slate-500 mt-1">Configure security credentials, department boundaries, and monitor live system metrics.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {errorMsg && (
        <Card className="p-4 bg-red-50 border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span><strong>Error:</strong> {errorMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMsg(null)} className="text-red-700 hover:bg-red-100">Dismiss</Button>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Active Employees</p>
              <p className="text-2xl font-bold text-emerald-600">{metrics.activeUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Total Roles</p>
              <p className="text-2xl font-bold text-slate-900">{roles.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Inactive Accounts</p>
              <p className="text-2xl font-bold text-rose-600">{metrics.totalUsers - metrics.activeUsers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-md">
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Users & Staff</TabsTrigger>
          <TabsTrigger value="org-chart" className="data-[state=active]:bg-white data-[state=active]:shadow-sm" onClick={() => { if (orgChart.length === 0) loadOrgChart(); }}>Org Chart</TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">System Roles</TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">RBAC Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-6">
          {/* Search and Provision Button */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Filter users by name, email, role, or department..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={openAddDialog} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs">
                <Plus className="h-4 w-4 mr-2" />
                Register Account
              </Button>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-800">Staff Member</TableHead>
                    <TableHead className="font-semibold text-slate-800">Email Address</TableHead>
                    <TableHead className="font-semibold text-slate-800">System Role</TableHead>
                    <TableHead className="font-semibold text-slate-800">Department</TableHead>
                    <TableHead className="font-semibold text-slate-800">Status</TableHead>
                    <TableHead className="font-semibold text-slate-800 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                        No employees found matching the filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((userItem) => {
                      const fullName = `${userItem.firstName || ""} ${userItem.lastName || ""}`.trim() || userItem.username;
                      return (
                        <TableRow key={userItem.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-semibold text-slate-900">{fullName}</TableCell>
                          <TableCell className="text-sm text-slate-600">{userItem.email}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                userItem.role === "Admin" 
                                  ? "border-red-200 text-red-700 bg-red-50"
                                  : userItem.role === "Manager"
                                  ? "border-amber-200 text-amber-700 bg-amber-50"
                                  : "border-slate-200 text-slate-700 bg-slate-50"
                              }
                            >
                              {userItem.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-700 font-medium">{userItem.department || "Operations"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 hover:bg-transparent"
                              onClick={() => handleToggleStatus(userItem)}
                            >
                              <Badge
                                className="cursor-pointer font-medium"
                                variant={userItem.active !== false ? "default" : "secondary"}
                              >
                                {userItem.active !== false ? "Active" : "Inactive"}
                              </Badge>
                            </Button>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950 inline-flex items-center gap-1.5"
                              onClick={() => openHistory(userItem)}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              History
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950 inline-flex items-center gap-1.5"
                              onClick={() => openEditDialog(userItem)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 inline-flex items-center gap-1.5"
                              onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="org-chart" className="space-y-4 mt-6">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-900">Organisation Chart</h3>
              <p className="text-sm text-slate-500 mt-1">
                Auto-generated from each employee's reporting manager — re-renders automatically whenever a reporting line changes (§5.1).
              </p>
            </div>
            {orgChartLoading ? (
              <p className="text-sm text-slate-500">Loading org chart...</p>
            ) : orgChart.length === 0 ? (
              <p className="text-sm text-slate-500">No active employees found, or no reporting lines have been set yet.</p>
            ) : (
              <div>{orgChart.map((root) => renderOrgNode(root))}</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Add a New Role</h3>
            <p className="text-sm text-slate-500 mb-4">
              New roles are immediately available for assignment to users and in the RBAC Matrix tab — no code change required.
            </p>
            <form onSubmit={handleCreateRole} className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Role name, e.g. Warehouse Supervisor"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="sm:max-w-xs"
              />
              <Input
                placeholder="Description (optional)"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={creatingRole || !newRoleName.trim()}>
                {creatingRole ? "Adding..." : "Add Role"}
              </Button>
            </form>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-lg">{role.name}</h3>
                  </div>
                  <Badge className="bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100">{role.userCount} users active</Badge>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{role.description || "No description set."}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={role.isSystem ? "border-indigo-100 text-indigo-700 bg-indigo-50/50" : "border-emerald-100 text-emerald-700 bg-emerald-50/50"}>
                    {role.isSystem ? "System Role" : `${role.permissionKeys?.length || 0} permission(s)`}
                  </Badge>
                  {!role.isSystem && (
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteRole(role)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">RBAC Matrix</h3>
              <p className="text-sm text-slate-500 mt-1">
                Toggle a checkbox to grant or revoke a permission for a role — takes effect immediately, no code change or deployment required (§4).
                The <strong>Admin</strong> role is always a full-access superuser and is not governed by this matrix.
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-800 sticky left-0 bg-slate-50">Permission</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role.id} className="font-semibold text-slate-800 text-center whitespace-nowrap">
                        {role.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(
                    permissions.reduce((acc: Record<string, any[]>, p) => {
                      acc[p.module] = acc[p.module] || [];
                      acc[p.module].push(p);
                      return acc;
                    }, {})
                  ).map(([module, modulePermissions]) => (
                    <Fragment key={module}>
                      <TableRow key={`module-${module}`} className="bg-slate-100/70">
                        <TableCell colSpan={roles.length + 1} className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
                          {module}
                        </TableCell>
                      </TableRow>
                      {modulePermissions.map((perm) => (
                        <TableRow key={perm.id} className="hover:bg-slate-50/30">
                          <TableCell className="text-sm text-slate-700 sticky left-0 bg-white">
                            {perm.description || perm.key}
                          </TableCell>
                          {roles.map((role) => {
                            const isAdminRole = role.name === "Admin";
                            const checked = isAdminRole || (role.permissionKeys || []).includes(perm.key);
                            return (
                              <TableCell key={role.id} className="text-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={isAdminRole}
                                  onChange={(e) => handleTogglePermission(role, perm.key, e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* REGISTER ACCOUNT DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Register Staff Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">First Name</label>
                <Input 
                  required
                  placeholder="e.g. Adarsh" 
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Last Name</label>
                <Input 
                  required
                  placeholder="e.g. Pandey" 
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
              <Input 
                required
                type="email"
                placeholder="employee@planetone.com" 
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Username</label>
              <Input 
                required
                placeholder="username (unique)" 
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Account Password</label>
              <Input 
                type="password"
                placeholder="Leave blank for Password123!" 
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Employee ID</label>
                <Input placeholder="e.g. EMP-0042" value={formEmployeeId} onChange={(e) => setFormEmployeeId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Designation</label>
                <Input placeholder="e.g. Senior Geologist" value={formDesignation} onChange={(e) => setFormDesignation(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Reporting Manager</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={formReportingManagerId}
                  onChange={(e) => setFormReportingManagerId(e.target.value)}
                >
                  <option value="">None</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.username})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone</label>
                <Input placeholder="e.g. +233 20 000 0000" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Date Joined</label>
                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Qualifications</label>
                <Input placeholder="e.g. MSc Petroleum Engineering" value={formQualifications} onChange={(e) => setFormQualifications(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">System Role</label>
                <select 
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Department</label>
                <select 
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={formDepartmentId}
                  onChange={(e) => setFormDepartmentId(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox"
                id="formActive"
                checked={formActive}
                className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                onChange={(e) => setFormActive(e.target.checked)}
              />
              <label htmlFor="formActive" className="text-sm font-medium text-slate-800 cursor-pointer">
                Enable account immediate active authorization
              </label>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs">
                Register User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT ACCOUNT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Modify Staff Credentials</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">First Name</label>
                <Input 
                  required
                  placeholder="First Name" 
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Last Name</label>
                <Input 
                  required
                  placeholder="Last Name" 
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
              <Input 
                required
                type="email"
                placeholder="employee@planetone.com" 
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Username</label>
              <Input 
                required
                placeholder="username" 
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password Reset (Optional)</label>
              <Input 
                type="password"
                placeholder="Leave blank to keep current password" 
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Employee ID</label>
                <Input placeholder="e.g. EMP-0042" value={formEmployeeId} onChange={(e) => setFormEmployeeId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Designation</label>
                <Input placeholder="e.g. Senior Geologist" value={formDesignation} onChange={(e) => setFormDesignation(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Reporting Manager</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={formReportingManagerId}
                  onChange={(e) => setFormReportingManagerId(e.target.value)}
                >
                  <option value="">None</option>
                  {users.filter((u) => u.id !== selectedUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.username})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone</label>
                <Input placeholder="e.g. +233 20 000 0000" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Date Joined</label>
                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Qualifications</label>
                <Input placeholder="e.g. MSc Petroleum Engineering" value={formQualifications} onChange={(e) => setFormQualifications(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">System Role</label>
                <select 
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Department</label>
                <select 
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={formDepartmentId}
                  onChange={(e) => setFormDepartmentId(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox"
                id="formEditActive"
                checked={formActive}
                className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                onChange={(e) => setFormActive(e.target.checked)}
              />
              <label htmlFor="formEditActive" className="text-sm font-medium text-slate-800 cursor-pointer">
                Account status remains active
              </label>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PROFILE HISTORY DIALOG — reuses the central Audit Log (§5.1 acceptance criteria + §5.4) */}
      <Dialog open={!!historyUser} onOpenChange={(open) => { if (!open) setHistoryUser(null); }}>
        <DialogContent className="max-w-lg bg-white border border-slate-200 shadow-xl rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Profile History — {historyUser?.firstName} {historyUser?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 max-h-[60vh] overflow-y-auto space-y-2">
            {historyLoading ? (
              <p className="text-sm text-slate-500">Loading history...</p>
            ) : userHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No changes recorded for this profile yet.</p>
            ) : (
              userHistory.map((entry) => (
                <div key={entry.id} className="p-3 rounded-md border text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{entry.action}</span>
                    <span className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">by {entry.userEmail || "system"}</p>
                  {entry.newValue && (
                    <pre className="text-xs bg-slate-50 rounded p-2 mt-2 overflow-x-auto">{JSON.stringify(entry.newValue, null, 2)}</pre>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
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
import { 
  Search, 
  Plus, 
  UserPlus, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit3, 
  RefreshCw,
  Loader2
} from "lucide-react";
import { adminApi, departmentsApi } from "../../services/api";

export function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalActivities: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Hardcoded standard roles details for the Roles tab
  const rolesInfo = [
    { id: 1, name: "Admin", description: "Full system administration, security audits, database seed management, and user provisioning.", userCount: users.filter(u => u.role === "Admin").length },
    { id: 2, name: "Manager", description: "Operational oversight. Allowed to create and edit blocks, projects, workflows, risks, and tasks.", userCount: users.filter(u => u.role === "Manager").length },
    { id: 3, name: "User", description: "Standard business domain operations. Can view modules, upload documentation, and submit activity comments.", userCount: users.filter(u => u.role === "User").length },
    { id: 4, name: "Guest", description: "Public view-only visitor access. Restricted from performing database mutations or edits.", userCount: users.filter(u => u.role === "Guest").length }
  ];

  const permissionsInfo = [
    { module: "Dashboard Summary", Guest: "View Only", User: "View Only", Manager: "View Only", Admin: "Full Access" },
    { module: "Blocks & Assets", Guest: "View Only", User: "View Only", Manager: "Create & Edit", Admin: "Full Access" },
    { module: "Projects & Portfolios", Guest: "View Only", User: "View Only", Manager: "Create & Edit", Admin: "Full Access" },
    { module: "Project Tasks & Activities", Guest: "View Only", User: "View Only", Manager: "Create & Edit", Admin: "Full Access" },
    { module: "Finance & AFE Approvals", Guest: "No Access", User: "Departmental Only", Manager: "View & Approve", Admin: "Full Access" },
    { module: "Document Uploads", Guest: "No Access", User: "Create & Comment", Manager: "Full Access", Admin: "Full Access" },
    { module: "Risk & Mitigation Logs", Guest: "View Only", User: "View Only", Manager: "Create & Edit", Admin: "Full Access" },
    { module: "System Gating & Users", Guest: "No Access", User: "No Access", Manager: "No Access", Admin: "Full Access" }
  ];

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [usersData, dashboardMetrics, departmentsData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getDashboard(),
        departmentsApi.getAll()
      ]);
      setUsers(usersData);
      setMetrics(dashboardMetrics);
      setDepartments(departmentsData);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
      setErrorMsg(err.message || "An error occurred while loading administrative records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    setIsEditOpen(true);
  };

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
        active: formActive
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
        active: formActive
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
              <p className="text-2xl font-bold text-slate-900">{rolesInfo.length}</p>
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

        <TabsContent value="roles" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rolesInfo.map((role) => (
              <Card key={role.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-lg">{role.name} Role</h3>
                  </div>
                  <Badge className="bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100">{role.userCount} users active</Badge>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{role.description}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-indigo-100 text-indigo-700 bg-indigo-50/50">
                    System Pre-configured Static Access
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Departmental & Role Gating Matrix</h3>
              <p className="text-sm text-slate-500 mt-1">
                Visualizing static Role-Based Access Controls (RBAC) configured across backend routes and React interfaces.
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-800">Platform Asset / Module</TableHead>
                    <TableHead className="font-semibold text-slate-800">Guest Visitor</TableHead>
                    <TableHead className="font-semibold text-slate-800">Standard Employee</TableHead>
                    <TableHead className="font-semibold text-slate-800">Department Manager</TableHead>
                    <TableHead className="font-semibold text-slate-800">System Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionsInfo.map((perm, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/30">
                      <TableCell className="font-semibold text-slate-900">{perm.module}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={perm.Guest === "No Access" ? "border-rose-100 text-rose-700 bg-rose-50" : "border-slate-100 text-slate-500"}>
                          {perm.Guest}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={perm.User === "No Access" ? "border-rose-100 text-rose-700 bg-rose-50" : "border-blue-100 text-blue-700 bg-blue-50/30"}>
                          {perm.User}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                          {perm.Manager}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white border-0 font-medium">
                          {perm.Admin}
                        </Badge>
                      </TableCell>
                    </TableRow>
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
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">System Role</label>
                <select 
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                >
                  <option value="User">User</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
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
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">System Role</label>
                <select 
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                >
                  <option value="User">User</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
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
    </div>
  );
}

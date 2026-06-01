import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Search, Plus, UserPlus, Shield, CheckCircle, XCircle } from "lucide-react";

export function Admin() {
  const users = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@optifield.com",
      role: "Executive",
      department: "Management",
      status: "Active",
      lastLogin: "2026-05-01 14:30",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@optifield.com",
      role: "Project Manager",
      department: "Operations",
      status: "Active",
      lastLogin: "2026-05-01 13:15",
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike.chen@optifield.com",
      role: "Technical Lead",
      department: "Engineering",
      status: "Active",
      lastLogin: "2026-05-01 12:45",
    },
    {
      id: 4,
      name: "Emma Davis",
      email: "emma.davis@optifield.com",
      role: "Finance Manager",
      department: "Finance",
      status: "Active",
      lastLogin: "2026-05-01 11:20",
    },
    {
      id: 5,
      name: "James Wilson",
      email: "james.wilson@optifield.com",
      role: "HSE Manager",
      department: "HSE",
      status: "Active",
      lastLogin: "2026-04-30 16:00",
    },
    {
      id: 6,
      name: "Lisa Brown",
      email: "lisa.brown@optifield.com",
      role: "Analyst",
      department: "Operations",
      status: "Inactive",
      lastLogin: "2026-04-15 09:30",
    },
  ];

  const roles = [
    {
      id: 1,
      name: "Executive",
      description: "Full system access and approval authority",
      userCount: 2,
    },
    {
      id: 2,
      name: "Project Manager",
      description: "Manage projects and activities",
      userCount: 5,
    },
    {
      id: 3,
      name: "Technical Lead",
      description: "Technical review and oversight",
      userCount: 8,
    },
    {
      id: 4,
      name: "Finance Manager",
      description: "Financial management and AFE approval",
      userCount: 3,
    },
    {
      id: 5,
      name: "HSE Manager",
      description: "Health, safety, and environmental oversight",
      userCount: 4,
    },
    {
      id: 6,
      name: "Analyst",
      description: "Data analysis and reporting",
      userCount: 12,
    },
  ];

  const permissions = [
    { module: "Dashboard", view: true, create: false, edit: false, delete: false },
    { module: "Blocks", view: true, create: true, edit: true, delete: false },
    { module: "Projects", view: true, create: true, edit: true, delete: true },
    { module: "Activities", view: true, create: true, edit: true, delete: true },
    { module: "Documents", view: true, create: true, edit: true, delete: false },
    { module: "Workflows", view: true, create: true, edit: false, delete: false },
    { module: "Registers", view: true, create: true, edit: true, delete: false },
    { module: "Finance", view: true, create: false, edit: false, delete: false },
    { module: "Reports", view: true, create: true, edit: false, delete: false },
    { module: "Admin", view: false, create: false, edit: false, delete: false },
  ];

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handler = (e: any) => setSearchQuery(e?.detail?.query || "");
    window.addEventListener('globalSearch', handler as EventListener);
    return () => window.removeEventListener('globalSearch', handler as EventListener);
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredUsers = normalizedSearch
    ? users.filter((u) => [u.name, u.email, u.role, u.department]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : users;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Administration</h1>
          <p className="text-gray-500 mt-1">Manage users, roles, and permissions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl">
                {users.filter((u) => u.status === "Active").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Roles</p>
              <p className="text-2xl">{roles.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <XCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive Users</p>
              <p className="text-2xl">
                {users.filter((u) => u.status === "Inactive").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-6">
          {/* Search */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {user.lastLogin}
                    </TableCell>
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
        </TabsContent>

        <TabsContent value="roles" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <h3 className="font-medium">{role.name}</h3>
                  </div>
                  <Badge variant="outline">{role.userCount} users</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Edit Permissions
                  </Button>
                  <Button size="sm" variant="ghost">
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg mb-2">Permission Matrix - Project Manager Role</h3>
              <p className="text-sm text-gray-600">
                Configure access permissions for each module
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>View</TableHead>
                  <TableHead>Create</TableHead>
                  <TableHead>Edit</TableHead>
                  <TableHead>Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{perm.module}</TableCell>
                    <TableCell>
                      {perm.view ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {perm.create ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {perm.edit ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {perm.delete ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
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

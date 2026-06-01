import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Box, 
  FolderKanban, 
  Activity, 
  FileText, 
  GitBranch, 
  BookOpen, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  Menu,
  X,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isGuest } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const searchDebounceRef = useRef<number | null>(null);

  // Listen for global requests to close the sidebar (e.g., from pages opening dialogs)
  useEffect(() => {
    const handler = () => setSidebarOpen(false);
    window.addEventListener('closeSidebar', handler as EventListener);
    return () => window.removeEventListener('closeSidebar', handler as EventListener);
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Blocks", href: "/blocks", icon: Box },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Activities", href: "/activities", icon: Activity },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Workflows", href: "/workflows", icon: GitBranch },
    { name: "Registers", href: "/registers", icon: BookOpen },
    { name: "Finance", href: "/finance", icon: DollarSign },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    ...(isGuest ? [] : [{ name: "Admin", href: "/admin", icon: Settings }]),
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Box className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg">PlanetOne Oil & Gas</span>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search projects, documents, activities..."
                className="pl-10 bg-gray-50"
                onChange={(e) => {
                  const q = (e.target as HTMLInputElement).value || "";
                  if (searchDebounceRef.current) {
                    window.clearTimeout(searchDebounceRef.current);
                  }
                  // debounce broadcast
                  // @ts-ignore
                  searchDebounceRef.current = window.setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('globalSearch', { detail: { query: q } }));
                  }, 250);
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isGuest && (
              <Link to="/notifications">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                    3
                  </Badge>
                </Button>
              </Link>
            )}

            {user && (
              <>
                {isGuest ? (
                  <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
                    Login
                  </Button>
                ) : (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
                          </div>
                          <div className="hidden lg:block text-left">
                            <div className="text-sm font-medium">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.username}
                            </div>
                            <div className="text-xs text-gray-500">{user.department || user.departmentDetails?.name}</div>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-4 py-3 border-b">
                          <div className="text-sm font-semibold">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{user.email}</div>
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {user.department || user.departmentDetails?.name}
                            </Badge>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Logout</span>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-30 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? "lg:pl-64" : ""}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

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
  ChevronDown,
  ScrollText,
  FileSignature,
  ClipboardCheck,
  Mail,
  Gavel,
  Shield,
  Leaf,
  FileLock2,
  HardHat,
  Users,
  Wallet,
  ArrowLeftRight,
  Megaphone,
  Calculator
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { NotificationPopupEngine } from "./NotificationPopupEngine";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isGuest, isAdmin } = useAuth();
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
    { name: "Licences", href: "/licences", icon: ScrollText },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Tasks", href: "/tasks", icon: Activity }, // Activity icon or CheckSquare icon, using Activity for now as it's imported
  ];

  // Governance/registers introduced during Phase 2 — previously reachable
  // only by direct URL because they weren't listed in the sidebar.
  const governanceNavigation = [
    { name: "Contracts", href: "/contracts", icon: FileSignature },
    { name: "Compliance", href: "/compliance", icon: ClipboardCheck },
    { name: "Correspondence", href: "/correspondence", icon: Mail },
    { name: "Decisions", href: "/decisions", icon: Gavel },
    { name: "Insurance Register", href: "/insurance", icon: Shield },
    { name: "Environmental Permits", href: "/environmental-permits", icon: Leaf },
    { name: "NDA & Data Room", href: "/nda-tracker", icon: FileLock2 },
    { name: "HSE Register", href: "/hse", icon: HardHat },
  ];

  const financeOpsNavigation = [
    { name: "Budget Tracker", href: "/budget-tracker", icon: Calculator },
    { name: "Vendor Payments", href: "/vendor-payments", icon: Wallet },
    { name: "Forex Workflow", href: "/forex", icon: ArrowLeftRight },
    { name: "Local Content", href: "/local-content", icon: Users },
    { name: "Operations Updates", href: "/operations-updates", icon: Megaphone },
  ];

  const adminNavigation = isAdmin ? [{ name: "Admin", href: "/admin", icon: Settings }] : [];

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
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40 print:hidden">
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

          <div className="flex items-center gap-4">
            {user && (
              <>
                {isGuest ? (
                  <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
                    Login
                  </Button>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="hidden lg:block text-left">
                        <div className="text-sm font-medium text-gray-700">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        </div>
                        <div className="text-xs text-gray-500">{user.department || user.departmentDetails?.name}</div>
                      </div>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Logout</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-30 print:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
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

          <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Governance &amp; Registers</p>
          {governanceNavigation.map((item) => {
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

          <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Finance &amp; Operations</p>
          {financeOpsNavigation.map((item) => {
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

          {adminNavigation.length > 0 && (
            <>
              <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Admin</p>
              {adminNavigation.map((item) => {
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
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 print:pt-0 ${sidebarOpen ? "lg:pl-64" : ""} print:pl-0`}>
        <div className="p-6 print:p-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Recurring activity/compliance/licence pop-up reminders (§5.2) */}
      <NotificationPopupEngine />
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { Bell, AlertCircle, CheckCircle, Info, Clock, FileText, DollarSign, Trash2 } from "lucide-react";
import { notificationsApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

export function Notifications() {
  const { canEdit } = useAuth();
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await notificationsApi.getAll();
        if (data && data.length > 0) {
          setNotifications(data);
        } else {
          setNotifications(defaultNotifications);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setNotifications(defaultNotifications);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const defaultNotifications = [
    {
      id: 1,
      type: "critical",
      icon: AlertCircle,
      title: "Well A-1 drilling behind schedule",
      message: "Current delay: 5 days. Immediate attention required.",
      time: "2 hours ago",
      read: false,
      category: "Operations",
    },
    {
      id: 2,
      type: "warning",
      icon: Clock,
      title: "Environmental permit renewal required",
      message: "Block B environmental permit expires in 30 days.",
      time: "5 hours ago",
      read: false,
      category: "Compliance",
    },
    {
      id: 3,
      type: "success",
      icon: CheckCircle,
      title: "AFE Amendment Approved",
      message: "AFE amendment for Block A has been approved by executive team.",
      time: "1 day ago",
      read: false,
      category: "Finance",
    },
    {
      id: 4,
      type: "info",
      icon: FileText,
      title: "Monthly production report submitted",
      message: "April 2026 production report has been generated and submitted.",
      time: "1 day ago",
      read: true,
      category: "Reports",
    },
    {
      id: 5,
      type: "warning",
      icon: DollarSign,
      title: "Invoice pending approval",
      message: "Invoice INV-2026-003 from Seismic Survey Co requires your approval.",
      time: "2 days ago",
      read: true,
      category: "Finance",
    },
    {
      id: 6,
      type: "info",
      icon: Bell,
      title: "New document uploaded",
      message: "Drilling Plan - Well B-3 has been uploaded to the document library.",
      time: "2 days ago",
      read: true,
      category: "Documents",
    },
    {
      id: 7,
      type: "success",
      icon: CheckCircle,
      title: "Safety inspection completed",
      message: "Block A safety inspection passed with no issues.",
      time: "3 days ago",
      read: true,
      category: "HSE",
    },
    {
      id: 8,
      type: "critical",
      icon: AlertCircle,
      title: "HSE incident reported",
      message: "Minor incident reported at Block B. Review required.",
      time: "3 days ago",
      read: true,
      category: "HSE",
    },
  ];

  const renderedNotifications = notifications.length > 0 ? notifications : defaultNotifications;

  const getIconColor = (type: string) => {
    switch (type) {
      case "critical":
        return "text-red-600";
      case "warning":
        return "text-orange-600";
      case "success":
        return "text-green-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-100";
      case "warning":
        return "bg-orange-100";
      case "success":
        return "bg-green-100";
      case "info":
        return "bg-blue-100";
      default:
        return "bg-gray-100";
    }
  };

  const filteredNotifications =
    filter === "all"
      ? renderedNotifications
      : filter === "unread"
      ? renderedNotifications.filter((n) => !n.read)
      : renderedNotifications.filter((n) => n.read);

  const unreadCount = renderedNotifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} new</Badge>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Stay updated on important events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!canEdit}>Mark all as read</Button>
          <Button variant="outline" disabled={!canEdit}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading notifications...</p>
        </Card>
      ) : (
        <>
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({notifications.length - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <Card className="p-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map((notification, index) => {
                  const Icon = notification.icon || Info;
                  return (
                    <div key={notification.id}>
                      <div
                        className={`flex items-start gap-4 p-4 rounded-lg transition-colors hover:bg-gray-50 ${
                          !notification.read ? "bg-blue-50" : ""
                        }`}
                      >
                        <div
                          className={`w-10 h-10 ${getBgColor(
                            notification.type
                          )} rounded-full flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon
                            className={`h-5 w-5 ${getIconColor(
                              notification.type
                            )}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {notification.time}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button size="sm" variant="ghost" disabled={!canEdit}>
                                  Mark as read
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" disabled={!canEdit}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < filteredNotifications.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Settings */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Notification Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600">
                Receive notifications via email
              </p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Critical Alerts</p>
              <p className="text-sm text-gray-600">
                Always notify for critical events
              </p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Workflow Updates</p>
              <p className="text-sm text-gray-600">
                Notify when workflow items require action
              </p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
        </div>
      </Card>
        </>
      )}
    </div>
  );
}

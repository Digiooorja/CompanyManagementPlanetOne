import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { formatDisplayDateOrDefault } from "../lib/date";
import { Progress } from "../components/ui/progress";
import {
  Search,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";
import { blocksApi, documentsApi, activitiesApi, projectsApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

export function ExecutiveDashboard() {
  const { isGuest } = useAuth();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const countdownCards = [
    {
      title: "Drilling Deadline",
      date: "2026-08-30",
      daysLeft: 103,
      status: "critical",
      block: "Deep Water Block",
    },
    {
      title: "Licence Expiry",
      date: "2027-08-15",
      daysLeft: 465,
      status: "warning",
      block: "Shallow Water Block",
    },
    {
      title: "Contract Expiry",
      date: "2026-09-20",
      daysLeft: 142,
      status: "normal",
      block: "Service Contract #123",
    },
  ];

  const fetchBlocks = async () => {
    try {
      setLoadingBlocks(true);
      setBlockError(null);
      const data = await blocksApi.getAll();
      setBlocks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading blocks overview:', err);
      setBlockError('Unable to load blocks from the database.');
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const fetchSearchData = async () => {
    try {
      const [docs, acts, projs] = await Promise.all([
        documentsApi.getAll(),
        activitiesApi.getAll(),
        projectsApi.getAll(),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setActivities(Array.isArray(acts) ? acts : []);
      setProjects(Array.isArray(projs) ? projs : []);
    } catch (err) {
      console.error('Error loading dashboard search data:', err);
      setDocuments([]);
      setActivities([]);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchBlocks();
    fetchSearchData();
  }, []);

  useEffect(() => {
    const handler = (e: any) => setSearchQuery(e?.detail?.query || "");
    window.addEventListener('globalSearch', handler as EventListener);
    return () => window.removeEventListener('globalSearch', handler as EventListener);
  }, []);

  const alerts = [
    {
      id: 1,
      type: "critical",
      message: "Well A-1 drilling behind schedule by 5 days",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "warning",
      message: "Environmental permit renewal required for Block B",
      time: "5 hours ago",
    },
    {
      id: 3,
      type: "info",
      message: "Monthly production report submitted",
      time: "1 day ago",
    },
  ];

  const pendingApprovals = [
    { id: 1, type: "AFE", name: "Block A - Well Extension", amount: 5200000 },
    { id: 2, type: "Contract", name: "Drilling Services Agreement", amount: 12000000 },
    { id: 3, type: "Document", name: "Environmental Impact Assessment", amount: null },
  ];

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const searchResults = normalizedSearch
    ? [
        ...documents.map((doc) => ({
          page: 'Documents',
          title: doc.title || doc.name || 'Untitled document',
          subtitle: `${doc.documentType || doc.type || 'Document'} • ${doc.status || 'Unknown status'}`,
          link: `/documents/${doc.id}`,
          group: 'Documents',
        })),
        ...activities.map((activity) => ({
          page: 'Activities',
          title: activity.title || activity.name || 'Untitled activity',
          subtitle: `${activity.project || activity.project?.name || 'No project'} • ${activity.status || 'Unknown status'}`,
          link: `/activities/${activity.id}`,
          group: 'Activities',
        })),
        ...projects.map((project) => ({
          page: 'Projects',
          title: project.name || project.title || 'Untitled project',
          subtitle: `${project.block || project.blockName || 'No block'} • ${project.status || 'Unknown status'}`,
          link: `/projects/${project.id}`,
          group: 'Projects',
        })),
      ]
        .filter((item) =>
          [item.title, item.subtitle, item.page]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        )
    : [];

  const filteredCountdownCards = normalizedSearch
    ? countdownCards.filter((card) => [card.title, card.block, card.date]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : countdownCards;

  const filteredBlocks = normalizedSearch
    ? blocks.filter((block) => [block.name, block.operator, block.location, block.area, block.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : blocks;

  const filteredAlerts = normalizedSearch
    ? alerts.filter((alert) => [alert.message, alert.time, alert.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : alerts;

  const filteredPendingApprovals = normalizedSearch
    ? pendingApprovals.filter((approval) => [approval.type, approval.name, approval.amount?.toString()]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : pendingApprovals;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Executive Dashboard</h1>
          <p className="text-gray-500 mt-1">Executive overview and key metrics</p>
        </div>
        {!isGuest && (
          <Link to="/operational">
            <Button variant="outline">Switch to Operational View</Button>
          </Link>
        )}
      </div>

      {normalizedSearch && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-gray-500" />
            <div>
              <h2 className="text-xl">Search Results</h2>
              <p className="text-sm text-gray-500">Showing documents, activities, and projects matching “{searchQuery}”.</p>
            </div>
          </div>

          {searchResults.length === 0 ? (
            <p className="text-gray-600">No results found for “{searchQuery}”.</p>
          ) : (
            <div className="space-y-3">
              {searchResults.slice(0, 10).map((result, index) => (
                <Link
                  key={`${result.page}-${index}`}
                  to={result.link}
                  className="block rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{result.title}</p>
                      <p className="text-sm text-gray-500">{result.subtitle}</p>
                    </div>
                    <Badge variant="outline">{result.page}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Countdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredCountdownCards.map((card, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h3 className="font-medium">{card.title}</h3>
              </div>
              <Badge
                variant={
                  card.status === "critical"
                    ? "destructive"
                    : card.status === "warning"
                    ? "default"
                    : "outline"
                }
              >
                {card.daysLeft} days
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{card.block}</p>
              <p className="text-2xl">{card.date}</p>
              <Progress
                value={Math.max(0, 100 - (card.daysLeft / 365) * 100)}
                className="h-2"
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Blocks Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Blocks Overview</h2>
          {loadingBlocks && <span className="text-sm text-gray-500">Loading blocks...</span>}
        </div>

        {blockError ? (
          <Card className="p-6 bg-red-50 border border-red-200">
            <p className="text-red-700">{blockError}</p>
          </Card>
        ) : blocks.length === 0 ? (
          <Card className="p-6">
            <p className="text-gray-600">No blocks found in the database.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredBlocks.map((block) => (
              <Card key={block.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg">{block.name}</h3>
                    <p className="text-sm text-gray-500">{block.operator || block.location || 'No operator/location set'}</p>
                  </div>
                  <Badge variant={block.status === "Active" ? "default" : "outline"}>
                    {block.status}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Area:</span> {block.area || 'Unknown'}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span> {block.location || 'Unknown'}
                    </p>
                    <p>
                      <span className="font-medium">Licence Expiry:</span>{' '}
                      {block.licenceExpiry ? formatDisplayDateOrDefault(block.licenceExpiry) : 'Not set'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm text-gray-600">
                      {block.description ? block.description.slice(0, 100) : 'No description available'}
                    </div>
                    <Link to={`/blocks/${block.id}`}>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Panel */}
        <Card className="p-6">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Recent Alerts
          </h3>
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
              >
                {alert.type === "critical" && (
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                {alert.type === "warning" && (
                  <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                )}
                {alert.type === "info" && (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card className="p-6">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Approvals
          </h3>
          <div className="space-y-3">
            {filteredPendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{approval.type}</Badge>
                    <span className="text-sm">{approval.name}</span>
                  </div>
                  {approval.amount && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${(approval.amount / 1000000).toFixed(1)}M
                    </p>
                  )}
                </div>
                <Link to={`/workflows/${approval.id}`}>
                  <Button size="sm">Review</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

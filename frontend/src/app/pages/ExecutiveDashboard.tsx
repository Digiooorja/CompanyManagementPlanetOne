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
  User,
} from "lucide-react";
import { blocksApi, documentsApi, activitiesApi, projectsApi, financeApi, licencesApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

export function ExecutiveDashboard() {
  const { isGuest } = useAuth();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [pendingAFEs, setPendingAFEs] = useState<any[]>([]);
  const [licences, setLicences] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for inline AFE actions (Approve, Reject, Delegate)
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | 'Delegate' | null>(null);
  const [actionForm, setActionForm] = useState({ delegateTo: '', comment: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const computeMilestones = () => {
    const milestones: any[] = [];
    const now = new Date();

    // 1. Licences Expirations
    licences.forEach(lic => {
      if (lic.expiryDate && lic.status === 'Active') {
        const exp = new Date(lic.expiryDate);
        const diffTime = exp.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays < 365 * 2) {
          milestones.push({
            title: `${lic.licenceType || 'Licence'} Expiry`,
            date: exp.toISOString().split('T')[0],
            daysLeft: diffDays,
            status: diffDays < 90 ? 'critical' : diffDays < 180 ? 'warning' : 'normal',
            block: lic.licenceNumber || 'Unknown'
          });
        }
      }
    });

    // 2. Activities Deadlines
    activities.forEach(act => {
      if (act.endDate && act.status !== 'Completed') {
        const end = new Date(act.endDate);
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays < 180) {
          milestones.push({
            title: `Activity Deadline`,
            date: end.toISOString().split('T')[0],
            daysLeft: diffDays,
            status: diffDays < 14 ? 'critical' : diffDays < 30 ? 'warning' : 'normal',
            block: act.name || act.title || 'Unknown Activity'
          });
        }
      }
    });

    // 3. Projects Deadlines
    projects.forEach(proj => {
      if (proj.endDate && proj.status !== 'Completed') {
        const end = new Date(proj.endDate);
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays < 365) {
          milestones.push({
            title: `Project Deadline`,
            date: end.toISOString().split('T')[0],
            daysLeft: diffDays,
            status: diffDays < 30 ? 'critical' : diffDays < 90 ? 'warning' : 'normal',
            block: proj.name || proj.title || 'Unknown Project'
          });
        }
      }
    });

    // Sort by closest date and take top 3
    return milestones.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3);
  };

  const liveCountdownCards = computeMilestones();

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
      const [docs, acts, projs, afes, lics] = await Promise.all([
        documentsApi.getAll(),
        activitiesApi.getAll(),
        projectsApi.getAll(),
        financeApi.getPending(),
        licencesApi.getAll(),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setActivities(Array.isArray(acts) ? acts : []);
      setProjects(Array.isArray(projs) ? projs : []);
      setPendingAFEs(Array.isArray(afes) ? afes : []);
      setLicences(Array.isArray(lics) ? lics : []);
    } catch (err) {
      console.error('Error loading dashboard search data:', err);
      setDocuments([]);
      setActivities([]);
      setProjects([]);
      setPendingAFEs([]);
      setLicences([]);
    }
  };

  const handleAfeAction = async (afeId: number) => {
    if (!actionType) return;
    try {
      setActionLoading(true);
      if (actionType === 'Approve') {
        await financeApi.approve(afeId, { comment: actionForm.comment });
      } else if (actionType === 'Reject') {
        await financeApi.reject(afeId, { comment: actionForm.comment });
      } else if (actionType === 'Delegate') {
        if (!actionForm.delegateTo.trim()) return; // Must have delegate target
        await financeApi.delegate(afeId, { delegateTo: actionForm.delegateTo, comment: actionForm.comment });
      }
      
      // Remove it from the list since it's processed
      setPendingAFEs(prev => prev.filter(a => a.id !== afeId));
      setActiveActionId(null);
      setActionType(null);
      setActionForm({ delegateTo: '', comment: '' });
    } catch (err) {
      console.error('Failed to execute AFE action', err);
      alert('Action failed. You may not have permission.');
    } finally {
      setActionLoading(false);
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
    ? liveCountdownCards.filter((card) => [card.title, card.block, card.date]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : liveCountdownCards;

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

  const filteredPendingAFEs = normalizedSearch
    ? pendingAFEs.filter((afe) => [afe.afeNumber, afe.item, afe.amount?.toString(), afe.delegatedTo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : pendingAFEs;

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

        {/* Pending AFEs Inbox */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              AFE Action Inbox
            </h3>
            <Badge variant="outline">{filteredPendingAFEs.length} Pending</Badge>
          </div>
          
          <div className="space-y-4">
            {filteredPendingAFEs.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">You're all caught up!</p>
              </div>
            ) : (
              filteredPendingAFEs.map((afe) => (
                <div
                  key={afe.id}
                  className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm"
                >
                  <div className="p-4 bg-gray-50 flex items-start justify-between border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{afe.afeNumber || `AFE-${afe.id}`}</Badge>
                        <span className="font-medium">{afe.item}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {Number(afe.amount).toLocaleString()}
                        </span>
                        {afe.delegatedTo && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Holding: {afe.delegatedTo}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link to={`/finance/${afe.id}`}>
                      <Button size="sm" variant="ghost" className="text-blue-600">Details</Button>
                    </Link>
                  </div>

                  {/* Action Buttons */}
                  {activeActionId !== afe.id ? (
                    <div className="p-3 flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => { setActiveActionId(afe.id); setActionType('Approve'); }}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => { setActiveActionId(afe.id); setActionType('Reject'); }}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="flex-1"
                        onClick={() => { setActiveActionId(afe.id); setActionType('Delegate'); }}
                      >
                        Forward/Delegate
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50/50 space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        {actionType === 'Approve' && <CheckCircle className="h-4 w-4 text-green-600"/>}
                        {actionType === 'Reject' && <AlertCircle className="h-4 w-4 text-red-600"/>}
                        {actionType === 'Delegate' && <User className="h-4 w-4 text-blue-600"/>}
                        {actionType} AFE
                      </h4>
                      
                      {actionType === 'Delegate' && (
                        <div>
                          <label className="text-xs font-medium text-gray-700">Forward To (Name or Dept)</label>
                          <input
                            type="text"
                            list="department-options"
                            className="w-full mt-1 p-2 text-sm border rounded"
                            placeholder="e.g. Finance Department or John Doe"
                            value={actionForm.delegateTo}
                            onChange={e => setActionForm({...actionForm, delegateTo: e.target.value})}
                          />
                          <datalist id="department-options">
                            <option value="Executive Management" />
                            <option value="Procurement" />
                            <option value="Accounts" />
                            <option value="Operations" />
                            <option value="Finance & Accounts" />
                            <option value="HSE" />
                            <option value="Commercial" />
                            <option value="HR" />
                          </datalist>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-xs font-medium text-gray-700">Comment (Optional)</label>
                        <input
                          type="text"
                          className="w-full mt-1 p-2 text-sm border rounded"
                          placeholder="Add a note..."
                          value={actionForm.comment}
                          onChange={e => setActionForm({...actionForm, comment: e.target.value})}
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => { setActiveActionId(null); setActionType(null); }}
                          disabled={actionLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleAfeAction(afe.id)}
                          disabled={actionLoading || (actionType === 'Delegate' && !actionForm.delegateTo.trim())}
                        >
                          {actionLoading ? 'Processing...' : 'Confirm'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

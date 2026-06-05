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
  AlertTriangle,
} from "lucide-react";
import { blocksApi, documentsApi, activitiesApi, projectsApi, financeApi, licencesApi, risksApi } from "../../services/api";
import { useAuth } from "../contexts/AuthContext";

export function ExecutiveDashboard() {
  const { isGuest } = useAuth();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [pendingAFEs, setPendingAFEs] = useState<any[]>([]);
  const [licences, setLicences] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
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
      const [docs, acts, projs, afes, lics, rks] = await Promise.all([
        documentsApi.getAll(),
        activitiesApi.getAll(),
        projectsApi.getAll(),
        financeApi.getPending(),
        licencesApi.getAll(),
        risksApi.getAll(),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setActivities(Array.isArray(acts) ? acts : []);
      setProjects(Array.isArray(projs) ? projs : []);
      setPendingAFEs(Array.isArray(afes) ? afes : []);
      setLicences(Array.isArray(lics) ? lics : []);
      setRisks(Array.isArray(rks) ? rks : []);
    } catch (err) {
      console.error('Error loading dashboard search data:', err);
      setDocuments([]);
      setActivities([]);
      setProjects([]);
      setPendingAFEs([]);
      setLicences([]);
      setRisks([]);
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

  const criticalRisks = risks
    .filter(r => r.severity === 'High' || r.severity === 'Critical')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const topExpiringLicence = licences
    .filter(lic => lic.expiryDate && lic.status === 'Active')
    .map(lic => {
      const diffDays = Math.ceil((new Date(lic.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return { ...lic, diffDays };
    })
    .filter(lic => lic.diffDays > 0)
    .sort((a, b) => a.diffDays - b.diffDays)[0];

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

  const filteredRisks = normalizedSearch
    ? criticalRisks.filter((risk) => [risk.title, risk.description, risk.severity]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch))
    : criticalRisks;

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

      {/* Top Expirable Licence Widget */}
      {topExpiringLicence && (
        <Card className="p-4 bg-orange-50 border-orange-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900">Licence Action Required: {topExpiringLicence.licenceNumber}</h3>
              <p className="text-sm text-orange-700">
                {topExpiringLicence.licenceType} expires in <span className="font-bold">{topExpiringLicence.diffDays} days</span> 
                ({formatDisplayDateOrDefault(topExpiringLicence.expiryDate)}).
              </p>
            </div>
          </div>
          <Link to={!isGuest ? `/licences?edit=${topExpiringLicence.id}` : `/licences?search=${encodeURIComponent(topExpiringLicence.licenceNumber)}`}>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white shrink-0">
              Manage Licence
            </Button>
          </Link>
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

      {/* Sleek Asset Health Matrix */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Asset Health Matrix</h2>
          {loadingBlocks && <span className="text-sm text-gray-500 animate-pulse">Loading...</span>}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBlocks.map((block) => {
              const isActive = block.status === "Active";
              return (
                <Link to={`/blocks/${block.id}`} key={block.id}>
                  <Card className={`p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-l-4 cursor-pointer h-full flex flex-col justify-between ${isActive ? 'border-l-emerald-500 bg-white' : 'border-l-slate-300 bg-slate-50'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-800 truncate pr-2" title={block.name}>{block.name}</h3>
                        <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : ''}>
                          {block.status}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Operator</span>
                          <span className="font-medium text-right truncate max-w-[100px]">{block.operator || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Area</span>
                          <span className="font-medium">{block.area || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Risks Panel */}
        <Card className="p-6 border-l-4 border-l-red-500 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Critical Risks Alert Panel
            </h3>
            <Badge variant="destructive">{filteredRisks.length} High Priority</Badge>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {filteredRisks.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p>No critical risks currently active.</p>
              </div>
            ) : (
              filteredRisks.map((risk) => (
                <div key={risk.id} className="flex flex-col gap-1 p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-red-900 truncate" title={risk.title}>{risk.title}</span>
                    <Badge variant="outline" className="bg-white text-xs border-red-200 text-red-700 shrink-0">{risk.status || 'Open'}</Badge>
                  </div>
                  <p className="text-sm text-red-700 line-clamp-2" title={risk.description}>{risk.description}</p>
                </div>
              ))
            )}
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

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { ArrowLeft, MapPin, Users, FileText } from "lucide-react";
import { blocksApi, projectsApi, activitiesApi, documentsApi, registersApi, licencesApi, operationsUpdatesApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

export function BlockDetail() {
  const { id } = useParams();
  const { canEdit } = useAuth();
  const [block, setBlock] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [licences, setLicences] = useState<any[]>([]);
  const [operationsUpdates, setOperationsUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlockDetail = async () => {
      if (!id) {
        setError('Block ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const blockData = await blocksApi.getById(Number(id));
        setBlock(blockData);

        const blockProjects = await projectsApi.getByBlockId(Number(id));
        setProjects(blockProjects);

        try {
          const allLicences = await licencesApi.getAll();
          const linkedLics = allLicences.filter((l: any) => Array.isArray(l.blockIds) && l.blockIds.includes(Number(id)));
          setLicences(linkedLics);
        } catch (licErr) {
          console.warn('Failed to load licences:', licErr);
        }

        // Load documents for all projects under this block, including docs tagged to activities
        try {
          const projectIds = Array.isArray(blockProjects) ? blockProjects.map((p: any) => p.id).filter(Boolean) : [];
          let allDocs: any[] = [];

          if (projectIds.length > 0) {
            const docsPerProject = await Promise.all(
              projectIds.map((pid: number) => documentsApi.getByProjectId(pid))
            );
            const activityLists = await Promise.all(
              projectIds.map((pid: number) => activitiesApi.getByProjectId(pid))
            );
            const activityIds = activityLists.flat().map((activity: any) => Number(activity.id)).filter((id: number) => !Number.isNaN(id));
            const docsPerActivity = activityIds.length > 0
              ? (await Promise.all(activityIds.map((activityId: number) => documentsApi.getByActivityId(activityId)))).flat()
              : [];

            allDocs = [...docsPerProject.flat(), ...docsPerActivity];
          }

          setDocuments(Array.from(new Map(allDocs.map((doc: any) => [doc.id, doc])).values()));
        } catch (docErr) {
          console.warn('Failed to load block documents:', docErr);
          setDocuments([]);
        }

        // Load latest Operations Updates for this block (§5.12 acceptance
        // criteria: latest update surfaces automatically on the block summary page)
        try {
          const updates = await operationsUpdatesApi.getAll({ blockId: Number(id), limit: 3 });
          setOperationsUpdates(Array.isArray(updates) ? updates : []);
        } catch (opsErr) {
          console.warn('Failed to load operations updates:', opsErr);
          setOperationsUpdates([]);
        }

        // Load registers from backend
        try {
          const regs = await registersApi.getAll();
          setRegisters(Array.isArray(regs) ? regs : []);
        } catch (regErr) {
          console.warn('Failed to load registers:', regErr);
          setRegisters([]);
        }
      } catch (err) {
        console.error('Error loading block detail:', err);
        setError(err instanceof Error ? err.message : 'Unable to load block details');
      } finally {
        setLoading(false);
      }
    };

    fetchBlockDetail();
  }, [id]);

  const [documents, setDocuments] = useState<any[]>([]);
  const [registers, setRegisters] = useState<any[]>([]);

  const getDocumentSourceLabel = (doc: any) => {
    if (Array.isArray(doc.activityTags) && doc.activityTags.length > 0) {
      return `Activity: ${doc.activityTags.join(', ')}`;
    }
    if (doc.activityId) {
      return `Activity: ${doc.activityId}`;
    }
    if (doc.project) {
      return `Project: ${doc.project}`;
    }
    if (doc.projectId) {
      return `Project ID: ${doc.projectId}`;
    }
    return 'Unknown source';
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading block details...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card className="p-8 bg-red-50 border-red-200">
          <p className="text-center text-red-700">{error}</p>
        </Card>
      </div>
    );
  }

  if (!block) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/blocks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blocks
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl">{block.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {block.location}
            </div>
          </div>
        </div>
        <Badge variant="default">{block.status}</Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Operator</p>
          <p className="text-lg mt-1">{block.operator}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Working Interest</p>
          <p className="text-lg mt-1">{block.workingInterest}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Area</p>
          <p className="text-lg mt-1">{block.area}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Budget</p>
          <p className="text-lg mt-1">{block.budget != null ? `$${Number(block.budget).toLocaleString()}` : '-'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Spent</p>
          <p className="text-lg mt-1">{block.spent != null ? `$${Number(block.spent).toLocaleString()}` : '-'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Projects</p>
          <p className="text-lg mt-1">{projects.filter(p => p.status === "Active").length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="licences">Licences</TabsTrigger>
          <TabsTrigger value="registers">Registers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Latest Operations Update
              </h3>
              <Link to={`/operations-updates?blockId=${id}`}>
                <Button size="sm" variant="outline">View All Updates</Button>
              </Link>
            </div>
            {operationsUpdates.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No operations updates logged for this block yet.</p>
            ) : (
              <div className="space-y-4">
                {operationsUpdates.map((update) => (
                  <div key={update.id} className="p-4 bg-gray-50 rounded border border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                      <span>{formatDisplayDateOrDefault(update.date)}{update.wellName ? ` · ${update.wellName}` : ''}</span>
                      {update.author && <span>By {update.author}</span>}
                    </div>
                    <p className="text-gray-800">{update.summary}</p>
                    {update.keyIssues && (
                      <p className="text-sm text-amber-700 mt-2"><span className="font-medium">Key issues:</span> {update.keyIssues}</p>
                    )}
                    {update.nextSteps && (
                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Next steps:</span> {update.nextSteps}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Joint Venture Partners
            </h3>
            <div className="space-y-2">
              {(block.partners || []).map((partner: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <span>{partner}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.status}</Badge>
                    </TableCell>
                    <TableCell>${(project.budget / 1000000).toFixed(1)}M</TableCell>
                    <TableCell>{project.completion}%</TableCell>
                    <TableCell>
                      <Link to={`/projects/${project.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {doc.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.documentType || doc.type}</Badge>
                    </TableCell>
                    <TableCell>{getDocumentSourceLabel(doc)}</TableCell>
                    <TableCell>{formatDisplayDateOrDefault(doc.uploadDate)}</TableCell>
                    <TableCell>{doc.size ? `${doc.size} bytes` : 'Unknown'}</TableCell>
                    <TableCell>
                      <Link to={`/documents/${doc.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="licences" className="mt-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Associated Licences</h3>
              <Link to="/licences">
                <Button size="sm" variant="outline">Manage All Licences</Button>
              </Link>
            </div>
            {licences.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No licences linked to this block.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Licence Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licences.map(lic => (
                    <TableRow key={lic.id}>
                      <TableCell className="font-medium text-primary">
                        <Link 
                          to={canEdit ? `/licences?edit=${lic.id}` : `/licences?search=${encodeURIComponent(lic.licenceNumber)}`}
                          className="text-primary hover:underline"
                        >
                          {lic.licenceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{lic.licenceType}</TableCell>
                      <TableCell>
                        <Badge variant={lic.status === 'Active' ? 'default' : lic.status === 'Suspended' ? 'destructive' : 'outline'}>
                          {lic.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{lic.issuedBy || '-'}</TableCell>
                      <TableCell>{formatDisplayDateOrDefault(lic.expiryDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="registers" className="mt-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {registers.map((register) => (
                <Card key={register.id} className="p-4">
                  <h4 className="font-medium mb-2">{register.name}</h4>
                  <p className="text-sm text-gray-600">
                    {Array.isArray(register.value) ? `${register.value.length} entries` : (register.value && typeof register.value === 'object') ? `${Object.keys(register.value).length} entries` : 'Entries: N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated: {formatDisplayDateOrDefault(register.updatedAt || register.updatedAt)}
                  </p>
                  <Link to={`/registers/${register.id}`}>
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      View Register
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

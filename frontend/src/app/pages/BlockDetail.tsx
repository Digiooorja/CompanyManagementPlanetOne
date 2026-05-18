import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { ArrowLeft, MapPin, Calendar, Users, FileText } from "lucide-react";
import { blocksApi, projectsApi } from "../../services/api";

export function BlockDetail() {
  const { id } = useParams();
  const [block, setBlock] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
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
      } catch (err) {
        console.error('Error loading block detail:', err);
        setError(err instanceof Error ? err.message : 'Unable to load block details');
      } finally {
        setLoading(false);
      }
    };

    fetchBlockDetail();
  }, [id]);

  const documents = [
    {
      id: 1,
      name: "Licence Agreement",
      type: "Legal",
      uploadDate: "2020-03-15",
      size: "2.4 MB",
    },
    {
      id: 2,
      name: "Environmental Impact Assessment",
      type: "Environmental",
      uploadDate: "2020-05-20",
      size: "5.1 MB",
    },
    {
      id: 3,
      name: "Field Development Plan",
      type: "Technical",
      uploadDate: "2021-01-10",
      size: "12.8 MB",
    },
  ];

  const registers = [
    { id: 1, name: "Risk Register", entries: 12, lastUpdated: "2026-04-28" },
    { id: 2, name: "Asset Register", entries: 45, lastUpdated: "2026-04-30" },
    { id: 3, name: "Compliance Register", entries: 28, lastUpdated: "2026-04-25" },
  ];

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
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Licence: {block.licenceStart} - {block.licenceExpiry}
            </div>
          </div>
        </div>
        <Badge variant="default">{block.status}</Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <TabsTrigger value="registers">Registers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Joint Venture Partners
            </h3>
            <div className="space-y-2">
              {(block.partners || []).map((partner, index) => (
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
                      {doc.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.type}</Badge>
                    </TableCell>
                    <TableCell>{doc.uploadDate}</TableCell>
                    <TableCell>{doc.size}</TableCell>
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

        <TabsContent value="registers" className="mt-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {registers.map((register) => (
                <Card key={register.id} className="p-4">
                  <h4 className="font-medium mb-2">{register.name}</h4>
                  <p className="text-sm text-gray-600">
                    {register.entries} entries
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated: {register.lastUpdated}
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

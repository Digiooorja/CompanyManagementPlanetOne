import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Search, Plus, FileText, FolderOpen, Download } from "lucide-react";
import { documentsApi } from "../../services/api";

export function Documents() {
  const [filterBlock, setFilterBlock] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultDocuments = [
    {
      id: 1,
      name: "Drilling Plan - Well B-3",
      type: "Technical",
      block: "Block B",
      project: "Well B-3 Development",
      uploadDate: "2026-04-10",
      uploadedBy: "Mike Chen",
      size: "4.2 MB",
      status: "Approved",
    },
    {
      id: 2,
      name: "Environmental Impact Assessment",
      type: "Environmental",
      block: "Block A",
      project: "DWTCP Deep Water",
      uploadDate: "2026-03-22",
      uploadedBy: "Emma Davis",
      size: "8.7 MB",
      status: "Approved",
    },
    {
      id: 3,
      name: "AFE Amendment Request",
      type: "Finance",
      block: "Block A",
      project: "Onshore",
      uploadDate: "2026-04-30",
      uploadedBy: "James Wilson",
      size: "1.5 MB",
      status: "Pending Review",
    },
    {
      id: 4,
      name: "Safety Inspection Report Q1",
      type: "HSE",
      block: "Block B",
      project: "Operations",
      uploadDate: "2026-04-05",
      uploadedBy: "Sarah Johnson",
      size: "3.1 MB",
      status: "Approved",
    },
    {
      id: 5,
      name: "Seismic Survey Results",
      type: "Technical",
      block: "Block C",
      project: "Exploration Phase 1",
      uploadDate: "2026-04-18",
      uploadedBy: "Lisa Brown",
      size: "15.4 MB",
      status: "Under Review",
    },
    {
      id: 6,
      name: "Licence Renewal Application",
      type: "Legal",
      block: "Block A",
      project: null,
      uploadDate: "2026-04-25",
      uploadedBy: "Mike Chen",
      size: "2.8 MB",
      status: "Pending Approval",
    },
  ];

  const renderedDocuments = documents.length > 0 ? documents : defaultDocuments;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "default";
      case "Under Review":
        return "secondary";
      case "Pending Review":
        return "outline";
      case "Pending Approval":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Document Management</h1>
          <p className="text-gray-500 mt-1">Centralized document library</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search documents..."
              className="pl-10"
            />
          </div>
          <Select value={filterBlock} onValueChange={setFilterBlock}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blocks</SelectItem>
              <SelectItem value="block-a">Block A</SelectItem>
              <SelectItem value="block-b">Block B</SelectItem>
              <SelectItem value="block-c">Block C</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="hse">HSE</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="environmental">Environmental</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8">
          <p className="text-center text-gray-500">Loading documents...</p>
        </Card>
      ) : (
        <>
      {/* Document Folders */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium">Technical</p>
              <p className="text-sm text-gray-500">24 files</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium">Finance</p>
              <p className="text-sm text-gray-500">12 files</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-orange-600" />
            <div>
              <p className="font-medium">HSE</p>
              <p className="text-sm text-gray-500">18 files</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-purple-600" />
            <div>
              <p className="font-medium">Legal</p>
              <p className="text-sm text-gray-500">8 files</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Documents Table */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderedDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <Link
                    to={`/documents/${doc.id}`}
                    className="hover:underline"
                  >
                    {doc.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{doc.type}</Badge>
                </TableCell>
                <TableCell>{doc.block}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {doc.project || "-"}
                </TableCell>
                <TableCell>{doc.uploadDate}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {doc.uploadedBy}
                </TableCell>
                <TableCell>{doc.size}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(doc.status)}>
                    {doc.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Link to={`/documents/${doc.id}`}>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
        </>
      )}
    </div>
  );
}

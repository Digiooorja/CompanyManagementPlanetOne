import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, FileText, Download, Share2, Trash2, Clock } from "lucide-react";

export function DocumentDetail() {
  const { id } = useParams();

  const document = {
    id: 1,
    name: "Drilling Plan - Well B-3",
    type: "Technical",
    block: "Block B",
    project: "Well B-3 Development",
    uploadDate: "2026-04-10",
    uploadedBy: "Mike Chen",
    size: "4.2 MB",
    status: "Approved",
    description: "Comprehensive drilling plan for Well B-3 including operational procedures, safety protocols, and equipment specifications.",
    version: "2.1",
    workflowStatus: "Approved by Legal",
  };

  const versionHistory = [
    { version: "2.1", date: "2026-04-10", uploadedBy: "Mike Chen", changes: "Updated safety procedures" },
    { version: "2.0", date: "2026-04-05", uploadedBy: "Mike Chen", changes: "Major revision - equipment updates" },
    { version: "1.5", date: "2026-03-28", uploadedBy: "Sarah Johnson", changes: "Added environmental considerations" },
    { version: "1.0", date: "2026-03-15", uploadedBy: "Mike Chen", changes: "Initial version" },
  ];

  const metadata = [
    { label: "Document Type", value: document.type },
    { label: "Block", value: document.block },
    { label: "Project", value: document.project },
    { label: "File Size", value: document.size },
    { label: "Version", value: document.version },
    { label: "Created Date", value: document.uploadDate },
    { label: "Created By", value: document.uploadedBy },
    { label: "Status", value: document.status },
  ];

  const workflowSteps = [
    { step: "Uploaded", status: "Completed", date: "2026-04-10 09:30", user: "Mike Chen" },
    { step: "Technical Review", status: "Completed", date: "2026-04-10 14:15", user: "Emma Davis" },
    { step: "HSE Review", status: "Completed", date: "2026-04-11 10:00", user: "James Wilson" },
    { step: "Legal Review", status: "Completed", date: "2026-04-12 16:30", user: "Lisa Brown" },
    { step: "Final Approval", status: "Completed", date: "2026-04-13 11:00", user: "Sarah Johnson" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl flex items-center gap-3">
            <FileText className="h-8 w-8" />
            {document.name}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <Badge variant="outline">{document.type}</Badge>
            <span>Version {document.version}</span>
            <span>Uploaded {document.uploadDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{document.status}</Badge>
        </div>
      </div>

      <div className="flex gap-3">
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline">Edit</Button>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Preview */}
          <Card className="p-6">
            <h3 className="text-lg mb-4">File Preview</h3>
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-3" />
                <p>Document preview not available</p>
                <Button variant="link" className="mt-2">
                  <Download className="h-4 w-4 mr-2" />
                  Download to view
                </Button>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6">
            <h3 className="text-lg mb-3">Description</h3>
            <p className="text-gray-700">{document.description}</p>
          </Card>

          {/* Version History */}
          <Card className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Version History
            </h3>
            <div className="space-y-3">
              {versionHistory.map((version, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Badge variant={index === 0 ? "default" : "outline"}>
                        v{version.version}
                      </Badge>
                      <div>
                        <p className="text-sm">{version.changes}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {version.date} by {version.uploadedBy}
                        </p>
                      </div>
                    </div>
                    {index > 0 && (
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {index < versionHistory.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </Card>

          {/* Workflow Status */}
          <Card className="p-6">
            <h3 className="text-lg mb-4">Workflow Status</h3>
            <div className="space-y-4">
              {workflowSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        step.status === "Completed"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    {index < workflowSteps.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{step.step}</p>
                      <Badge
                        variant={
                          step.status === "Completed" ? "default" : "outline"
                        }
                      >
                        {step.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {step.date} by {step.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar - Metadata */}
        <div className="space-y-6">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Metadata</h4>
            <div className="space-y-3 text-sm">
              {metadata.map((item, index) => (
                <div key={index}>
                  <p className="text-gray-600">{item.label}</p>
                  <p className="mt-1">{item.value}</p>
                  {index < metadata.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Actions</h4>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Request Review
              </Button>
              <Button variant="outline" className="w-full">
                Upload New Version
              </Button>
              <Button variant="outline" className="w-full">
                Move to Folder
              </Button>
              <Button variant="outline" className="w-full">
                Export Metadata
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

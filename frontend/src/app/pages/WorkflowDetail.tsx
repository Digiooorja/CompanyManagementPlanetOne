import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Clock } from "lucide-react";

export function WorkflowDetail() {
  const { id } = useParams();

  const workflow = {
    id: 1,
    title: "AFE Amendment - Block A",
    type: "Finance Approval",
    submittedBy: "Sarah Johnson",
    submitDate: "2026-04-30 14:30",
    currentStep: "Executive Approval",
    status: "Awaiting Action",
    priority: "High",
    dueDate: "2026-05-05",
    description: "Request for AFE amendment to increase budget allocation for Onshore drilling operations due to unexpected geological conditions.",
    amount: 5200000,
  };

  const workflowSteps = [
    {
      step: "Submitted",
      status: "Completed",
      date: "2026-04-30 14:30",
      user: "Sarah Johnson",
      action: "Submitted for approval",
      comment: null,
    },
    {
      step: "Manager Review",
      status: "Completed",
      date: "2026-04-30 16:45",
      user: "Mike Chen",
      action: "Approved",
      comment: "Reviewed and approved. Budget justification is sound.",
    },
    {
      step: "Finance Review",
      status: "Completed",
      date: "2026-05-01 10:15",
      user: "Emma Davis",
      action: "Approved",
      comment: "Financial analysis completed. Funds available.",
    },
    {
      step: "Executive Approval",
      status: "Pending",
      date: null,
      user: "John Smith",
      action: null,
      comment: null,
    },
    {
      step: "Final Processing",
      status: "Not Started",
      date: null,
      user: "System",
      action: null,
      comment: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/workflows">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl">{workflow.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <Badge variant="outline">{workflow.type}</Badge>
            <span>Submitted by {workflow.submittedBy}</span>
            <span>{workflow.submitDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive">{workflow.priority}</Badge>
          <Badge variant="destructive">{workflow.status}</Badge>
        </div>
      </div>

      {/* Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-xl mt-1">
              ${(workflow.amount / 1000000).toFixed(1)}M
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Step</p>
            <p className="text-xl mt-1">{workflow.currentStep}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Due Date</p>
            <p className="text-xl mt-1">{workflow.dueDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Days Remaining</p>
            <p className="text-xl mt-1">4</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h3 className="text-lg mb-3">Description</h3>
            <p className="text-gray-700">{workflow.description}</p>
          </Card>

          {/* Workflow Timeline */}
          <Card className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Workflow Timeline
            </h3>
            <div className="space-y-6">
              {workflowSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.status === "Completed"
                          ? "bg-green-100"
                          : step.status === "Pending"
                          ? "bg-yellow-100 ring-2 ring-yellow-400"
                          : "bg-gray-100"
                      }`}
                    >
                      {step.status === "Completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : step.status === "Pending" ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                      )}
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div
                        className={`w-0.5 h-16 mt-2 ${
                          step.status === "Completed"
                            ? "bg-green-300"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{step.step}</p>
                        <p className="text-sm text-gray-600">{step.user}</p>
                      </div>
                      <Badge
                        variant={
                          step.status === "Completed"
                            ? "default"
                            : step.status === "Pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {step.status}
                      </Badge>
                    </div>
                    {step.date && (
                      <p className="text-sm text-gray-500 mt-1">{step.date}</p>
                    )}
                    {step.action && (
                      <Badge variant="outline" className="mt-2">
                        {step.action}
                      </Badge>
                    )}
                    {step.comment && (
                      <div className="mt-3 p-3 bg-gray-50 rounded flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                        <p className="text-sm text-gray-700">{step.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          {workflow.status === "Awaiting Action" && (
            <Card className="p-6">
              <h3 className="text-lg mb-4">Take Action</h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="Add comment (optional)..."
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
                <Button variant="outline" className="w-full">
                  Request More Information
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Details</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Type</p>
                <Badge variant="outline" className="mt-1">
                  {workflow.type}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Status</p>
                <Badge variant="destructive" className="mt-1">
                  {workflow.status}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Priority</p>
                <Badge variant="destructive" className="mt-1">
                  {workflow.priority}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Submitted By</p>
                <p className="mt-1">{workflow.submittedBy}</p>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Submit Date</p>
                <p className="mt-1">{workflow.submitDate}</p>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Due Date</p>
                <p className="mt-1">{workflow.dueDate}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Related Documents</h4>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm">
                AFE Amendment Form.pdf
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                Budget Analysis.xlsx
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                Geological Report.pdf
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

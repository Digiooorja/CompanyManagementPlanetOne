import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Clock } from "lucide-react";
import { workflowsApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";

export function WorkflowDetail() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [actionSaving, setActionSaving] = useState(false);

  const defaultWorkflow = {
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
    steps: [
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
    ],
  };

  const loadWorkflow = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await workflowsApi.getById(Number(id));
      setWorkflow(data);
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError('Unable to load workflow details.');
      setWorkflow(defaultWorkflow);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const workflowSteps = Array.isArray(workflow?.steps) && workflow.steps.length > 0
    ? workflow.steps
    : defaultWorkflow.steps;

  const handleWorkflowAction = async (newStatus: 'Approved' | 'Rejected') => {
    if (!workflow) return;
    setActionSaving(true);
    setError(null);

    try {
      const updated = await workflowsApi.update(workflow.id, {
        status: newStatus,
      });
      setWorkflow(updated);
      setActionComment("");
    } catch (err) {
      console.error('Error updating workflow:', err);
      setError('Unable to update workflow status.');
    } finally {
      setActionSaving(false);
    }
  };

  const currentWorkflow = workflow || defaultWorkflow;

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

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">{currentWorkflow.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <Badge variant="outline">{currentWorkflow.type}</Badge>
            <span>Submitted by {currentWorkflow.submittedBy}</span>
            <span>{formatDisplayDateOrDefault(currentWorkflow.submitDate)}</span>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{currentWorkflow.priority}</Badge>
            <Badge variant="destructive">{currentWorkflow.status}</Badge>
          </div>
          {currentWorkflow.status === "Awaiting Action" && (
            <div className="flex flex-wrap gap-2">
              <Button
                className="flex items-center gap-2"
                size="sm"
                onClick={() => handleWorkflowAction('Approved')}
                disabled={actionSaving}
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                className="flex items-center gap-2"
                size="sm"
                onClick={() => handleWorkflowAction('Rejected')}
                disabled={actionSaving}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-xl mt-1">
              ${(currentWorkflow.amount / 1000000).toFixed(1)}M
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Step</p>
            <p className="text-xl mt-1">{currentWorkflow.currentStep}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Due Date</p>
            <p className="text-xl mt-1">{formatDisplayDateOrDefault(currentWorkflow.dueDate)}</p>
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
            <p className="text-gray-700">{currentWorkflow.description}</p>
          </Card>

          {/* Workflow Timeline */}
          <Card className="p-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Workflow Timeline
            </h3>
            <div className="space-y-6">
              {workflowSteps.map((step: any, index: number) => (
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
          {currentWorkflow.status === "Awaiting Action" && (
            <Card className="p-6">
              <h3 className="text-lg mb-4">Take Action</h3>
              <div className="space-y-4">
                <Textarea
                  value={actionComment}
                  onChange={(event) => setActionComment(event.target.value)}
                  placeholder="Add comment (optional)..."
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => handleWorkflowAction('Approved')}
                    disabled={actionSaving}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleWorkflowAction('Rejected')}
                    disabled={actionSaving}
                  >
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
                  {currentWorkflow.type}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Status</p>
                <Badge variant="destructive" className="mt-1">
                  {currentWorkflow.status}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Priority</p>
                <Badge variant="destructive" className="mt-1">
                  {currentWorkflow.priority}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Submitted By</p>
                <p className="mt-1">{currentWorkflow.submittedBy}</p>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Submit Date</p>
                <p className="mt-1">{formatDisplayDateOrDefault(currentWorkflow.submitDate)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-gray-600">Due Date</p>
                <p className="mt-1">{formatDisplayDateOrDefault(currentWorkflow.dueDate)}</p>
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

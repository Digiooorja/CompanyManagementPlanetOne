import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Clock, FileText } from "lucide-react";
import { workflowsApi, financeApi, documentsApi } from "../../services/api";
import { formatDisplayDateOrDefault } from "../lib/date";
import { useAuth } from "../contexts/AuthContext";

export function WorkflowDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [workflow, setWorkflow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [actionSaving, setActionSaving] = useState(false);
  const [relatedDocuments, setRelatedDocuments] = useState<any[]>([]);

  const loadWorkflow = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      setRelatedDocuments([]);

      // Handle finance AFE items (ids like "finance-123")
      if (String(id).startsWith('finance-')) {
        const parts = String(id).split('-');
        const fid = Number(parts[1]);
        const f = await financeApi.getById(fid);
        // Map finance item to workflow-like shape used in this page
        const mapped = {
          id: `finance-${f.id}`,
          financeId: f.id,
          title: f.item || `AFE #${f.afeNumber || f.id}`,
          type: f.type || 'AFE Approval',
          submittedBy: f.submittedBy || f.createdBy || '',
          submitDate: f.date || f.createdAt,
          currentStep: f.currentStep || `Awaiting ${f.approvalDepartment || 'Approval'}`,
          status: f.status || 'Pending',
          priority: f.priority || 'Medium',
          dueDate: f.dueDate || null,
          description: f.description || f.category || '',
          amount: Number(f.amount) || 0,
          approvalDepartment: f.approvalDepartment || '',
          afeNumber: f.afeNumber || '',
          steps: Array.isArray(f.steps) ? f.steps : [],
          original: f,
        };
        setWorkflow(mapped);

        // Real "related documents" for an AFE = documents tagged to the same
        // activity (Document.activityId), the only actual FK this record has
        // to hang evidence off of — Workflow/Finance have no direct document
        // link in the schema (fixed 2026-07-07, previously a hardcoded fake list).
        if (f.activityId) {
          try {
            const docs = await documentsApi.getByActivityId(f.activityId);
            setRelatedDocuments(Array.isArray(docs) ? docs : []);
          } catch (docErr) {
            console.warn('Failed to load related documents:', docErr);
          }
        }
        return;
      }

      const data = await workflowsApi.getById(Number(id));
      setWorkflow(data);
      // Plain Workflow records have no document-linking field in the schema
      // yet, so there are genuinely no "related documents" to show for them.
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError('Unable to load workflow details.');
      setWorkflow(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const deriveFinanceSteps = (workflowItem: any) => {
    if (!workflowItem) return [];
    const steps = workflowItem.steps && workflowItem.steps.length > 0 ? workflowItem.steps : [];
    if (steps.length > 0) return steps;

    return [
      {
        step: 'Submitted',
        status: 'Completed',
        date: workflowItem.submitDate || workflowItem.original?.createdAt || null,
        user: workflowItem.submittedBy || workflowItem.original?.submittedBy || 'Unknown',
        action: 'Submitted for approval',
        comment: null,
      },
      {
        step: workflowItem.currentStep || 'Approval',
        status: workflowItem.status === 'Approved' ? 'Completed' : workflowItem.status === 'Rejected' ? 'Rejected' : 'Pending',
        date: workflowItem.status === 'Approved' || workflowItem.status === 'Rejected' ? workflowItem.original?.updatedAt || null : null,
        user: workflowItem.original?.approvedBy || 'Approver',
        action: workflowItem.status === 'Approved' ? 'Approved' : workflowItem.status === 'Rejected' ? 'Rejected' : null,
        comment: workflowItem.original?.actionComment || null,
      }
    ];
  };

  const workflowSteps = Array.isArray(workflow?.steps)
    ? workflow.steps.length > 0
      ? workflow.steps
      : workflow?.financeId
        ? deriveFinanceSteps(workflow)
        : []
    : [];

  const handleWorkflowAction = async (newStatus: 'Approved' | 'Rejected') => {
    if (!workflow) return;
    setActionSaving(true);
    setError(null);

    const userName = user 
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username 
      : "Approver";

    try {
      // If this is a finance AFE mapped item, update via financeApi
      if ((workflow as any).financeId) {
        const fid = (workflow as any).financeId;
        const updated = await financeApi.update(fid, { 
          status: newStatus,
          approvedBy: userName,
          actionComment: actionComment || null
        });
        // reflect changes in UI
        const updatedAny: any = updated;
        setWorkflow((prev: any) => ({ ...(prev || {}), status: updatedAny.status, original: updatedAny }));
        setActionComment("");
        return;
      }

      // Generate date string in format YYYY-MM-DD HH:MM
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

      // 1. Construct new steps array for standard workflows
      const updatedSteps = [...workflowSteps].map((s) => ({ ...s }));
      const pendingIndex = updatedSteps.findIndex(
        (s) => s.status === "Pending" || s.step === workflow.currentStep
      );

      if (pendingIndex !== -1) {
        // Complete the active step
        updatedSteps[pendingIndex].status = newStatus === "Approved" ? "Completed" : "Rejected";
        updatedSteps[pendingIndex].action = newStatus === "Approved" ? "Approved" : "Rejected";
        updatedSteps[pendingIndex].comment = actionComment || null;
        updatedSteps[pendingIndex].date = formattedDate;
        updatedSteps[pendingIndex].user = userName;

        // Shift next step to Pending if approved
        if (newStatus === "Approved" && pendingIndex + 1 < updatedSteps.length) {
          updatedSteps[pendingIndex + 1].status = "Pending";
        }
      }

      // 2. Identify the new step name
      let nextStepName = workflow.currentStep;
      if (newStatus === "Approved") {
        const nextPending = updatedSteps.find((s) => s.status === "Pending");
        nextStepName = nextPending ? nextPending.step : "Completed";
      } else {
        nextStepName = "Rejected";
      }

      const updated = await workflowsApi.update(workflow.id, {
        status: newStatus,
        steps: updatedSteps,
        currentStep: nextStepName,
      });

      setWorkflow(updated);
      setActionComment("");
    } catch (err: any) {
      console.error('Error updating workflow:', err);
      setError(err.message || 'Unable to update workflow status.');
    } finally {
      setActionSaving(false);
    }
  };

  const currentWorkflow = workflow;

  const daysRemaining = (() => {
    if (!currentWorkflow?.dueDate) return null;
    const diff = new Date(currentWorkflow.dueDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();

  if (loading) {
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
        <Card className="p-8 text-center text-gray-500">Loading workflow...</Card>
      </div>
    );
  }

  if (error || !currentWorkflow) {
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
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error || 'Workflow not found.'}</p>
        </Card>
      </div>
    );
  }

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
          {['Awaiting Action', 'Pending', 'Approval Required', 'Under Review'].includes(currentWorkflow.status) && (
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
            <p className="text-xl mt-1">
              {daysRemaining === null ? '-' : daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : daysRemaining}
            </p>
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
            {relatedDocuments.length === 0 ? (
              <p className="text-sm text-gray-500">No linked documents.</p>
            ) : (
              <div className="space-y-2">
                {relatedDocuments.map((doc) => (
                  <Link key={doc.id} to={`/documents/${doc.id}`}>
                    <Button variant="outline" className="w-full justify-start text-sm gap-2">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{doc.title || doc.name}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

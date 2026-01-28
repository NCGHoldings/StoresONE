import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  User,
  ArrowRight,
  Send,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useApprovalRequestByEntity,
  useApproveRequest,
  useRejectRequest,
  useSendBackRequest,
  useAddApprovalComment,
  useMyPendingApprovals,
  getActionLabel,
  ApprovalStep,
  ApprovalAction,
  StepApprover,
  APPROVER_TYPES,
} from "@/hooks/useApprovalWorkflow";

interface ApprovalProgressProps {
  entityType: string;
  entityId: string | null;
  entityNumber?: string;
  showActions?: boolean;
  compact?: boolean;
}

export function ApprovalProgress({ 
  entityType, 
  entityId, 
  entityNumber,
  showActions = true,
  compact = false,
}: ApprovalProgressProps) {
  const [actionDialog, setActionDialog] = useState<"approve" | "reject" | "send_back" | null>(null);
  const [comment, setComment] = useState("");
  const [newComment, setNewComment] = useState("");

  const { data: request, isLoading } = useApprovalRequestByEntity(entityType, entityId);
  const { data: myPending } = useMyPendingApprovals();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const sendBackRequest = useSendBackRequest();
  const addComment = useAddApprovalComment();

  // Check if current user is authorized to approve this request
  const canUserApprove = useMemo(() => {
    if (!request || !myPending) return false;
    return myPending.some(p => p.id === request.id);
  }, [request, myPending]);

  // Get display text for current approvers
  const approverDisplay = useMemo(() => {
    if (!request?.current_step) return "";
    const step = request.current_step as ApprovalStep;
    const approvers = (step.approvers || []) as StepApprover[];
    
    if (approvers.length === 0) return "No approvers configured";
    
    return approvers.map((a) => {
      if (a.approver_type === 'role') {
        return a.approver_value || 'Unknown role';
      }
      if (a.approver_type === 'user') {
        return 'Specific user';
      }
      const typeLabel = APPROVER_TYPES.find(t => t.value === a.approver_type)?.label;
      return typeLabel || a.approver_type;
    }).join(', ');
  }, [request]);

  const handleAction = async () => {
    if (!request || !actionDialog) return;

    try {
      if (actionDialog === "approve") {
        await approveRequest.mutateAsync({
          requestId: request.id,
          comment: comment || undefined,
        });
      } else if (actionDialog === "reject") {
        if (!comment.trim()) return;
        await rejectRequest.mutateAsync({
          requestId: request.id,
          comment: comment,
        });
      } else if (actionDialog === "send_back") {
        if (!comment.trim()) return;
        await sendBackRequest.mutateAsync({
          requestId: request.id,
          comment: comment,
        });
      }
      setActionDialog(null);
      setComment("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAddComment = async () => {
    if (!request || !newComment.trim()) return;
    
    try {
      await addComment.mutateAsync({
        requestId: request.id,
        comment: newComment,
      });
      setNewComment("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!request) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-4 text-center text-muted-foreground text-sm">
          Not submitted for approval yet
        </CardContent>
      </Card>
    );
  }

  const steps = (request.workflow?.steps || []) as ApprovalStep[];
  const actions = (request.actions || []) as ApprovalAction[];

  const getStepStatus = (step: ApprovalStep) => {
    if (request.status === "rejected") {
      // Find if this step was rejected
      const rejectedAction = actions.find(
        a => a.step_id === step.id && a.action === "reject"
      );
      if (rejectedAction) return "rejected";
    }
    
    if (request.status === "approved") return "approved";
    if (request.status === "returned") return "returned";
    
    if (step.step_order < request.current_step_order) return "approved";
    if (step.step_order === request.current_step_order) return "current";
    return "pending";
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "returned":
        return <RotateCcw className="w-5 h-5 text-amber-600" />;
      case "current":
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          return (
            <div key={step.id} className="flex items-center gap-1">
              {getStepIcon(status)}
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
        <Badge 
          variant="outline" 
          className={
            request.status === "approved" ? "bg-green-50 text-green-700" :
            request.status === "rejected" ? "bg-red-50 text-red-700" :
            request.status === "returned" ? "bg-orange-50 text-orange-700" :
            "bg-amber-50 text-amber-700"
          }
        >
          {request.status}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Approval Progress</CardTitle>
          <Badge 
            variant="outline" 
            className={
              request.status === "approved" ? "bg-green-50 text-green-700 border-green-200" :
              request.status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
              request.status === "returned" ? "bg-orange-50 text-orange-700 border-orange-200" :
              "bg-amber-50 text-amber-700 border-amber-200"
            }
          >
            {request.status === "pending" ? "In Progress" : 
             request.status === "returned" ? "Returned for Revision" : 
             request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Steps Progress */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${status === "approved" ? "bg-green-100" : 
                      status === "rejected" ? "bg-red-100" :
                      status === "returned" ? "bg-orange-100" :
                      status === "current" ? "bg-amber-100" : "bg-muted"}
                  `}>
                    {getStepIcon(status)}
                  </div>
                  <span className={`text-xs mt-1 text-center max-w-[80px] ${
                    status === "current" ? "font-medium" : "text-muted-foreground"
                  }`}>
                    {step.step_name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    getStepStatus(steps[index + 1]) !== "pending" ? "bg-green-500" : "bg-muted"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions - Only show if user is authorized */}
        {showActions && request.status === "pending" && (
          <>
            <Separator />
            {canUserApprove ? (
              <div className="flex gap-2">
                <Button
                  onClick={() => setActionDialog("approve")}
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActionDialog("send_back")}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Send Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setActionDialog("reject")}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Waiting for approval from: <strong className="text-foreground">{approverDisplay}</strong>
                </span>
              </div>
            )}
          </>
        )}

        {/* Action History */}
        {actions.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3">Activity</h4>
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {actions.map((action) => (
                  <div key={action.id} className="flex gap-3 text-sm">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                      ${action.action === "approve" ? "bg-green-100 text-green-600" :
                        action.action === "reject" ? "bg-red-100 text-red-600" :
                        action.action === "submit" ? "bg-blue-100 text-blue-600" :
                        action.action === "send_back" ? "bg-orange-100 text-orange-600" :
                        "bg-muted text-muted-foreground"}
                    `}>
                      {action.action === "approve" && <CheckCircle2 className="w-3 h-3" />}
                      {action.action === "reject" && <XCircle className="w-3 h-3" />}
                      {action.action === "submit" && <Send className="w-3 h-3" />}
                      {action.action === "send_back" && <RotateCcw className="w-3 h-3" />}
                      {action.action === "comment" && <MessageSquare className="w-3 h-3" />}
                      {action.action === "delegate" && <User className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {action.user?.full_name || "System"}
                        </span>
                        <span className="text-muted-foreground">
                          {getActionLabel(action.action)}
                        </span>
                      </div>
                      {action.comment && (
                        <p className="text-muted-foreground mt-0.5 break-words">
                          "{action.comment}"
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(action.action_date), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Add Comment - Only show for pending requests and authorized users */}
        {request.status === "pending" && canUserApprove && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="flex-1"
              />
              <Button 
                size="icon" 
                variant="outline"
                onClick={handleAddComment}
                disabled={!newComment.trim() || addComment.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => {
        setActionDialog(null);
        setComment("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === "approve" ? "Approve Request" : 
               actionDialog === "reject" ? "Reject Request" :
               "Send Back for Revision"}
            </DialogTitle>
            <DialogDescription>
              {entityNumber || request.entity_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder={
                actionDialog === "reject"
                  ? "Please provide a reason for rejection (required)"
                  : actionDialog === "send_back"
                  ? "Please explain what needs to be revised (required)"
                  : "Add a comment (optional)"
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setActionDialog(null);
              setComment("");
            }}>
              Cancel
            </Button>
            <Button
              variant={actionDialog === "reject" ? "destructive" : 
                       actionDialog === "send_back" ? "outline" : "default"}
              onClick={handleAction}
              disabled={
                ((actionDialog === "reject" || actionDialog === "send_back") && !comment.trim()) ||
                approveRequest.isPending ||
                rejectRequest.isPending ||
                sendBackRequest.isPending
              }
            >
              {actionDialog === "approve" ? "Approve" : 
               actionDialog === "reject" ? "Reject" : 
               "Send Back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

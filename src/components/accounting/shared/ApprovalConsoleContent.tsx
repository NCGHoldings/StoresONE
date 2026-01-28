import { useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  User,
  FileText,
  Filter,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useApprovalRequests,
  useMyPendingApprovals,
  useApproveRequest,
  useRejectRequest,
  useSendBackRequest,
  useAddApprovalComment,
  getEntityTypeLabel,
  ApprovalRequest,
  ENTITY_TYPES,
} from "@/hooks/useApprovalWorkflow";

interface ApprovalConsoleContentProps {
  showHeader?: boolean;
  compact?: boolean;
  entityTypeFilter?: string[];
}

export function ApprovalConsoleContent({ 
  showHeader = false, 
  compact = false,
  entityTypeFilter: allowedEntityTypes,
}: ApprovalConsoleContentProps) {
  const [activeTab, setActiveTab] = useState("my-pending");
  const [entityTypeFilterValue, setEntityTypeFilterValue] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: "approve" | "reject" | "comment" | "send_back" | null;
    request: ApprovalRequest | null;
  }>({ type: null, request: null });
  const [actionComment, setActionComment] = useState("");

  // Queries
  const { data: myPending = [], isLoading: loadingMyPending } = useMyPendingApprovals();
  const { data: allPending = [], isLoading: loadingAllPending } = useApprovalRequests({ status: "pending" });
  const { data: completed = [], isLoading: loadingCompleted } = useApprovalRequests({ 
    status: entityTypeFilterValue === "approved" ? "approved" : entityTypeFilterValue === "rejected" ? "rejected" : undefined 
  });

  // Mutations
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const sendBackRequest = useSendBackRequest();
  const addComment = useAddApprovalComment();

  const filterRequests = (requests: ApprovalRequest[]) => {
    return requests.filter((req) => {
      // First filter by allowed entity types if specified
      if (allowedEntityTypes && allowedEntityTypes.length > 0) {
        if (!allowedEntityTypes.includes(req.entity_type)) return false;
      }
      
      const matchesType = entityTypeFilterValue === "all" || req.entity_type === entityTypeFilterValue;
      const matchesSearch =
        searchQuery === "" ||
        req.entity_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.submitter?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  };

  const handleAction = async () => {
    if (!actionDialog.request || !actionDialog.type) return;

    try {
      if (actionDialog.type === "approve") {
        await approveRequest.mutateAsync({
          requestId: actionDialog.request.id,
          comment: actionComment || undefined,
        });
      } else if (actionDialog.type === "reject") {
        if (!actionComment.trim()) return;
        await rejectRequest.mutateAsync({
          requestId: actionDialog.request.id,
          comment: actionComment,
        });
      } else if (actionDialog.type === "send_back") {
        if (!actionComment.trim()) return;
        await sendBackRequest.mutateAsync({
          requestId: actionDialog.request.id,
          comment: actionComment,
        });
      } else if (actionDialog.type === "comment") {
        if (!actionComment.trim()) return;
        await addComment.mutateAsync({
          requestId: actionDialog.request.id,
          comment: actionComment,
        });
      }
      setActionDialog({ type: null, request: null });
      setActionComment("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "returned":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><RotateCcw className="w-3 h-3 mr-1" />Returned</Badge>;
      case "escalated":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><AlertTriangle className="w-3 h-3 mr-1" />Escalated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "purchase_requisition":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "purchase_order":
        return <FileText className="w-5 h-5 text-green-500" />;
      case "supplier_registration":
        return <User className="w-5 h-5 text-purple-500" />;
      case "goods_receipt":
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Get entity types to show in filter dropdown
  const availableEntityTypes = allowedEntityTypes 
    ? ENTITY_TYPES.filter(t => allowedEntityTypes.includes(t.value))
    : ENTITY_TYPES;

  const RequestCard = ({ request, showActions = true }: { request: ApprovalRequest; showActions?: boolean }) => {
    const isUrgent = request.current_step?.timeout_hours && request.current_step.timeout_hours <= 4;
    
    return (
      <Card 
        className={`hover:shadow-md transition-shadow cursor-pointer ${isUrgent ? "border-orange-300" : ""}`}
        onClick={() => setSelectedRequest(request)}
      >
        <CardContent className={compact ? "p-3" : "p-4"}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {getEntityIcon(request.entity_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground">
                  {request.entity_number || "N/A"}
                </span>
                {getStatusBadge(request.status)}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {getEntityTypeLabel(request.entity_type)}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {request.submitter?.full_name || "Unknown"}
                </span>
                <span>
                  {format(new Date(request.submitted_at), "MMM d, yyyy h:mm a")}
                </span>
              </div>
              
              {request.current_step && request.status === "pending" && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm">
                  <span className="font-medium">Step {request.current_step_order}:</span>{" "}
                  {request.current_step.step_name}
                  {isUrgent && (
                    <span className="ml-2 text-orange-600 font-medium">
                      ⚠️ Requires action within {request.current_step.timeout_hours}h
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {showActions && request.status === "pending" && (
              <div className={`flex-shrink-0 flex ${compact ? "flex-row gap-1" : "flex-col gap-2"}`}>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionDialog({ type: "approve", request });
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {!compact && "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionDialog({ type: "reject", request });
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  {!compact && "Reject"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionDialog({ type: "send_back", request });
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  {!compact && "Send Back"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionDialog({ type: "comment", request });
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {!compact && "Comment"}
                </Button>
              </div>
            )}
            
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <h2 className="text-xl font-semibold">Approval Console</h2>
          <p className="text-muted-foreground text-sm">Review and approve pending requests</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className={`grid gap-4 ${compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-4"}`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {filterRequests(myPending).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">All Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filterRequests(allPending).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filterRequests(completed).filter(r => r.status === "approved" && r.completed_at && 
                new Date(r.completed_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filterRequests(completed).filter(r => r.status === "rejected" && r.completed_at && 
                new Date(r.completed_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by document number or submitter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={entityTypeFilterValue} onValueChange={setEntityTypeFilterValue}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {availableEntityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-pending" className="gap-2">
            My Pending
            {filterRequests(myPending).length > 0 && (
              <Badge variant="secondary" className="ml-1">{filterRequests(myPending).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all-pending" className="gap-2">
            All Pending
            {filterRequests(allPending).length > 0 && (
              <Badge variant="secondary" className="ml-1">{filterRequests(allPending).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="my-pending" className="mt-4">
          {loadingMyPending ? (
            <LoadingSkeleton />
          ) : filterRequests(myPending).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No pending approvals assigned to you.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filterRequests(myPending).map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-pending" className="mt-4">
          {loadingAllPending ? (
            <LoadingSkeleton />
          ) : filterRequests(allPending).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>No pending approvals found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filterRequests(allPending).map((request) => (
                <RequestCard key={request.id} request={request} showActions={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {loadingCompleted ? (
            <LoadingSkeleton />
          ) : filterRequests(completed.filter(r => r.status === "approved" || r.status === "rejected")).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>No completed approvals found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filterRequests(completed.filter(r => r.status === "approved" || r.status === "rejected")).map((request) => (
                <RequestCard key={request.id} request={request} showActions={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog.type} onOpenChange={() => {
        setActionDialog({ type: null, request: null });
        setActionComment("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" && "Approve Request"}
              {actionDialog.type === "reject" && "Reject Request"}
              {actionDialog.type === "send_back" && "Send Back for Revision"}
              {actionDialog.type === "comment" && "Add Comment"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.request?.entity_number} - {getEntityTypeLabel(actionDialog.request?.entity_type || "")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder={
                actionDialog.type === "reject"
                  ? "Please provide a reason for rejection (required)"
                  : actionDialog.type === "send_back"
                  ? "Please explain what needs to be revised (required)"
                  : "Add a comment (optional)"
              }
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ type: null, request: null });
                setActionComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.type === "reject" ? "destructive" : actionDialog.type === "send_back" ? "outline" : "default"}
              onClick={handleAction}
              disabled={
                ((actionDialog.type === "reject" || actionDialog.type === "send_back") && !actionComment.trim()) ||
                approveRequest.isPending ||
                rejectRequest.isPending ||
                sendBackRequest.isPending ||
                addComment.isPending
              }
            >
              {actionDialog.type === "approve" && "Approve"}
              {actionDialog.type === "reject" && "Reject"}
              {actionDialog.type === "send_back" && "Send Back"}
              {actionDialog.type === "comment" && "Add Comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

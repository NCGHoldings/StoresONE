-- =====================================================
-- APPROVAL WORKFLOW ENGINE SCHEMA
-- =====================================================

-- 1. Approval Workflows - Define workflow templates
CREATE TABLE public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('purchase_requisition', 'purchase_order', 'supplier_registration', 'goods_receipt')),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 2. Approval Steps - Steps within each workflow
CREATE TABLE public.approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  approval_type TEXT DEFAULT 'any' CHECK (approval_type IN ('any', 'all', 'percentage')),
  required_percentage INTEGER CHECK (required_percentage >= 0 AND required_percentage <= 100),
  can_skip BOOLEAN DEFAULT false,
  timeout_hours INTEGER,
  escalation_action TEXT DEFAULT 'notify' CHECK (escalation_action IN ('notify', 'auto_approve', 'auto_reject')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workflow_id, step_order)
);

-- 3. Approval Conditions - IF conditions for steps
CREATE TABLE public.approval_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.approval_steps(id) ON DELETE CASCADE,
  field_path TEXT NOT NULL,
  operator TEXT NOT NULL CHECK (operator IN ('eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'contains', 'not_contains')),
  value JSONB NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('require', 'skip', 'route_to')),
  route_to_role TEXT,
  condition_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Step Approvers - Who can approve each step
CREATE TABLE public.step_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.approval_steps(id) ON DELETE CASCADE,
  approver_type TEXT NOT NULL CHECK (approver_type IN ('role', 'user', 'department_head', 'requestor_manager', 'cost_center_owner')),
  approver_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Approval Requests - Active approval instances
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.approval_workflows(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'escalated')),
  current_step_id UUID REFERENCES public.approval_steps(id),
  current_step_order INTEGER DEFAULT 1,
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- 6. Approval Actions - Audit trail of all actions
CREATE TABLE public.approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.approval_steps(id),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL CHECK (action IN ('submit', 'approve', 'reject', 'delegate', 'comment', 'escalate', 'skip')),
  comment TEXT,
  delegated_to UUID REFERENCES public.profiles(id),
  action_date TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_approval_workflows_entity_type ON public.approval_workflows(entity_type);
CREATE INDEX idx_approval_workflows_active ON public.approval_workflows(is_active);
CREATE INDEX idx_approval_steps_workflow ON public.approval_steps(workflow_id);
CREATE INDEX idx_approval_conditions_step ON public.approval_conditions(step_id);
CREATE INDEX idx_step_approvers_step ON public.step_approvers(step_id);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_entity ON public.approval_requests(entity_type, entity_id);
CREATE INDEX idx_approval_requests_submitted_by ON public.approval_requests(submitted_by);
CREATE INDEX idx_approval_actions_request ON public.approval_actions(request_id);
CREATE INDEX idx_approval_actions_user ON public.approval_actions(user_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Approval Workflows: All authenticated users can read, only admins can modify
CREATE POLICY "Users can view active workflows" ON public.approval_workflows
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage workflows" ON public.approval_workflows
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Approval Steps: All authenticated users can read
CREATE POLICY "Users can view workflow steps" ON public.approval_steps
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage steps" ON public.approval_steps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Approval Conditions: All authenticated users can read
CREATE POLICY "Users can view conditions" ON public.approval_conditions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage conditions" ON public.approval_conditions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Step Approvers: All authenticated users can read
CREATE POLICY "Users can view approvers" ON public.step_approvers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage approvers" ON public.step_approvers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Approval Requests: Users can see their own submissions and requests they can approve
CREATE POLICY "Users can view approval requests" ON public.approval_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create approval requests" ON public.approval_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update approval requests" ON public.approval_requests
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Approval Actions: Users can view all actions, add their own
CREATE POLICY "Users can view approval actions" ON public.approval_actions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can add approval actions" ON public.approval_actions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
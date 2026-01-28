-- =====================================================
-- APPROVAL WORKFLOW ENGINE ENHANCEMENTS
-- =====================================================

-- 1. Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('approval_pending', 'approval_complete', 'approval_rejected', 'escalation', 'send_back', 'comment', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  request_id UUID REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- System can insert notifications for any user (via service role or triggers)
CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Add manager_id and department to profiles for dynamic approver resolution
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS department TEXT;

-- 3. Add index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, read) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON public.notifications(created_at DESC);

-- 4. Add escalation tracking columns to approval_requests
ALTER TABLE public.approval_requests
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escalation_count INTEGER DEFAULT 0;

-- 5. Create function to notify approvers when a new request is submitted
CREATE OR REPLACE FUNCTION public.notify_approvers_on_submit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  step_record RECORD;
  approver_record RECORD;
  user_record RECORD;
  entity_label TEXT;
BEGIN
  -- Get entity type label
  entity_label := CASE NEW.entity_type
    WHEN 'purchase_requisition' THEN 'Purchase Requisition'
    WHEN 'purchase_order' THEN 'Purchase Order'
    WHEN 'supplier_registration' THEN 'Supplier Registration'
    WHEN 'goods_receipt' THEN 'Goods Receipt'
    ELSE NEW.entity_type
  END;

  -- Get current step approvers
  FOR approver_record IN
    SELECT sa.approver_type, sa.approver_value
    FROM step_approvers sa
    WHERE sa.step_id = NEW.current_step_id
  LOOP
    IF approver_record.approver_type = 'user' AND approver_record.approver_value IS NOT NULL THEN
      -- Direct user notification
      INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, request_id)
      VALUES (
        approver_record.approver_value::UUID,
        'approval_pending',
        'New Approval Request',
        format('%s %s requires your approval', entity_label, COALESCE(NEW.entity_number, 'N/A')),
        NEW.entity_type,
        NEW.entity_id,
        NEW.id
      );
    ELSIF approver_record.approver_type = 'role' AND approver_record.approver_value IS NOT NULL THEN
      -- Notify all users with this role
      FOR user_record IN
        SELECT ur.user_id
        FROM user_roles ur
        WHERE ur.role::TEXT = approver_record.approver_value
      LOOP
        INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, request_id)
        VALUES (
          user_record.user_id,
          'approval_pending',
          'New Approval Request',
          format('%s %s requires your approval', entity_label, COALESCE(NEW.entity_number, 'N/A')),
          NEW.entity_type,
          NEW.entity_id,
          NEW.id
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for new approval requests
DROP TRIGGER IF EXISTS notify_approvers_trigger ON approval_requests;
CREATE TRIGGER notify_approvers_trigger
AFTER INSERT ON approval_requests
FOR EACH ROW
EXECUTE FUNCTION notify_approvers_on_submit();

-- 6. Create function to notify submitter on completion
CREATE OR REPLACE FUNCTION public.notify_submitter_on_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entity_label TEXT;
  notification_type TEXT;
  notification_title TEXT;
BEGIN
  -- Only trigger on status change to approved/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') AND NEW.submitted_by IS NOT NULL THEN
    entity_label := CASE NEW.entity_type
      WHEN 'purchase_requisition' THEN 'Purchase Requisition'
      WHEN 'purchase_order' THEN 'Purchase Order'
      WHEN 'supplier_registration' THEN 'Supplier Registration'
      WHEN 'goods_receipt' THEN 'Goods Receipt'
      ELSE NEW.entity_type
    END;

    IF NEW.status = 'approved' THEN
      notification_type := 'approval_complete';
      notification_title := 'Request Approved';
    ELSE
      notification_type := 'approval_rejected';
      notification_title := 'Request Rejected';
    END IF;

    INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, request_id)
    VALUES (
      NEW.submitted_by,
      notification_type,
      notification_title,
      format('%s %s has been %s', entity_label, COALESCE(NEW.entity_number, 'N/A'), NEW.status),
      NEW.entity_type,
      NEW.entity_id,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for approval completion
DROP TRIGGER IF EXISTS notify_submitter_complete_trigger ON approval_requests;
CREATE TRIGGER notify_submitter_complete_trigger
AFTER UPDATE ON approval_requests
FOR EACH ROW
EXECUTE FUNCTION notify_submitter_on_complete();
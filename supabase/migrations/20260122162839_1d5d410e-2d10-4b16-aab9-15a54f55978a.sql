-- Create invoice_status enum
CREATE TYPE invoice_status AS ENUM ('pending', 'approved', 'paid', 'overdue', 'cancelled');

-- Create invoices table for Accounts Payable
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  po_id UUID REFERENCES public.purchase_orders(id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status invoice_status DEFAULT 'pending',
  payment_date DATE,
  payment_reference TEXT,
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  approved_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create cost_centers table
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manager TEXT,
  budget NUMERIC(12,2),
  spent NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create general_ledger table
CREATE TABLE public.general_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  description TEXT,
  debit NUMERIC(12,2) DEFAULT 0,
  credit NUMERIC(12,2) DEFAULT 0,
  reference_type TEXT,
  reference_id UUID,
  cost_center_id UUID REFERENCES public.cost_centers(id),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_ledger ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Authenticated users can view invoices" ON public.invoices
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage invoices" ON public.invoices
  FOR ALL USING (true);

-- Create RLS policies for cost_centers
CREATE POLICY "Authenticated users can view cost centers" ON public.cost_centers
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage cost centers" ON public.cost_centers
  FOR ALL USING (true);

-- Create RLS policies for general_ledger
CREATE POLICY "Authenticated users can view ledger" ON public.general_ledger
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage ledger" ON public.general_ledger
  FOR ALL USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_centers_updated_at
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed sample cost centers
INSERT INTO public.cost_centers (code, name, description, manager, budget, spent) VALUES
  ('CC001', 'Operations', 'General operations and warehouse', 'John Smith', 500000, 125000),
  ('CC002', 'Procurement', 'Purchasing and vendor management', 'Jane Doe', 250000, 85000),
  ('CC003', 'Logistics', 'Shipping and transportation', 'Mike Johnson', 350000, 180000),
  ('CC004', 'IT', 'Information technology', 'Sarah Wilson', 150000, 45000),
  ('CC005', 'Admin', 'Administration and HR', 'Tom Brown', 200000, 75000);

-- Seed sample invoices linked to existing suppliers and POs
INSERT INTO public.invoices (invoice_number, supplier_id, po_id, invoice_date, due_date, amount, status, notes)
SELECT 
  'INV-2025-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0'),
  s.id,
  po.id,
  CURRENT_DATE - (RANDOM() * 60)::INTEGER,
  CURRENT_DATE - (RANDOM() * 60)::INTEGER + 30,
  po.total_amount,
  (ARRAY['pending', 'approved', 'paid', 'overdue'])[FLOOR(RANDOM() * 4 + 1)::INTEGER]::invoice_status,
  'Invoice for PO ' || po.po_number
FROM public.purchase_orders po
JOIN public.suppliers s ON po.supplier_id = s.id
LIMIT 3;

-- Add more sample invoices
INSERT INTO public.invoices (invoice_number, supplier_id, invoice_date, due_date, amount, status, notes) VALUES
  ('INV-2025-0004', (SELECT id FROM suppliers LIMIT 1 OFFSET 0), CURRENT_DATE - 45, CURRENT_DATE - 15, 15750.00, 'overdue', 'Overdue invoice for materials'),
  ('INV-2025-0005', (SELECT id FROM suppliers LIMIT 1 OFFSET 1), CURRENT_DATE - 30, CURRENT_DATE, 8500.00, 'approved', 'Approved for payment'),
  ('INV-2025-0006', (SELECT id FROM suppliers LIMIT 1 OFFSET 2), CURRENT_DATE - 10, CURRENT_DATE + 20, 22000.00, 'pending', 'Pending review'),
  ('INV-2025-0007', (SELECT id FROM suppliers LIMIT 1 OFFSET 0), CURRENT_DATE - 60, CURRENT_DATE - 30, 5000.00, 'paid', 'Paid on time'),
  ('INV-2025-0008', (SELECT id FROM suppliers LIMIT 1 OFFSET 1), CURRENT_DATE - 5, CURRENT_DATE + 25, 18500.00, 'pending', 'New invoice');

-- Seed sample ledger entries
INSERT INTO public.general_ledger (entry_date, account_code, account_name, description, debit, credit, reference_type, cost_center_id) VALUES
  (CURRENT_DATE - 30, '2100', 'Accounts Payable', 'Invoice payment to supplier', 0, 15000, 'invoice', (SELECT id FROM cost_centers WHERE code = 'CC001')),
  (CURRENT_DATE - 25, '1100', 'Cash', 'Payment for materials', 0, 15000, 'payment', (SELECT id FROM cost_centers WHERE code = 'CC002')),
  (CURRENT_DATE - 20, '5100', 'Cost of Goods', 'Inventory purchase', 25000, 0, 'invoice', (SELECT id FROM cost_centers WHERE code = 'CC001')),
  (CURRENT_DATE - 15, '2100', 'Accounts Payable', 'Vendor invoice recorded', 0, 25000, 'invoice', (SELECT id FROM cost_centers WHERE code = 'CC002')),
  (CURRENT_DATE - 10, '6100', 'Shipping Expense', 'Freight charges', 3500, 0, 'invoice', (SELECT id FROM cost_centers WHERE code = 'CC003')),
  (CURRENT_DATE - 5, '1100', 'Cash', 'Supplier payment', 0, 8500, 'payment', (SELECT id FROM cost_centers WHERE code = 'CC002'));
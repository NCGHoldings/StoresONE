import { z } from 'zod';

// SAP-compatible password policy schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

// Email validation
export const emailSchema = z.string()
  .trim()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');

// Full name validation
export const fullNameSchema = z.string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Authentication forms
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupFormSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Purchase Order form validation
export const poLineItemSchema = z.object({
  product_id: z.string().uuid('Invalid product'),
  quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be positive').max(999999, 'Quantity too large'),
  unit_price: z.number().min(0.01, 'Price must be at least 0.01').max(999999999, 'Price too large'),
  unit_of_measure: z.string().optional(),
});

export const poFormSchema = z.object({
  supplier_id: z.string().uuid('Invalid supplier'),
  expected_delivery: z.string().refine(
    date => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)),
    'Delivery date cannot be in the past'
  ),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  lines: z.array(poLineItemSchema).min(1, 'At least one line item is required'),
});

// Purchase Requisition form validation
export const prLineItemSchema = z.object({
  product_id: z.string().uuid('Invalid product'),
  quantity: z.number().int().positive().max(999999),
  required_date: z.string(),
  notes: z.string().max(500).optional(),
});

export const prFormSchema = z.object({
  cost_center_id: z.string().uuid('Invalid cost center').optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  justification: z.string().max(1000, 'Justification must be less than 1000 characters').optional(),
  lines: z.array(prLineItemSchema).min(1, 'At least one line item is required'),
});

// Customer form validation
export const customerFormSchema = z.object({
  customer_code: z.string().min(1, 'Customer code is required').max(50),
  company_name: z.string().min(1, 'Company name is required').max(200),
  contact_person: z.string().max(100).optional(),
  email: emailSchema.optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  credit_limit: z.number().min(0).max(999999999).optional(),
  payment_terms: z.number().int().min(0).max(365).optional(),
  tax_id: z.string().max(50).optional(),
  billing_address: z.string().max(500).optional(),
  shipping_address: z.string().max(500).optional(),
});

// Supplier form validation
export const supplierFormSchema = z.object({
  supplier_code: z.string().min(1, 'Supplier code is required').max(50),
  name: z.string().min(1, 'Supplier name is required').max(200),
  contact_name: z.string().max(100).optional(),
  email: emailSchema.optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  payment_terms: z.number().int().min(0).max(365).optional(),
  tax_id: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});

// Invoice form validation
export const invoiceFormSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required').max(50),
  customer_id: z.string().uuid('Invalid customer'),
  invoice_date: z.string(),
  due_date: z.string(),
  total_amount: z.number().min(0.01, 'Amount must be greater than 0').max(999999999),
  notes: z.string().max(500).optional(),
});

// Payment form validation
export const paymentFormSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(999999999),
  payment_date: z.string(),
  payment_method: z.enum(['cash', 'card', 'transfer', 'cheque']),
  reference_number: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

// User form validation (admin)
export const userFormSchema = z.object({
  email: emailSchema,
  fullName: fullNameSchema,
  department: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  sendInvite: z.boolean(),
  temporaryPassword: z.string().optional(),
}).refine((data) => {
  if (!data.sendInvite && !data.temporaryPassword) {
    return false;
  }
  return true;
}, {
  message: "Either send invite or provide a temporary password",
  path: ["temporaryPassword"],
});

// POS Sale payload validation (for edge function)
export const posItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  quantity: z.number().int().positive().max(10000),
  unit_price: z.number().min(0).max(999999999),
  discount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100),
});

export const posSalePayloadSchema = z.object({
  pos_terminal_id: z.string().min(1).max(50),
  transaction_id: z.string().uuid(),
  transaction_datetime: z.string().datetime(),
  customer_code: z.string().max(50).optional(),
  payment_method: z.enum(['cash', 'card', 'credit', 'transfer']),
  amount_paid: z.number().min(0),
  bank_account_id: z.string().uuid().optional(),
  items: z.array(posItemSchema).min(1).max(100),
  notes: z.string().max(500).optional(),
});

// Password strength helper
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) return { score, label: 'Weak', color: 'text-red-500' };
  if (score <= 4) return { score, label: 'Fair', color: 'text-yellow-500' };
  if (score <= 5) return { score, label: 'Good', color: 'text-blue-500' };
  return { score, label: 'Strong', color: 'text-green-500' };
}

// Validate password against policy
export function validatePasswordPolicy(password: string): string[] {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('At least one special character');
  }
  
  return errors;
}

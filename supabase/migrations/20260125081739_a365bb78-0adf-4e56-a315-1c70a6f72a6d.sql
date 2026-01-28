-- Add credit limit validation config option for POS
INSERT INTO system_config (key, value, category, description)
VALUES (
  'pos_validate_credit_limit',
  'false',
  'finance',
  'Enable credit limit validation during POS sales. When enabled, sales will be rejected if they would exceed the customer credit limit.'
)
ON CONFLICT (key) DO NOTHING;
// Module definitions for access control
export const MODULES = {
  dashboard: 'dashboard',
  warehouse: 'warehouse',
  procurement: 'procurement',
  sourcing: 'sourcing',
  finance: 'finance',
  sales: 'sales',
  admin: 'admin',
} as const;

export type ModuleKey = typeof MODULES[keyof typeof MODULES];

// Map navigation labels to module keys
export const NAV_TO_MODULE: Record<string, ModuleKey> = {
  'Dashboard': 'dashboard',
  'Warehouse': 'warehouse',
  'Procurement': 'procurement',
  'Sourcing': 'sourcing',
  'Finance': 'finance',
  'Sales': 'sales',
  'Accounting': 'finance',
  'Administration': 'admin',
};

// Module display labels
export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  warehouse: 'Warehouse',
  procurement: 'Procurement',
  sourcing: 'Sourcing',
  finance: 'Finance',
  sales: 'Sales',
  admin: 'Administration',
};

// SAP-compatible module to transaction code mapping
export const MODULE_TCODES: Record<ModuleKey, string> = {
  dashboard: 'ZDB',
  warehouse: 'MM',
  procurement: 'ME',
  sourcing: 'SRM',
  finance: 'FI',
  sales: 'SD',
  admin: 'SU',
};

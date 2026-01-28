import { supabase } from '@/integrations/supabase/client';

export interface SoDConflict {
  conflict_name: string;
  risk_level: string;
  is_blocking: boolean;
}

/**
 * Check for Segregation of Duties (SoD) conflicts for a user
 * Returns any role conflicts that the user has
 */
export async function checkSoDConflicts(userId: string): Promise<SoDConflict[]> {
  const { data, error } = await supabase
    .rpc('check_sod_conflicts', { _user_id: userId });
  
  if (error) {
    console.error('Error checking SoD conflicts:', error);
    return [];
  }
  
  return (data || []) as SoDConflict[];
}

/**
 * Check if assigning a new role would create a blocking SoD conflict
 */
export async function wouldCreateBlockingConflict(
  userId: string, 
  newRole: string
): Promise<{ hasConflict: boolean; conflicts: SoDConflict[] }> {
  // Get current roles
  const { data: currentRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  const roles = currentRoles?.map(r => r.role) || [];
  
  // Get all SoD conflict rules
  const { data: conflictRules } = await supabase
    .from('sod_conflicts')
    .select('*');
  
  if (!conflictRules) {
    return { hasConflict: false, conflicts: [] };
  }
  
  // Check if adding the new role would create conflicts
  const potentialConflicts: SoDConflict[] = [];
  
  for (const rule of conflictRules) {
    // Check if user already has role_a and we're adding role_b
    if (roles.includes(rule.role_a) && newRole === rule.role_b) {
      potentialConflicts.push({
        conflict_name: rule.conflict_name,
        risk_level: rule.risk_level,
        is_blocking: rule.is_blocking,
      });
    }
    // Check if user already has role_b and we're adding role_a
    if (roles.includes(rule.role_b) && newRole === rule.role_a) {
      potentialConflicts.push({
        conflict_name: rule.conflict_name,
        risk_level: rule.risk_level,
        is_blocking: rule.is_blocking,
      });
    }
  }
  
  const hasBlockingConflict = potentialConflicts.some(c => c.is_blocking);
  
  return {
    hasConflict: hasBlockingConflict,
    conflicts: potentialConflicts,
  };
}

/**
 * Get all SoD conflict rules from the database
 */
export async function getSoDConflictRules() {
  const { data, error } = await supabase
    .from('sod_conflicts')
    .select('*')
    .order('risk_level', { ascending: false });
  
  if (error) {
    console.error('Error fetching SoD rules:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Risk level labels and colors
 */
export const RISK_LEVEL_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  low: { label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
} as const;

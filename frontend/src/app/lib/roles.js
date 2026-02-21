// Role definitions and utilities

export const ROLES = {
  fleet_manager: {
    value: 'fleet_manager',
    label: 'Fleet Manager',
    description: 'Oversee fleet operations',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  dispatcher: {
    value: 'dispatcher',
    label: 'Dispatcher',
    description: 'Coordinate trips and logistics',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  safety_officer: {
    value: 'safety_officer',
    label: 'Safety Officer',
    description: 'Monitor compliance and safety',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  financial_analyst: {
    value: 'financial_analyst',
    label: 'Financial Analyst',
    description: 'Track costs and analytics',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
};

/**
 * Format role string for display
 */
export const formatRole = (role) => {
  if (!role) return 'User';
  
  const roleInfo = ROLES[role];
  if (roleInfo) {
    return roleInfo.label;
  }
  
  // Fallback formatting for unknown roles
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get role color classes
 */
export const getRoleColor = (role) => {
  const roleInfo = ROLES[role];
  return roleInfo?.color || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get all available roles as an array
 */
export const getAllRoles = () => {
  return Object.values(ROLES);
};

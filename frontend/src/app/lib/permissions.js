// Permission system following Gestalt principles of clarity and consistency

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  // Fleet Manager - Admin with all rights
  fleet_manager: [
    'view_dashboard',
    'view_vehicles',
    'view_trips',
    'view_drivers',
    'view_maintenance',
    'view_fuel_logs',
    'view_analytics',
    'create_vehicle',
    'edit_vehicle',
    'delete_vehicle',
    'create_trip',
    'edit_trip',
    'delete_trip',
    'create_driver',
    'edit_driver',
    'delete_driver',
    'create_maintenance',
    'edit_maintenance',
    'delete_maintenance',
    'create_fuel_log',
    'edit_fuel_log',
    'delete_fuel_log',
    'manage_calendar',
    'view_complaints',
    'manage_safety_scores',
    'view_driver_license_expiry',
    'calculate_roi',
  ],
  
  // Dispatcher - View-only for vehicles/drivers, can only create trips
  dispatcher: [
    'view_dashboard',
    'view_vehicles',
    'view_trips',
    'view_drivers',
    'create_trip',
  ],
  
  // Safety Officer - Monitor maintenance, licenses, complaints, safety scores
  safety_officer: [
    'view_dashboard',
    'view_maintenance',
    'view_drivers',
    'view_vehicles',
    'view_driver_license_expiry',
    'view_complaints',
    'manage_safety_scores',
  ],
  
  // Financial Analyst - Read-only access to financial data and analytics
  financial_analyst: [
    'view_dashboard',
    'view_fuel_logs',
    'view_maintenance',
    'view_analytics',
    'view_vehicles',
    'calculate_roi',
  ],
};

/**
 * Check if a user role has a specific permission
 */
export const hasPermission = (role, permission) => {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
};

/**
 * Check if a user role has any of the specified permissions
 */
export const hasAnyPermission = (role, permissions) => {
  if (!role) return false;
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a user role has all of the specified permissions
 */
export const hasAllPermissions = (role, permissions) => {
  if (!role) return false;
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if role is admin (Fleet Manager)
 */
export const isAdmin = (role) => {
  return role === 'fleet_manager';
};

// Navigation items with their required permissions
export const NAV_ITEMS_CONFIG = [
  { to: '/app', label: 'Dashboard', icon: 'LayoutDashboard', permission: 'view_dashboard' },
  { to: '/app/vehicles', label: 'Vehicles', icon: 'Truck', permission: 'view_vehicles' },
  { to: '/app/trips', label: 'Trips', icon: 'Route', permission: 'view_trips' },
  { to: '/app/drivers', label: 'Drivers', icon: 'Users', permission: 'view_drivers' },
  { to: '/app/maintenance', label: 'Maintenance', icon: 'Wrench', permission: 'view_maintenance' },
  { to: '/app/fuel', label: 'Fuel Logs', icon: 'Fuel', permission: 'view_fuel_logs' },
  { to: '/app/analytics', label: 'Analytics', icon: 'BarChart3', permission: 'view_analytics' },
];

export const getNavigationItems = (role) => {
  if (!role) return [];
  
  return NAV_ITEMS_CONFIG.filter(item => hasPermission(role, item.permission));
};

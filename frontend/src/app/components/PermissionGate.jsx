import { useAuth } from '../lib/useAuth';

/**
 * Component that conditionally renders children based on user permissions
 * Following Gestalt principle of closure - only showing what's relevant
 */
export function PermissionGate({ children, permission, fallback = null }) {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Component that checks multiple permissions
 */
export function MultiPermissionGate({ 
  children, 
  permissions, 
  requireAll = false, 
  fallback = null 
}) {
  const { hasPermission } = useAuth();
  
  const hasAccess = requireAll
    ? permissions.every(p => hasPermission(p))
    : permissions.some(p => hasPermission(p));
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

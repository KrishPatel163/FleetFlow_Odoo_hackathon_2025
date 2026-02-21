import { formatRole, getRoleColor } from '../lib/roles';

export function RoleBadge({ role, className = '' }) {
  const colorClasses = getRoleColor(role);
  const roleLabel = formatRole(role);

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      {roleLabel}
    </span>
  );
}

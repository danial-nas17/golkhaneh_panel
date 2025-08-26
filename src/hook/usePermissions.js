// hooks/usePermissions.js
import { useUser } from '../contexts/UserContext';

export const usePermissions = () => {
  const { user } = useUser();

  const hasPermission = (requiredPermission) => {
    if (!user) return false;
    
    // Super Admin check
    if (user.role === 'super_admin') return true;
    
    // Check if user has permissions array
    if (!user.permissions) return false;
    
    // Check if user has the required permission
    return user.permissions.includes(requiredPermission);
  };

  const hasAnyPermission = (requiredPermissions) => {
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (requiredPermissions) => {
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userPermissions: user?.permissions || [],
    userRole: user?.role || null
  };
};
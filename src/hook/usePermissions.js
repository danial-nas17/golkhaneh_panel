// hooks/usePermissions.js
import { useUser } from '../contexts/UserContext';

export const usePermissions = () => {
  const { user } = useUser();

  // Debug: Log user data to see structure
  console.log('usePermissions - user:', user);

  // Get user role from different possible field names - comprehensive check
  const getUserRole = () => {
    if (!user) return null;
    
    // Check all possible role field variations
    const possibleRoles = [
      user.role,
      user.role_name, 
      user.user_role,
      user.roles?.[0]?.name,
      user.roles?.[0]?.role_name,
      user.role?.name,
      user.user?.role,
      user.user?.role_name,
      user.meta?.role,
      user.data?.role
    ];
    
    // Find the first non-null, non-undefined role
    for (const role of possibleRoles) {
      if (role && typeof role === 'string' && role.trim()) {
        console.log('Found role:', role);
        return role.trim();
      }
    }
    
    console.log('No role found in user object');
    return null;
  };

  const hasPermission = (requiredPermission) => {
    if (!user) return false;
    
    // Super Admin check using the same comprehensive role detection
    const currentRole = getUserRole();
    console.log('usePermissions - userRole in hasPermission:', currentRole);
    
    // Check for super admin variations
    if (currentRole && (
      currentRole.toLowerCase() === 'super_admin' || 
      currentRole.toLowerCase() === 'super admin' ||
      currentRole === 'Super Admin' ||
      currentRole === 'SUPER_ADMIN'
    )) {
      console.log('User is super admin, granting all permissions');
      return true;
    }
    
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

  const userRole = getUserRole();

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userPermissions: user?.permissions || [],
    userRole: userRole
  };
};
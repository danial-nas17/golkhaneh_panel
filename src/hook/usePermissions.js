// hooks/usePermissions.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useContext(AuthContext);

  const hasPermission = (requiredPermission) => {
    if (!user || !user.permissions) return false;
    
    // Super Admin check
    if (user.permissions === '*') return true;
    
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
    userPermissions: user?.permissions || []
  };
};
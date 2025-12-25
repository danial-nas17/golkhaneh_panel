export const MODULES = {
    USERS: 'users',
    PRODUCTS: 'products',
    ORDERS: 'orders',
    SETTINGS: 'settings',
    REPORTS: 'reports',
    CONTENT: 'content',
    STORE_STAFF: 'store-staff',
    // Add your custom modules here
  };
  
  export const ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage',
    APPROVE: 'approve',
    REJECT: 'reject',
    // Add your custom actions here
  };
  
  export const generatePermissions = () => {
    const permissions = [];
  
    Object.entries(MODULES).forEach(([moduleKey, moduleName]) => {
      Object.entries(ACTIONS).forEach(([actionKey, actionName]) => {
        permissions.push({
          id: `${moduleName}_${actionName}`,
          name: `${actionKey} ${moduleKey}`,
          description: `Can ${actionName} ${moduleName}`,
          module: moduleName
        });
      });
    });
  
    return permissions;
  };
  
  // Define your default roles
  export const DEFAULT_ROLES = [
    {
      name: 'Super Admin',
      description: 'Has full access to all features',
      permissions: '*',
      isSystem: true
    },
    {
      name: 'Admin',
      description: 'Has access to most features except critical system settings',
      permissions: [
        'users_read',
        'users_create',
        'users_update',
        'products_manage',
        'orders_manage',
        'reports_read'
      ],
      isSystem: true
    },
    // Add your custom roles here
  ];
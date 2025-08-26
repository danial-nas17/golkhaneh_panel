# Permission-Based Sidebar Implementation

## Current State Analysis

### Authentication Flow
1. User submits login credentials in `src/pages/login/Login.js`
2. The `login` function in `src/services/auth.js` makes the API call
3. Upon successful login, the token is stored in localStorage
4. User data is also stored in localStorage
5. The `UserContext` in `src/contexts/UserContext.js` manages user state
6. The sidebar in `src/components/sidebar.js` is currently hardcoded with all menu items

### Issues with Current Implementation
1. Permissions from the login response are not being stored or utilized
2. The sidebar shows all menu items regardless of user permissions
3. The permission checking hook (`usePermissions.js`) references a non-existent `AuthContext`

## Proposed Solution

### 1. Store Permissions in User Context
- Modify `src/services/auth.js` to extract permissions from the login response
- Update `src/contexts/UserContext.js` to store permissions in the user state
- Ensure permissions are persisted in localStorage

### 2. Create Permission Checking Mechanism
- Fix `src/hook/usePermissions.js` to use the correct context (`UserContext`)
- Implement permission checking functions:
  - `hasPermission(permission)` - Check if user has a specific permission
  - `hasAnyPermission(permissions)` - Check if user has any of the specified permissions
  - `hasAllPermissions(permissions)` - Check if user has all of the specified permissions

### 3. Implement Conditional Rendering in Sidebar
- Modify `src/components/sidebar.js` to conditionally render menu items based on user permissions
- Define permission requirements for each sidebar menu item
- Handle special cases for super admin users who have access to all features

## Implementation Plan

### Step 1: Update Authentication Service
File: `src/services/auth.js`
- Extract permissions from login response
- Store permissions in localStorage

### Step 2: Update User Context
File: `src/contexts/UserContext.js`
- Add permissions to user state
- Update `loginUser` function to handle permissions
- Ensure permissions are loaded from localStorage on app initialization

### Step 3: Fix Permission Hook
File: `src/hook/usePermissions.js`
- Update to use `UserContext` instead of `AuthContext`
- Implement permission checking functions

### Step 4: Update Sidebar Component
File: `src/components/sidebar.js`
- Import and use the permission hook
- Define permission requirements for each menu item
- Conditionally render menu items based on user permissions

## Permission Mapping for Sidebar Items

| Sidebar Item | Required Permission(s) | Route |
|--------------|------------------------|-------|
| داشبورد | dashboard | / |
| محصولات (SubMenu) | product | /products* |
| - محصولات | product | /products |
| - تنوع محصولات | product | /productsVariation |
| - دسته‌بندی | category | /categories |
| - ویژگی‌ها | attribute | /attributes |
| سفارشات (SubMenu) | order | /orders* |
| - سفارشات | order | /orders |
| - سفارش دستی | order | /orders/manual |
| اشتراک‌ها | subscription | /subscription |
| درخواست پشتیبانی | ticket | /tickets |
| مدیریت کاربران | users | /users |
| مدیریت نقش‌ها | roles | /roles |
| تنظیمات | setting | /setting |
| خروج | (always available) | /login |

## Special Cases
1. Super Admin users (role: "super_admin") should have access to all menu items
2. Some menu items are currently commented out in the sidebar and should remain hidden until permissions are properly implemented

## Technical Considerations

1. **Backward Compatibility**: Ensure that users without permission data can still access the application
2. **Performance**: Permission checking should be efficient and not cause rendering delays
3. **Error Handling**: Gracefully handle cases where permission data is missing or malformed
4. **Testing**: Test with different user roles and permission combinations

## Files to be Modified

1. `src/services/auth.js` - Extract and store permissions
2. `src/contexts/UserContext.js` - Manage permissions state
3. `src/hook/usePermissions.js` - Implement permission checking
4. `src/components/sidebar.js` - Conditional rendering based on permissions

## Future Enhancements

1. Implement role-based permission inheritance
2. Add permission management UI for administrators
3. Create more granular permissions for submenu items
4. Add loading states while permissions are being checked
# Testing Permission-Based Sidebar Implementation

This document provides guidance on how to test the permission-based sidebar implementation.

## Test Scenarios

### 1. Super Admin User
- **Expected Behavior**: All sidebar menu items should be visible
- **Test Steps**:
  1. Log in with a user account that has the "super_admin" role
  2. Verify that all menu items are visible in the sidebar
  3. Verify that all submenu items are accessible

### 2. Regular User with Limited Permissions
- **Expected Behavior**: Only menu items corresponding to user's permissions should be visible
- **Test Steps**:
  1. Log in with a user account that has limited permissions (e.g., only "dashboard" and "product")
  2. Verify that only the "داشبورد" (Dashboard) and "محصولات" (Products) menu items are visible
  3. Verify that the "سفارشات" (Orders), "مدیریت کاربران" (User Management), etc. are not visible
  4. Verify that all submenu items under "محصولات" are visible since the user has "product" permission

### 3. User with No Permissions
- **Expected Behavior**: Only the "داشبورد" (Dashboard) should be visible (if "dashboard" permission is granted by default)
- **Test Steps**:
  1. Log in with a user account that has no permissions
  2. Verify that only minimal menu items are visible
  3. Verify that the logout button is still accessible

### 4. User with Category-Only Permission
- **Expected Behavior**: Only "داشبورد" (Dashboard) and "محصولات" -> "دسته‌بندی" (Categories) should be visible
- **Test Steps**:
  1. Log in with a user account that has only "dashboard" and "category" permissions
  2. Verify that the "محصولات" submenu is visible (because it contains at least one accessible item)
  3. Verify that only the "دسته‌بندی" (Categories) item is visible within the "محصولات" submenu
  4. Verify that "محصولات", "تنوع محصولات", and "ویژگی‌ها" are not visible within the submenu

## Testing Edge Cases

### 1. User with Null Permissions
- **Expected Behavior**: Only the logout button should be visible
- **Test Steps**:
  1. Log in with a user account that has null permissions
  2. Verify that no menu items except logout are visible

### 2. User with Empty Permissions Array
- **Expected Behavior**: Only the logout button should be visible
- **Test Steps**:
  1. Log in with a user account that has an empty permissions array
  2. Verify that no menu items except logout are visible

### 3. User with Malformed Permissions Data
- **Expected Behavior**: System should gracefully handle the error and show minimal menu items
- **Test Steps**:
  1. Simulate a scenario where permissions data is malformed
  2. Verify that the application doesn't crash
  3. Verify that at minimum the logout button is accessible

## Mobile View Testing

### 1. Super Admin on Mobile
- **Expected Behavior**: All menu items should be visible when sidebar is opened
- **Test Steps**:
  1. Log in with a super admin account on a mobile device
  2. Tap the menu button to open the sidebar
  3. Verify that all menu items are visible

### 2. Regular User on Mobile
- **Expected Behavior**: Only permitted menu items should be visible when sidebar is opened
- **Test Steps**:
  1. Log in with a regular user account on a mobile device
  2. Tap the menu button to open the sidebar
  3. Verify that only permitted menu items are visible

## Performance Testing

### 1. Large Number of Permissions
- **Expected Behavior**: Sidebar should render quickly even with many permissions
- **Test Steps**:
  1. Log in with a user account that has a large number of permissions
  2. Measure the time it takes for the sidebar to render
  3. Verify that rendering time is acceptable (< 100ms)

## Accessibility Testing

### 1. Keyboard Navigation
- **Expected Behavior**: Users should be able to navigate through visible menu items using keyboard
- **Test Steps**:
  1. Log in with a user account with limited permissions
  2. Use Tab key to navigate through menu items
  3. Verify that focus only lands on visible menu items

### 2. Screen Reader Compatibility
- **Expected Behavior**: Screen readers should only announce visible menu items
- **Test Steps**:
  1. Log in with a user account with limited permissions
  2. Use a screen reader to navigate the sidebar
  3. Verify that only visible menu items are announced

## Test Data Examples

### Sample User with Full Permissions
```json
{
  "role": "admin",
  "permissions": [
    "dashboard",
    "product",
    "category",
    "attribute",
    "order",
    "subscription",
    "ticket",
    "users",
    "roles",
    "setting"
  ]
}
```

### Sample User with Limited Permissions
```json
{
  "role": "product_manager",
  "permissions": [
    "dashboard",
    "product",
    "category",
    "attribute"
  ]
}
```

### Sample User with Minimal Permissions
```json
{
  "role": "viewer",
  "permissions": [
    "dashboard"
  ]
}
```

## Troubleshooting

### Issue: Menu Items Not Showing for Super Admin
- **Possible Cause**: Role check not working correctly
- **Solution**: Verify that the `hasPermission` function correctly identifies super admin users

### Issue: Menu Items Showing When They Shouldn't
- **Possible Cause**: Permission check logic error
- **Solution**: Verify that the permission checking is correctly implemented for each menu item

### Issue: Submenu Items Not Showing Correctly
- **Possible Cause**: Nested permission checks not working
- **Solution**: Verify that both the submenu and its items have correct permission checks

## Success Criteria

1. Super admin users can see all menu items
2. Regular users can only see menu items they have permissions for
3. Menu items are hidden completely (not just disabled) when user lacks permissions
4. Application performance is not significantly impacted
5. Mobile and desktop views work consistently
6. Accessibility is maintained
7. No errors or crashes occur with any permission combination
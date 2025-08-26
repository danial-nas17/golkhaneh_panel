# Sidebar Permission Mapping

This document defines the permission requirements for each sidebar menu item in the application.

## Permission Requirements

| Sidebar Item | Required Permission(s) | Route |
|--------------|------------------------|-------|
| داشبورد (Dashboard) | dashboard | / |
| محصولات (Products) | product | /products* |
| - محصولات (Products) | product | /products |
| - تنوع محصولات (Product Variations) | product | /productsVariation |
| - دسته‌بندی (Categories) | category | /categories |
| - ویژگی‌ها (Attributes) | attribute | /attributes |
| سفارشات (Orders) | order | /orders* |
| - سفارشات (Orders) | order | /orders |
| - سفارش دستی (Manual Order) | order | /orders/manual |
| اشتراک‌ها (Subscriptions) | subscription | /subscription |
| درخواست پشتیبانی (Support Tickets) | ticket | /tickets |
| مدیریت کاربران (User Management) | users | /users |
| مدیریت نقش‌ها (Role Management) | roles | /roles |
| تنظیمات (Settings) | setting | /setting |

## Special Cases

1. **Logout**: Always visible to all users
2. **Super Admin Users**: Users with role "super_admin" have access to all menu items regardless of their permissions

## Implementation Notes

1. Each menu item is wrapped in a permission check using the `hasPermission` function
2. SubMenu components are also wrapped in permission checks
3. If a user doesn't have the required permission for a menu item, that item is not rendered
4. The permission checking is done at render time, so changes to user permissions would require a page refresh or state update

## Future Enhancements

1. Add more granular permissions for individual actions within each section
2. Implement role-based permission inheritance
3. Add permission management UI for administrators
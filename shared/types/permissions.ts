export type Permission = 
  | 'manage_users'           // Create, read, update users
  | 'change_roles'          // Change user roles
  | 'view_users'            // View user list
  | 'edit_user_info'        // Edit basic user info (name, email, etc.)
  | 'reset_user_password'   // Reset other users' passwords
  | 'manage_devices'        // Create, read, update, delete devices
  | 'view_devices'          // View device list and details

export type Role = 
  | 'admin'
  | 'ciso'
  | 'cto'
  | 'security_manager'
  | 'network_engineer'
  | 'approver'
  | 'implementer'
  | 'user'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['manage_users', 'change_roles', 'view_users', 'edit_user_info', 'reset_user_password', 'manage_devices', 'view_devices'],
  ciso: ['view_users', 'edit_user_info', 'view_devices'],
  cto: ['view_users', 'edit_user_info', 'view_devices'],
  security_manager: ['view_users', 'edit_user_info', 'view_devices'],
  network_engineer: ['view_users', 'view_devices'],
  approver: ['view_users', 'view_devices'],
  implementer: ['view_users', 'view_devices'],
  user: ['view_users', 'view_devices']
} 
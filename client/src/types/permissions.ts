export type Permission = 
  | 'manage_users'           // Create, read, update users
  | 'change_roles'          // Change user roles
  | 'view_users'            // View user list
  | 'edit_user_info'        // Edit basic user info (name, email, etc.)
  | 'reset_user_password'   // Reset other users' passwords

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
  admin: ['manage_users', 'change_roles', 'view_users', 'edit_user_info', 'reset_user_password'],
  ciso: ['view_users', 'edit_user_info'],
  cto: ['view_users', 'edit_user_info'],
  security_manager: ['view_users', 'edit_user_info'],
  network_engineer: ['view_users'],
  approver: ['view_users'],
  implementer: ['view_users'],
  user: ['view_users']
} 
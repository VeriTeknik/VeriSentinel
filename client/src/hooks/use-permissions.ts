import { useAuth } from './use-auth'
import { Permission, ROLE_PERMISSIONS, Role } from '@/types/permissions'

export function usePermissions() {
  const { user } = useAuth()
  
  const hasPermission = (permission: Permission): boolean => {
    if (!user || !user.role) return false
    const userRole = user.role as Role
    return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
  }

  const hasPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  return {
    hasPermission,
    hasPermissions
  }
} 
import { Permission, ROLE_PERMISSIONS, Role } from '@shared/types/permissions'
import { Request, Response, NextFunction } from 'express'

export type PermissionHandler = (
  req: Request,
  res: Response,
  permission: Permission
) => Promise<boolean>

export const withPermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const userRole = req.user.role as Role
      const hasPermission = ROLE_PERMISSIONS[userRole]?.includes(permission)

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Permission denied',
          required: permission
        })
      }

      return next()
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
} 
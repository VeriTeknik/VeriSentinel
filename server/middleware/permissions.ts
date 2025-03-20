import { Permission, ROLE_PERMISSIONS, Role } from '@/types/permissions'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export type PermissionHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  permission: Permission
) => Promise<boolean>

export const withPermission = (permission: Permission) => {
  return async (req: NextApiRequest, res: NextApiResponse, next: any) => {
    try {
      const session = await getServerSession(req, res, authOptions)
      
      if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const userRole = session.user.role as Role
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
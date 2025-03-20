import { useQuery } from '@tanstack/react-query';
import { AuditLog, User } from '@shared/schema';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Edit, 
  Calendar, 
  AlertTriangle, 
  FileText,
  Server,
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useState } from 'react';

interface ExtendedAuditLog extends Omit<AuditLog, 'timestamp'> {
  timestamp: string | Date;
}

const ITEMS_PER_PAGE = 10;

export default function AuditLogs() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: auditLogs, isLoading: isLoadingLogs } = useQuery<AuditLog[]>({ 
    queryKey: ['/api/audit-logs'],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users']
  });

  const isLoading = isLoadingLogs || isLoadingUsers;

  // Calculate pagination values
  const totalItems = auditLogs?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = auditLogs?.slice(startIndex, endIndex) || [];

  const getIconForAction = (action: string) => {
    switch (action) {
      case 'update_control':
      case 'update_task':
        return <CheckCircle className="h-5 w-5" />;
      case 'approve_change_request':
      case 'implement_change_request':
      case 'create_change_request':
        return <Edit className="h-5 w-5" />;
      case 'create_task':
        return <Calendar className="h-5 w-5" />;
      case 'unauthorized_access':
        return <AlertTriangle className="h-5 w-5" />;
      case 'upload_evidence':
        return <FileText className="h-5 w-5" />;
      case 'update_device':
      case 'create_device':
      case 'delete_device':
        return <Server className="h-5 w-5" />;
      case 'device_status_change':
        return <Activity className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getColorForAction = (action: string, details: string | null) => {
    // Check for device status in details
    if (action === 'update_device' && details) {
      if (details.includes('status: critical') || details.includes('status: down')) {
        return 'bg-destructive-100 text-destructive-600';
      }
      if (details.includes('status: warning')) {
        return 'bg-warning-100 text-warning-600';
      }
      if (details.includes('status: active')) {
        return 'bg-success-100 text-success-600';
      }
    }

    switch (action) {
      case 'update_control':
      case 'update_task':
        return 'bg-primary-100 text-primary-600';
      case 'approve_change_request':
      case 'implement_change_request':
        return 'bg-success-100 text-success-600';
      case 'create_task':
      case 'create_change_request':
        return 'bg-info-100 text-info-600';
      case 'unauthorized_access':
        return 'bg-warning-100 text-warning-600';
      case 'upload_evidence':
        return 'bg-primary-100 text-primary-600';
      case 'update_device':
      case 'create_device':
      case 'delete_device':
        return 'bg-info-100 text-info-600';
      default:
        return 'bg-primary-100 text-primary-600';
    }
  };

  const formatActionText = (log: ExtendedAuditLog) => {
    const action = log.action.replace(/_/g, ' ');
    
    // Special formatting for device status changes
    if (log.action === 'update_device' && log.details?.includes('status:')) {
      const deviceName = log.details.split('device:')[1]?.split(',')[0]?.trim() || log.resourceId;
      const newStatus = log.details.split('status:')[1]?.split(',')[0]?.trim() || 'unknown';
      const previousStatus = log.details.split('Previous status:')[1]?.trim() || 'unknown';
      return `Device ${deviceName} status changed from ${previousStatus} to ${newStatus}`;
    }
    
    return `${action} ${log.resourceType} ${log.resourceId}`;
  };

  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getUserName = (userId: number) => {
    const user = users?.find(u => u.id === userId);
    return user?.name || `User ${userId}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Audit Logs">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Audit Logs">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-gray-600 mt-1">View all system activity and changes</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource Type</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatTime(log.timestamp)}</TableCell>
                    <TableCell>
                      {getUserName(log.userId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={`h-8 w-8 rounded-full ${getColorForAction(log.action, log.details)} flex items-center justify-center`}>
                          {getIconForAction(log.action)}
                        </span>
                        <span>{formatActionText(log as ExtendedAuditLog)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{log.resourceType.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{log.resourceId}</TableCell>
                    <TableCell className="max-w-md truncate">{log.details || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex w-[100px] items-center justify-start text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-[100px] text-sm text-gray-500 text-right">
            {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
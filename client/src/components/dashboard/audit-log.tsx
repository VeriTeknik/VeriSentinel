import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { AuditLog } from '@shared/schema';
import { 
  CheckCircle, 
  Edit, 
  Calendar, 
  AlertTriangle, 
  FileText
} from 'lucide-react';

export function AuditLogComponent() {
  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({ 
    queryKey: ['/api/audit-logs'] 
  });

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8 text-center animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

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
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getColorForAction = (action: string) => {
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
      default:
        return 'bg-primary-100 text-primary-600';
    }
  };

  const formatActionText = (log: AuditLog) => {
    const action = log.action.replace(/_/g, ' ');
    return `${action} ${log.resourceType} ${log.resourceId}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 2) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
             ` at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
  };

  // Show either actual audit logs, or demo data if we don't have access to the audit logs API
  const displayLogs = auditLogs && auditLogs.length > 0 ? auditLogs.slice(0, 5) : [
    { id: 1, action: 'update_control', userId: 1, resourceType: 'compliance_control', resourceId: 'PCI-DSS-8.2.3', details: 'Updated compliance control', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { id: 2, action: 'approve_change_request', userId: 2, resourceType: 'change_request', resourceId: 'CR-1233', details: 'Approved change request', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { id: 3, action: 'create_task', userId: 3, resourceType: 'task', resourceId: 'Review access control logs', details: 'Created a new task', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 4, action: 'unauthorized_access', userId: 0, resourceType: 'system', resourceId: '192.168.1.53', details: 'Detected unauthorized access attempt', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 5, action: 'upload_evidence', userId: 2, resourceType: 'compliance_control', resourceId: 'ISO-A.12.4.1', details: 'Uploaded evidence for compliance control', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
  ];

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Audit Log</h2>
      </div>
      <div className="p-5">
        <ul className="space-y-4">
          {displayLogs.map(log => (
            <li key={log.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <span className={`h-8 w-8 rounded-full ${getColorForAction(log.action)} flex items-center justify-center`}>
                  {getIconForAction(log.action)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-800">
                  <span className="font-medium">User {log.userId}</span> {formatActionText(log)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{formatTime(log.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <button 
          onClick={() => navigate('/audit-logs')} 
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View all activity →
        </button>
      </div>
    </div>
  );
}

export default AuditLogComponent;

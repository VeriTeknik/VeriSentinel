import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/dashboard-layout';
import AuditLogsView from '@/components/audit-logs/audit-logs-view';
import type { AuditLog } from '@shared/types/audit-logs';

export default function AuditLogs() {
  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({ 
    queryKey: ['/api/audit-logs'],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Audit Logs">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Audit Logs">
      <AuditLogsView logs={auditLogs || []} />
    </DashboardLayout>
  );
}
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatCard from "@/components/dashboard/stat-card";
import ComplianceOverview from "@/components/dashboard/compliance-overview";
import NetworkTopology from "@/components/dashboard/network-topology";
import TaskManagement from "@/components/dashboard/task-management";
import ChangeManagement from "@/components/dashboard/change-management";
import AuditLogComponent from "@/components/dashboard/audit-log";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  AlertTriangle, 
  CheckSquare, 
  Cloud 
} from "lucide-react";
import { 
  ComplianceControl, 
  Task, 
  Device 
} from "@shared/schema";

export default function Dashboard() {
  const { data: controls } = useQuery<ComplianceControl[]>({ 
    queryKey: ['/api/compliance-controls'] 
  });
  
  const { data: tasks } = useQuery<Task[]>({ 
    queryKey: ['/api/tasks'] 
  });
  
  const { data: devices } = useQuery<Device[]>({ 
    queryKey: ['/api/devices'] 
  });
  
  // Calculate stats
  const complianceRate = controls 
    ? Math.round((controls.filter(c => c.status === 'compliant').length / controls.length) * 100) 
    : 0;
  
  const highRiskItems = controls 
    ? controls.filter(c => c.severity === 'high' && c.status !== 'compliant').length 
    : 0;
  
  const completedTasks = tasks 
    ? `${tasks.filter(t => t.status === 'completed').length}/${tasks.length}` 
    : '0/0';
  
  const deviceCount = devices ? devices.length : 0;

  return (
    <DashboardLayout>
      {/* Dashboard Overview Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Compliance Rate" 
          value={`${complianceRate}%`} 
          icon={<Shield className="h-6 w-6" />} 
          linkUrl="/compliance" 
          iconBgColor="bg-primary-50" 
          iconColor="text-primary-500"
        />
        
        <StatCard 
          title="High Risk Items" 
          value={highRiskItems} 
          icon={<AlertTriangle className="h-6 w-6" />} 
          linkUrl="/compliance" 
          iconBgColor="bg-warning-50" 
          iconColor="text-warning-500"
        />
        
        <StatCard 
          title="Completed Tasks" 
          value={completedTasks} 
          icon={<CheckSquare className="h-6 w-6" />} 
          linkUrl="/tasks" 
          iconBgColor="bg-success-50" 
          iconColor="text-success-500"
        />
        
        <StatCard 
          title="Devices" 
          value={deviceCount} 
          icon={<Cloud className="h-6 w-6" />} 
          linkUrl="/hardware-inventory" 
          iconBgColor="bg-info-50" 
          iconColor="text-info-500"
        />
      </div>
      
      {/* Compliance and Network Topology */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <ComplianceOverview />
        <NetworkTopology />
      </div>
      
      {/* Task Management */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <TaskManagement />
      </div>
      
      {/* Change Management and Audit Log */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChangeManagement />
        <AuditLogComponent />
      </div>
    </DashboardLayout>
  );
}

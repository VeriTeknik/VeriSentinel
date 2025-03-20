import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { AuditLog, Task } from '@shared/schema';
import { Bell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const [location, navigate] = useLocation();
  const { data: auditLogs } = useQuery<AuditLog[]>({
    queryKey: ['/api/audit-logs'],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Get the page title based on the current route
  const getPageTitle = () => {
    switch (location) {
      case '/':
        return 'Dashboard';
      case '/compliance':
        return 'Compliance';
      case '/tasks':
        return 'Tasks';
      case '/hardware-inventory':
        return 'Hardware Inventory';
      case '/user-management':
        return 'User Management';
      case '/audit-logs':
        return 'Audit Logs';
      default:
        return 'Verisentinel';
    }
  };

  // Get recent notifications (last 5 audit logs)
  const recentNotifications = auditLogs?.slice(0, 5) || [];
  
  // Get upcoming tasks (next 5 incomplete tasks)
  const upcomingTasks = tasks
    ?.filter(task => task.status !== 'completed' && task.dueDate !== null)
    ?.sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    })
    ?.slice(0, 5) || [];
  
  // Format the notification message
  const formatNotification = (log: AuditLog) => {
    const action = log.action.replace(/_/g, ' ');
    if (log.action === 'update_device' && log.details?.includes('status:')) {
      const deviceName = log.details.split('device:')[1]?.split(',')[0]?.trim() || log.resourceId;
      const newStatus = log.details.split('status:')[1]?.split(',')[0]?.trim() || 'unknown';
      return `Device ${deviceName} status changed to ${newStatus}`;
    }
    return `${action} ${log.resourceType} ${log.resourceId}`;
  };

  // Format time for notifications
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.round(diffMins / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format due date for tasks
  const formatDueDate = (dueDate: string) => {
    if (!dueDate) return 'No due date';
    
    const date = new Date(dueDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Overdue';
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays < 7) {
      return `Due in ${diffDays} days`;
    } else {
      return `Due ${date.toLocaleDateString()}`;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {title || getPageTitle()}
          </h1>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {recentNotifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                {recentNotifications.length > 0 ? (
                  <>
                    {recentNotifications.map((log) => (
                      <DropdownMenuItem
                        key={log.id}
                        className="flex flex-col items-start py-2 px-4 cursor-pointer"
                        onClick={() => navigate('/audit-logs')}
                      >
                        <div className="text-sm font-medium">{formatNotification(log)}</div>
                        <div className="text-xs text-gray-500">{formatTime(log.timestamp.toString())}</div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      className="flex justify-center text-sm text-primary-600 hover:text-primary-700 py-2 border-t"
                      onClick={() => navigate('/audit-logs')}
                    >
                      View all activity
                    </DropdownMenuItem>
                  </>
                ) : (
                  <div className="py-2 px-4 text-sm text-gray-500">
                    No new notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative"
                >
                  <Calendar className="h-5 w-5" />
                  {upcomingTasks.length > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-warning-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                {upcomingTasks.length > 0 ? (
                  <>
                    {upcomingTasks.map((task) => (
                      <DropdownMenuItem
                        key={task.id}
                        className="flex flex-col items-start py-2 px-4 cursor-pointer"
                        onClick={() => navigate('/tasks')}
                      >
                        <div className="text-sm font-medium">{task.title}</div>
                        <div className="text-xs text-gray-500">
                          {task.dueDate ? formatDueDate(task.dueDate.toString()) : 'No due date'}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      className="flex justify-center text-sm text-primary-600 hover:text-primary-700 py-2 border-t"
                      onClick={() => navigate('/tasks')}
                    >
                      View all tasks
                    </DropdownMenuItem>
                  </>
                ) : (
                  <div className="py-2 px-4 text-sm text-gray-500">
                    No upcoming tasks
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

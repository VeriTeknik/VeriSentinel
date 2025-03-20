import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Task } from '@shared/schema';

interface KanbanColumnProps {
  title: string;
  count: number;
  tasks: Task[];
}

const KanbanColumn = ({ title, count, tasks }: KanbanColumnProps) => {
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-error-100 text-error-800';
      case 'medium':
        return 'bg-warning-100 text-warning-800';
      case 'low':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-shrink-0 w-72 bg-gray-50 rounded-md border border-gray-200 min-h-[480px]">
      <div className="p-3 border-b border-gray-200 bg-gray-100">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <span>{title}</span>
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800">{count}</span>
        </h3>
      </div>
      <div className="p-3 space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getSeverityClass(task.relatedControlId ? 'high' : 'medium')} font-medium`}>
                {task.relatedControlId ? 'High' : 'Medium'}
              </span>
              <span className="text-xs text-gray-500">PCI DSS</span>
            </div>
            <h4 className="text-sm font-medium mb-1">{task.title}</h4>
            <p className="text-xs text-gray-500 mb-3">{task.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No due date'}
              </span>
              <div className="h-6 w-6 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs">
                {task.assignedTo ? 'A' : 'U'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function TaskManagement() {
  const [_, navigate] = useLocation();
  const { data: tasks, isLoading } = useQuery<Task[]>({ 
    queryKey: ['/api/tasks'] 
  });

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8 text-center animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-64 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  // Group tasks by status
  const todoTasks = tasks?.filter(task => task.status === 'todo') || [];
  const inProgressTasks = tasks?.filter(task => task.status === 'in-progress') || [];
  const reviewTasks = tasks?.filter(task => task.status === 'review') || [];
  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Compliance Tasks</h2>
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>
      </div>
      <div className="p-5 overflow-hidden">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          <KanbanColumn title="To Do" count={todoTasks.length} tasks={todoTasks} />
          <KanbanColumn title="In Progress" count={inProgressTasks.length} tasks={inProgressTasks} />
          <KanbanColumn title="In Review" count={reviewTasks.length} tasks={reviewTasks} />
          <KanbanColumn title="Completed" count={completedTasks.length} tasks={completedTasks} />
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <button 
          onClick={() => navigate('/tasks')} 
          className="text-sm font-medium text-primary-600 hover:text-primary-700 border-none bg-transparent p-0"
        >
          View all tasks →
        </button>
      </div>
    </div>
  );
}

export default TaskManagement;
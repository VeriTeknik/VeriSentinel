import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Task, ComplianceControl, Sprint, User, insertTaskSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Task card component
interface TaskCardProps {
  task: Task;
  onStatusChange: (id: number, status: string) => void;
  isPending: boolean;
}

const TaskCard = ({ task, onStatusChange, isPending }: TaskCardProps) => {
  const getSeverityClass = (task: Task) => {
    // Using relatedControlId as a proxy for severity in this example
    if (task.relatedControlId) {
      return "bg-error-100 text-error-800";
    } else if (task.dueDate && new Date(task.dueDate) < new Date()) {
      return "bg-warning-100 text-warning-800";
    } else {
      return "bg-success-100 text-success-800";
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "todo":
        return "in-progress";
      case "in-progress":
        return "review";
      case "review":
        return "completed";
      default:
        return currentStatus;
    }
  };

  return (
    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityClass(task)} font-medium`}>
          {task.relatedControlId ? "High" : "Medium"}
        </span>
        <span className="text-xs text-gray-500">
          {task.relatedControlId ? "Compliance" : "General"}
        </span>
      </div>
      <h4 className="text-sm font-medium mb-1">{task.title}</h4>
      <p className="text-xs text-gray-500 mb-3">{task.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {task.dueDate 
            ? `Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` 
            : "No due date"}
        </span>
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs">
            {task.assignedTo ? "A" : "U"}
          </div>
          {task.status !== "completed" && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              disabled={isPending}
              onClick={() => onStatusChange(task.id, getNextStatus(task.status))}
            >
              <CheckCircle className="h-4 w-4 text-success-600" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Tasks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch tasks and related data
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks']
  });

  const { data: controls } = useQuery<ComplianceControl[]>({
    queryKey: ['/api/compliance-controls']
  });

  const { data: sprints } = useQuery<Sprint[]>({
    queryKey: ['/api/sprints']
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users']
  });

  // Task form schema
  const taskFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.string().min(1, "Status is required"),
    assignedTo: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    relatedControlId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    sprintId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  });

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof taskFormSchema>) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Task Created",
        description: "The task has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/tasks/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task Updated",
        description: "The task status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = (data: z.infer<typeof taskFormSchema>) => {
    createTaskMutation.mutate(data);
  };

  const handleStatusChange = (id: number, status: string) => {
    updateTaskMutation.mutate({ id, status });
  };

  // Group tasks by status
  const todoTasks = tasks?.filter(task => task.status === 'todo') || [];
  const inProgressTasks = tasks?.filter(task => task.status === 'in-progress') || [];
  const reviewTasks = tasks?.filter(task => task.status === 'review') || [];
  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];

  // Loading state
  if (isLoadingTasks) {
    return (
      <DashboardLayout title="Tasks">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tasks">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Task Management</h1>
        <div className="flex space-x-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your workflow.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateTask)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter task title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter task description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="review">In Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned To</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select assignee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {users?.map(user => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name || user.username}
                                </SelectItem>
                              ))}
                              {!users && <SelectItem value={(user?.id || 0).toString()}>Me</SelectItem>}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="relatedControlId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Related Control</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select control" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {controls?.map(control => (
                                <SelectItem key={control.id} value={control.id.toString()}>
                                  {control.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="sprintId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sprint</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sprint" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No Sprint</SelectItem>
                            {sprints?.map(sprint => (
                              <SelectItem key={sprint.id} value={sprint.id.toString()}>
                                {sprint.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createTaskMutation.isPending}>
                      {createTaskMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Task
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-6">
        {/* To Do Column */}
        <div className="bg-gray-50 rounded-md border border-gray-200 min-h-[500px]">
          <div className="p-3 border-b border-gray-200 bg-gray-100">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <span>To Do</span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800">{todoTasks.length}</span>
            </h3>
          </div>
          <div className="p-3 space-y-3">
            {todoTasks.length > 0 ? (
              todoTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                  isPending={updateTaskMutation.isPending}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No tasks in this column
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-gray-50 rounded-md border border-gray-200 min-h-[500px]">
          <div className="p-3 border-b border-gray-200 bg-gray-100">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <span>In Progress</span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800">{inProgressTasks.length}</span>
            </h3>
          </div>
          <div className="p-3 space-y-3">
            {inProgressTasks.length > 0 ? (
              inProgressTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                  isPending={updateTaskMutation.isPending}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No tasks in this column
              </div>
            )}
          </div>
        </div>

        {/* In Review Column */}
        <div className="bg-gray-50 rounded-md border border-gray-200 min-h-[500px]">
          <div className="p-3 border-b border-gray-200 bg-gray-100">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <span>In Review</span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800">{reviewTasks.length}</span>
            </h3>
          </div>
          <div className="p-3 space-y-3">
            {reviewTasks.length > 0 ? (
              reviewTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                  isPending={updateTaskMutation.isPending}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No tasks in this column
              </div>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-gray-50 rounded-md border border-gray-200 min-h-[500px]">
          <div className="p-3 border-b border-gray-200 bg-gray-100">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <span>Completed</span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800">{completedTasks.length}</span>
            </h3>
          </div>
          <div className="p-3 space-y-3">
            {completedTasks.length > 0 ? (
              completedTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                  isPending={updateTaskMutation.isPending}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No tasks in this column
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

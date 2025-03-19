import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileUp, Filter } from "lucide-react";
import { ComplianceFramework, ComplianceControl, insertComplianceControlSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Compliance() {
  const [selectedFramework, setSelectedFramework] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: frameworks, isLoading: isLoadingFrameworks } = useQuery<ComplianceFramework[]>({
    queryKey: ['/api/compliance-frameworks']
  });

  const { data: controls, isLoading: isLoadingControls } = useQuery<ComplianceControl[]>({
    queryKey: ['/api/compliance-controls']
  });

  // Filter controls based on selection
  const filteredControls = controls?.filter(control => {
    const frameworkMatch = selectedFramework === "all" || control.frameworkId.toString() === selectedFramework;
    const severityMatch = selectedStatus === "all" || control.severity === selectedSeverity;
    const statusMatch = selectedStatus === "all" || control.status === selectedStatus;
    return frameworkMatch && severityMatch && statusMatch;
  });

  // Form for adding a new compliance control
  const formSchema = z.object({
    frameworkId: z.string().transform(val => parseInt(val)),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    severity: z.string().min(1, "Severity is required"),
    status: z.string().min(1, "Status is required"),
    dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    assignedTo: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      severity: "medium",
      status: "non-compliant",
    },
  });

  // Create control mutation
  const createControlMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/compliance-controls", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-controls'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Control Created",
        description: "The compliance control has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Control",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update control status mutation
  const updateControlMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/compliance-controls/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance-controls'] });
      toast({
        title: "Control Updated",
        description: "The control status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Control",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateControl = (data: z.infer<typeof formSchema>) => {
    createControlMutation.mutate(data);
  };

  const handleStatusChange = (id: number, status: string) => {
    updateControlMutation.mutate({ id, status });
  };

  // Severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-error-100 text-error-800 hover:bg-error-200";
      case "medium":
        return "bg-warning-100 text-warning-800 hover:bg-warning-200";
      case "low":
        return "bg-success-100 text-success-800 hover:bg-success-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-success-100 text-success-800 hover:bg-success-200";
      case "non-compliant":
        return "bg-error-100 text-error-800 hover:bg-error-200";
      case "in-progress":
        return "bg-warning-100 text-warning-800 hover:bg-warning-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Loading state
  if (isLoadingFrameworks || isLoadingControls) {
    return (
      <DashboardLayout title="Compliance">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Compliance">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Compliance Controls</h1>
        <div className="flex space-x-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Control
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Compliance Control</DialogTitle>
                <DialogDescription>
                  Create a new compliance control for your organization.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateControl)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="frameworkId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Framework</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a framework" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {frameworks?.map(framework => (
                              <SelectItem key={framework.id} value={framework.id.toString()}>
                                {framework.name}
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter control name" {...field} />
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
                          <Textarea placeholder="Enter control description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Severity</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                              <SelectItem value="compliant">Compliant</SelectItem>
                              <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createControlMutation.isPending}>
                      {createControlMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Control
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="framework-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Framework
              </label>
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger id="framework-filter">
                  <SelectValue placeholder="All Frameworks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  {frameworks?.map(framework => (
                    <SelectItem key={framework.id} value={framework.id.toString()}>
                      {framework.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="severity-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger id="severity-filter">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredControls && filteredControls.length > 0 ? (
                filteredControls.map((control) => {
                  const framework = frameworks?.find(f => f.id === control.frameworkId);
                  
                  return (
                    <TableRow key={control.id}>
                      <TableCell className="font-medium">{control.id}</TableCell>
                      <TableCell>{control.name}</TableCell>
                      <TableCell>{framework?.name || `Framework ${control.frameworkId}`}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(control.severity)}>
                          {control.severity.charAt(0).toUpperCase() + control.severity.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={control.status} 
                          onValueChange={(value) => handleStatusChange(control.id, value)}
                          disabled={updateControlMutation.isPending}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compliant">Compliant</SelectItem>
                            <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {control.dueDate 
                          ? new Date(control.dueDate).toLocaleDateString() 
                          : "Not set"}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <FileUp className="h-4 w-4 mr-1" />
                          Evidence
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No compliance controls found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

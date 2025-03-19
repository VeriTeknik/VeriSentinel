import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ChangeRequest, insertChangeRequestSchema } from "@shared/schema";

export default function ChangeManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch change requests
  const { data: changeRequests, isLoading } = useQuery<ChangeRequest[]>({
    queryKey: ['/api/change-requests']
  });

  // Create change request form schema
  const requestFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
  });

  const form = useForm<z.infer<typeof requestFormSchema>>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      title: "Firewall Rule Change",
      description: "",
    },
  });

  // Create change request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof requestFormSchema>) => {
      const res = await apiRequest("POST", "/api/change-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/change-requests'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Change Request Created",
        description: "The change request has been successfully created and is pending approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Change Request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve change request mutation
  const approveRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/change-requests/${id}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/change-requests'] });
      setDetailsOpen(false);
      toast({
        title: "Change Request Approved",
        description: "The change request has been approved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Approve Change Request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Implement change request mutation
  const implementRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/change-requests/${id}/implement`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/change-requests'] });
      setDetailsOpen(false);
      toast({
        title: "Change Request Implemented",
        description: "The change request has been marked as implemented.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Implement Change Request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateRequest = (data: z.infer<typeof requestFormSchema>) => {
    createRequestMutation.mutate(data);
  };

  const handleApproveRequest = (id: number) => {
    approveRequestMutation.mutate(id);
  };

  const handleImplementRequest = (id: number) => {
    implementRequestMutation.mutate(id);
  };

  const handleViewDetails = (request: ChangeRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  // Filter change requests based on active tab
  const filteredRequests = changeRequests?.filter(request => {
    if (activeTab === "all") return true;
    return request.status === activeTab;
  });

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-warning-100 text-warning-800">Pending Approval</Badge>;
      case "approved":
        return <Badge className="bg-success-100 text-success-800">Approved</Badge>;
      case "implemented":
        return <Badge className="bg-info-100 text-info-800">Implemented</Badge>;
      case "rejected":
        return <Badge className="bg-error-100 text-error-800">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Change Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Change Management">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Change Management</h1>
        <div className="flex space-x-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create Change Request</DialogTitle>
                <DialogDescription>
                  Submit a new change request for approval. Provide detailed information about the requested change.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateRequest)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter request title" {...field} />
                        </FormControl>
                        <FormDescription>
                          Brief title describing the change request.
                        </FormDescription>
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
                          <Textarea 
                            placeholder="Provide detailed information about the change request" 
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include the purpose, scope, and impact of the change.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createRequestMutation.isPending}>
                      {createRequestMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Submit Request
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="implemented">Implemented</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests && filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">CR-{request.id.toString().padStart(4, '0')}</TableCell>
                    <TableCell>
                      {request.title}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>User {request.requestedBy}</TableCell>
                    <TableCell>
                      {new Date(request.requestedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="link" 
                        className="px-0 text-primary-600 hover:text-primary-700"
                        onClick={() => handleViewDetails(request)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No change requests found. Create a new request to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Change Request Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Change Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Request ID</h3>
                  <p className="text-base">CR-{selectedRequest.id.toString().padStart(4, '0')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Title</h3>
                  <p className="text-base">{selectedRequest.title}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="text-base">{selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Requested By</h3>
                  <p className="text-base">User {selectedRequest.requestedBy}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Request Date</h3>
                <p className="text-base">
                  {new Date(selectedRequest.requestedAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {selectedRequest.approvedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Approved Date</h3>
                  <p className="text-base">
                    {new Date(selectedRequest.approvedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              
              {selectedRequest.implementedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Implemented Date</h3>
                  <p className="text-base">
                    {new Date(selectedRequest.implementedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <div className="mt-1 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              </div>
              
              {selectedRequest.status === "pending" && (user?.role === "admin" || user?.role === "approver") && (
                <div className="pt-4 border-t border-gray-200">
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Approval Required</AlertTitle>
                    <AlertDescription>
                      This change request requires your approval. Review the details carefully before proceeding.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    className="w-full" 
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                    disabled={approveRequestMutation.isPending}
                  >
                    {approveRequestMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Approve Request
                  </Button>
                </div>
              )}
              
              {selectedRequest.status === "approved" && (user?.role === "admin" || user?.role === "implementer") && (
                <div className="pt-4 border-t border-gray-200">
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Implementation Required</AlertTitle>
                    <AlertDescription>
                      This change request has been approved and is ready for implementation.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    className="w-full" 
                    onClick={() => handleImplementRequest(selectedRequest.id)}
                    disabled={implementRequestMutation.isPending}
                  >
                    {implementRequestMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Mark as Implemented
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

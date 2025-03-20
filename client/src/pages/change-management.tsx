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

  // Create change request form schema with conditional fields based on change type
  const requestFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    type: z.enum(["standard", "firewall", "server", "network", "emergency"]),
    riskLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    affectedSystems: z.string().optional(),
    backoutPlan: z.string().optional(),
    // Conditional fields for firewall changes
    sourceIp: z.string().optional(),
    destinationIp: z.string().optional(),
    portServices: z.string().optional(),
    action: z.enum(["allow", "deny", "nat", "other"]).optional(),
    firewallRules: z.string().optional(),
  });

  const form = useForm<z.infer<typeof requestFormSchema>>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      title: "Firewall Rule Change",
      description: "",
      type: "firewall",
      riskLevel: "medium",
      affectedSystems: "",
      backoutPlan: "",
      sourceIp: "",
      destinationIp: "",
      portServices: "",
      action: "allow",
      firewallRules: "",
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

  // Submit for review mutation
  const submitRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/change-requests/${id}/submit`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/change-requests'] });
      setDetailsOpen(false);
      toast({
        title: "Change Request Submitted",
        description: "The change request has been submitted for review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Submit Change Request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Security approval mutation
  const securityApprovalMutation = useMutation({
    mutationFn: async ({ id, approved, comments }: { id: number, approved: boolean, comments?: string }) => {
      const res = await apiRequest("PUT", `/api/change-requests/${id}/security-approval`, { approved, comments });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/change-requests'] });
      setDetailsOpen(false);
      toast({
        title: data.securityApprovalStatus === "approved" ? "Security Approval Granted" : "Security Approval Rejected",
        description: data.securityApprovalStatus === "approved" 
          ? "The change request has passed security review." 
          : "The change request has been rejected during security review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Process Security Approval",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Technical approval mutation
  const technicalApprovalMutation = useMutation({
    mutationFn: async ({ id, approved, comments }: { id: number, approved: boolean, comments?: string }) => {
      const res = await apiRequest("PUT", `/api/change-requests/${id}/technical-approval`, { approved, comments });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/change-requests'] });
      setDetailsOpen(false);
      toast({
        title: data.technicalApprovalStatus === "approved" ? "Technical Approval Granted" : "Technical Approval Rejected",
        description: data.technicalApprovalStatus === "approved" 
          ? "The change request has passed technical review." 
          : "The change request has been rejected during technical review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Process Technical Approval",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Business approval mutation
  const businessApprovalMutation = useMutation({
    mutationFn: async ({ id, approved, comments }: { id: number, approved: boolean, comments?: string }) => {
      const res = await apiRequest("PUT", `/api/change-requests/${id}/business-approval`, { approved, comments });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/change-requests'] });
      setDetailsOpen(false);
      toast({
        title: data.businessApprovalStatus === "approved" ? "Business Approval Granted" : "Business Approval Rejected",
        description: data.businessApprovalStatus === "approved" 
          ? "The change request has been approved by business stakeholders." 
          : "The change request has been rejected by business stakeholders.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Process Business Approval",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Schedule change mutation
  const scheduleChangeMutation = useMutation({
    mutationFn: async ({ id, scheduledFor }: { id: number, scheduledFor: string }) => {
      const res = await apiRequest("PUT", `/api/change-requests/${id}/schedule`, { scheduledFor });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/change-requests'] });
      setDetailsOpen(false);
      toast({
        title: "Change Request Scheduled",
        description: "The change request has been scheduled for implementation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Schedule Change Request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Implement change request mutation
  const implementRequestMutation = useMutation({
    mutationFn: async ({ id, implementationNotes }: { id: number, implementationNotes?: string }) => {
      const res = await apiRequest("PUT", `/api/change-requests/${id}/implement`, { implementationNotes });
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

  // Verify change request mutation
  const verifyRequestMutation = useMutation({
    mutationFn: async ({ id, verified, verificationNotes }: { id: number, verified: boolean, verificationNotes?: string }) => {
      const res = await apiRequest("PUT", `/api/change-requests/${id}/verify`, { verified, verificationNotes });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/change-requests'] });
      setDetailsOpen(false);
      toast({
        title: data.verificationStatus === "verified" ? "Change Request Verified" : "Verification Failed",
        description: data.verificationStatus === "verified" 
          ? "The change has been verified and closed." 
          : "The verification failed. The change requires further implementation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Verify Change Request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateRequest = (data: z.infer<typeof requestFormSchema>) => {
    createRequestMutation.mutate(data);
  };

  const handleSubmitRequest = (id: number) => {
    submitRequestMutation.mutate(id);
  };

  const handleSecurityApproval = (id: number, approved: boolean, comments?: string) => {
    securityApprovalMutation.mutate({ id, approved, comments });
  };

  const handleTechnicalApproval = (id: number, approved: boolean, comments?: string) => {
    technicalApprovalMutation.mutate({ id, approved, comments });
  };

  const handleBusinessApproval = (id: number, approved: boolean, comments?: string) => {
    businessApprovalMutation.mutate({ id, approved, comments });
  };

  const handleScheduleChange = (id: number, scheduledFor: string) => {
    scheduleChangeMutation.mutate({ id, scheduledFor });
  };

  const handleImplementRequest = (id: number, implementationNotes?: string) => {
    implementRequestMutation.mutate({ id, implementationNotes });
  };

  const handleVerifyRequest = (id: number, verified: boolean, verificationNotes?: string) => {
    verifyRequestMutation.mutate({ id, verified, verificationNotes });
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
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case "pending_security_review":
        return <Badge className="bg-warning-100 text-warning-800">Security Review</Badge>;
      case "pending_technical_review":
        return <Badge className="bg-warning-100 text-warning-800">Technical Review</Badge>;
      case "pending_business_review":
        return <Badge className="bg-warning-100 text-warning-800">Business Review</Badge>;
      case "approved":
        return <Badge className="bg-success-100 text-success-800">Approved</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "implemented":
        return <Badge className="bg-info-100 text-info-800">Implemented</Badge>;
      case "verified":
        return <Badge className="bg-emerald-100 text-emerald-800">Verified</Badge>;
      case "closed":
        return <Badge className="bg-purple-100 text-purple-800">Closed</Badge>;
      case "rejected":
        return <Badge className="bg-error-100 text-error-800">Rejected</Badge>;
      default:
        return <Badge>{status.replace("_", " ")}</Badge>;
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Change Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="firewall">Firewall</SelectItem>
                              <SelectItem value="server">Server</SelectItem>
                              <SelectItem value="network">Network</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Type of change being requested
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="riskLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select risk level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Impact and risk level of the change
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide detailed information about the change request" 
                            className="min-h-[100px]"
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
                  
                  <FormField
                    control={form.control}
                    name="affectedSystems"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Affected Systems</FormLabel>
                        <FormControl>
                          <Input placeholder="List systems affected by this change" {...field} />
                        </FormControl>
                        <FormDescription>
                          Comma-separated list of systems impacted
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="backoutPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backout Plan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Plan to revert changes if issues occur" 
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Detail how the change can be reversed if needed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Conditional Firewall-specific fields */}
                  {form.watch("type") === "firewall" && (
                    <div className="space-y-4 border border-gray-200 rounded-md p-4 mt-2">
                      <h3 className="text-md font-medium border-b pb-2">Firewall Rule Details</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="sourceIp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Source IP/Network</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 192.168.1.0/24" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="destinationIp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Destination IP/Network</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 10.0.0.1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="portServices"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ports/Services</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., TCP 443, UDP 53" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="action"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Action</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select action" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="allow">Allow</SelectItem>
                                  <SelectItem value="deny">Deny</SelectItem>
                                  <SelectItem value="nat">NAT</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="firewallRules"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Rule Information</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Additional rule details, specific firewall syntax, etc." 
                                className="min-h-[60px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createRequestMutation.isPending}>
                      {createRequestMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Submit Change Request
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="pending_security_review">Security Review</TabsTrigger>
          <TabsTrigger value="pending_technical_review">Technical Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="implemented">Implemented</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
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
                  <div className="flex items-center">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="text-base capitalize">{selectedRequest.type}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Risk Level</h3>
                  <p className="text-base capitalize">{selectedRequest.riskLevel}</p>
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
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {selectedRequest.scheduledFor && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Scheduled For</h3>
                  <p className="text-base">
                    {new Date(selectedRequest.scheduledFor).toLocaleDateString('en-US', {
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
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              
              {/* Show firewall details if this is a firewall change */}
              {selectedRequest.type === "firewall" && (
                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="text-md font-medium mb-3 border-b pb-2">Firewall Rule Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {selectedRequest.sourceIp && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Source IP/Network</h4>
                        <p className="text-sm">{selectedRequest.sourceIp}</p>
                      </div>
                    )}
                    
                    {selectedRequest.destinationIp && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Destination IP/Network</h4>
                        <p className="text-sm">{selectedRequest.destinationIp}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {selectedRequest.portServices && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Ports/Services</h4>
                        <p className="text-sm">{selectedRequest.portServices}</p>
                      </div>
                    )}
                    
                    {selectedRequest.action && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Action</h4>
                        <p className="text-sm capitalize">{selectedRequest.action}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedRequest.firewallRules && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Rule Configuration</h4>
                      <div className="p-2 bg-gray-50 rounded-md border border-gray-200 mt-1">
                        <p className="text-sm whitespace-pre-wrap font-mono">{selectedRequest.firewallRules}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <div className="mt-1 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              </div>
              
              {selectedRequest.affectedSystems && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Affected Systems</h3>
                  <p className="text-base">{selectedRequest.affectedSystems}</p>
                </div>
              )}
              
              {selectedRequest.backoutPlan && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Backout Plan</h3>
                  <div className="mt-1 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm whitespace-pre-wrap">{selectedRequest.backoutPlan}</p>
                  </div>
                </div>
              )}
              
              {/* Action Section: Role-specific actions based on workflow state */}
              <div className="pt-4 border-t border-gray-200">
                {/* Draft - Submit action */}
                {selectedRequest.status === "draft" && (selectedRequest.requestedBy === user?.id || user?.role === "admin") && (
                  <div>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Draft Request</AlertTitle>
                      <AlertDescription>
                        This change request is still in draft mode. Submit it to start the approval process.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      className="w-full" 
                      onClick={() => handleSubmitRequest(selectedRequest.id)}
                      disabled={submitRequestMutation.isPending}
                    >
                      {submitRequestMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Submit for Review
                    </Button>
                  </div>
                )}
                
                {/* Security Review - Security team approval */}
                {selectedRequest.status === "pending_security_review" && 
                  (user?.role === "admin" || user?.role === "ciso" || user?.role === "security_manager") && (
                  <div>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Security Review Required</AlertTitle>
                      <AlertDescription>
                        This change request requires security team review before proceeding.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="destructive"
                        onClick={() => handleSecurityApproval(selectedRequest.id, false)}
                        disabled={securityApprovalMutation.isPending}
                      >
                        {securityApprovalMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Reject
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={() => handleSecurityApproval(selectedRequest.id, true)}
                        disabled={securityApprovalMutation.isPending}
                      >
                        {securityApprovalMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Technical Review - Technical team approval */}
                {selectedRequest.status === "pending_technical_review" && 
                  (user?.role === "admin" || user?.role === "cto" || user?.role === "network_admin") && (
                  <div>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Technical Review Required</AlertTitle>
                      <AlertDescription>
                        This change request requires technical team review before proceeding.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="destructive"
                        onClick={() => handleTechnicalApproval(selectedRequest.id, false)}
                        disabled={technicalApprovalMutation.isPending}
                      >
                        {technicalApprovalMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Reject
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={() => handleTechnicalApproval(selectedRequest.id, true)}
                        disabled={technicalApprovalMutation.isPending}
                      >
                        {technicalApprovalMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Business Review - Business approval (admin only) */}
                {selectedRequest.status === "pending_business_review" && user?.role === "admin" && (
                  <div>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Business Review Required</AlertTitle>
                      <AlertDescription>
                        This high-risk change request requires business approval before proceeding.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="destructive"
                        onClick={() => handleBusinessApproval(selectedRequest.id, false)}
                        disabled={businessApprovalMutation.isPending}
                      >
                        {businessApprovalMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Reject
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={() => handleBusinessApproval(selectedRequest.id, true)}
                        disabled={businessApprovalMutation.isPending}
                      >
                        {businessApprovalMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Approved - Schedule for implementation */}
                {selectedRequest.status === "approved" && (user?.role === "admin" || user?.role === "implementer") && (
                  <div>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Schedule Implementation</AlertTitle>
                      <AlertDescription>
                        This change request has been approved and needs to be scheduled.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        const nextWeek = new Date();
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        // Just default to a week from now for simplicity
                        handleScheduleChange(selectedRequest.id, nextWeek.toISOString());
                      }}
                      disabled={scheduleChangeMutation.isPending}
                    >
                      {scheduleChangeMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Schedule for Implementation
                    </Button>
                  </div>
                )}
                
                {/* Scheduled - Implement */}
                {selectedRequest.status === "scheduled" && 
                  (user?.role === "admin" || 
                   user?.role === "implementer" || 
                   (selectedRequest.type === "firewall" && user?.role === "network_admin")) && (
                  <div>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Ready for Implementation</AlertTitle>
                      <AlertDescription>
                        This change request is scheduled and ready to be implemented.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      className="w-full" 
                      onClick={() => handleImplementRequest(selectedRequest.id, "Change implemented according to plan.")}
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
                
                {/* Implemented - Verify (Controller role) */}
                {selectedRequest.status === "implemented" && 
                  (user?.role === "admin" || user?.role === "auditor") && 
                  selectedRequest.implementerId !== user?.id && (
                  <div>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Verification Required (Controller)</AlertTitle>
                      <AlertDescription>
                        This change request has been implemented and requires verification from a controller.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="destructive"
                        onClick={() => handleVerifyRequest(selectedRequest.id, false, "Implementation verification failed.")}
                        disabled={verifyRequestMutation.isPending}
                      >
                        {verifyRequestMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Fail Verification
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={() => handleVerifyRequest(selectedRequest.id, true, "Implementation successfully verified.")}
                        disabled={verifyRequestMutation.isPending}
                      >
                        {verifyRequestMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Verify & Close
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Closed or Rejected - Show closure message */}
                {(selectedRequest.status === "closed" || selectedRequest.status === "rejected") && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>{selectedRequest.status === "closed" ? "Change Complete" : "Change Rejected"}</AlertTitle>
                    <AlertDescription>
                      {selectedRequest.status === "closed" 
                        ? "This change request has been successfully implemented and verified." 
                        : "This change request was rejected during the approval process."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

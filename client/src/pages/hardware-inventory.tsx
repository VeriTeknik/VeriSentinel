import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Server, Network, HardDrive, Building, Pencil, CheckCircle2, XCircle, AlertCircle, Users, UserCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Site, Device, User, Role, insertSiteSchema, insertDeviceSchema } from "@shared/schema";
import { usePermissions } from "../hooks/use-permissions";
import { useAuth } from "../hooks/use-auth";

export default function HardwareInventory() {
  const [activeTab, setActiveTab] = useState<string>("devices");
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const { hasPermission } = usePermissions();
  const { user, isLoading: isLoadingUser } = useAuth();
  const { toast } = useToast();

  // Fetch sites and devices with polling
  const { data: sites, isLoading: isLoadingSites } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
    // Poll every 10 seconds
    refetchInterval: 10000,
    // Keep polling even when the window loses focus
    refetchIntervalInBackground: true
  });

  const { data: devices, isLoading: isLoadingDevices } = useQuery<Device[]>({
    queryKey: ['/api/devices'],
    // Poll every 10 seconds
    refetchInterval: 10000,
    // Keep polling even when the window loses focus
    refetchIntervalInBackground: true,
    // Optimize network usage by only refetching if data has changed
    select: (data) => data,
    staleTime: 5000
  });

  // Fetch users for RACI assignments
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchInterval: false,
  });

  // Available roles for RACI
  const roles: Role[] = [
    'admin',
    'ciso',
    'cto',
    'security_manager',
    'network_engineer',
    'approver',
    'implementer',
    'user'
  ];

  // Site form schema
  const siteFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    location: z.string().optional(),
    description: z.string().optional(),
    responsibleType: z.enum(["user", "role"]),
    responsibleId: z.string().min(1, "Responsible person/role is required"),
    accountableType: z.enum(["user", "role"]),
    accountableId: z.string().min(1, "Accountable person/role is required"),
    consultedType: z.enum(["user", "role"]),
    consultedIds: z.string().optional(),
    informedType: z.enum(["user", "role"]),
    informedIds: z.string().optional(),
    securityLevel: z.string().min(1, "Security level is required"),
  });

  const siteForm = useForm<z.infer<typeof siteFormSchema>>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: "",
      type: "primary",
      location: "",
      description: "",
      responsibleType: "user",
      accountableType: "user",
      consultedType: "user",
      informedType: "user",
      securityLevel: "medium",
    },
  });

  // Device form schema
  const deviceFormSchema = z.object({
    siteId: z.coerce.number().min(1, "Site is required"),
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    ipAddress: z.string().optional(),
    vlan: z.string().optional(),
    operatingSystem: z.string().optional(),
    services: z.string().optional(),
    status: z.string().min(1, "Status is required"),
  });

  const deviceForm = useForm<z.infer<typeof deviceFormSchema>>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: "",
      type: "server",
      status: "active",
    },
  });

  // Create site mutation
  const createSiteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof siteFormSchema>) => {
      const res = await apiRequest("POST", "/api/sites", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      setSiteDialogOpen(false);
      siteForm.reset();
      toast({
        title: "Site Created",
        description: "The site has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Site",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create device mutation
  const createDeviceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deviceFormSchema>) => {
      const res = await apiRequest("POST", "/api/devices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      setDeviceDialogOpen(false);
      deviceForm.reset();
      toast({
        title: "Device Created",
        description: "The device has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Device",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update device mutation
  const updateDeviceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deviceFormSchema>) => {
      const res = await apiRequest("PUT", `/api/devices/${editingDevice?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
      setDeviceDialogOpen(false);
      setEditingDevice(null);
      deviceForm.reset();
      toast({
        title: "Device Updated",
        description: "The device has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Device..",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateSite = (data: z.infer<typeof siteFormSchema>) => {
    createSiteMutation.mutate(data);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    deviceForm.reset({
      siteId: device.siteId,
      name: device.name,
      type: device.type,
      ipAddress: device.ipAddress || "",
      vlan: device.vlan || "",
      operatingSystem: device.operatingSystem || "",
      services: device.services || "",
      status: device.status,
    });
    setDeviceDialogOpen(true);
  };

  const handleSubmitDevice = (data: z.infer<typeof deviceFormSchema>) => {
    if (editingDevice) {
      updateDeviceMutation.mutate(data);
    } else {
      createDeviceMutation.mutate(data);
    }
  };

  // Device type icon
  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case "server":
        return <Server className="h-4 w-4" />;
      case "network":
        return <Network className="h-4 w-4" />;
      case "storage":
        return <HardDrive className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  // Site type badge
  const getSiteTypeBadge = (type: string) => {
    switch (type) {
      case "primary":
        return <Badge className="bg-primary-100 text-primary-800">Primary</Badge>;
      case "dr":
        return <Badge className="bg-warning-100 text-warning-800">Disaster Recovery</Badge>;
      case "branch":
        return <Badge className="bg-info-100 text-info-800">Branch Office</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  // Device status icon
  const getDeviceStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <div className="flex items-center text-green-600" title="Active"><CheckCircle2 className="h-8 w-8" /></div>;
      case "inactive":
        return <div className="flex items-center text-red-600" title="Inactive"><XCircle className="h-8 w-8" /></div>;
      case "maintenance":
        return <div className="flex items-center text-orange-600" title="Maintenance"><AlertCircle className="h-8 w-8" /></div>;
      default:
        return <div className="flex items-center text-gray-600" title={status}><AlertCircle className="h-8 w-8" /></div>;
    }
  };

  // Helper function to get role display name
  const getRoleDisplayName = (role: Role) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Loading state
  if (isLoadingSites || isLoadingDevices || isLoadingUsers || isLoadingUser) {
    return (
      <DashboardLayout title="Hardware Inventory">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Hardware Inventory">
      {/* Debug Information */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>User ID:</strong> {user?.id}</div>
            <div><strong>Username:</strong> {user?.username}</div>
            <div><strong>Role:</strong> {user?.role}</div>
            <div><strong>Has manage_devices permission:</strong> {hasPermission('manage_devices') ? 'Yes' : 'No'}</div>
            <div><strong>Has view_devices permission:</strong> {hasPermission('view_devices') ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Hardware Inventory</h1>
        <div className="flex space-x-2">
          <Dialog open={siteDialogOpen} onOpenChange={setSiteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Building className="h-4 w-4 mr-2" />
                Add Site
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Site</DialogTitle>
                <DialogDescription>
                  Create a new site for your organization's infrastructure.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...siteForm}>
                <form onSubmit={siteForm.handleSubmit(handleCreateSite)} className="space-y-6">
                  <FormField
                    control={siteForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter site name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={siteForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select site type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="dr">Disaster Recovery</SelectItem>
                            <SelectItem value="branch">Branch Office</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={siteForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter site location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={siteForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter site description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">RACI Matrix Assignment</h3>
                    
                    {/* Responsible (R) */}
                    <div className="space-y-4">
                      <FormField
                        control={siteForm.control}
                        name="responsibleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsible (R) Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center">
                                    <UserCircle className="h-4 w-4 mr-2" />
                                    Individual User
                                  </div>
                                </SelectItem>
                                <SelectItem value="role">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Role Group
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={siteForm.control}
                        name="responsibleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsible (R)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select responsible person/role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {siteForm.watch("responsibleType") === "user" ? (
                                  users.map(user => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      <div className="flex items-center">
                                        <UserCircle className="h-4 w-4 mr-2" />
                                        {user.username}
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  roles.map(role => (
                                    <SelectItem key={role} value={role}>
                                      <div className="flex items-center">
                                        <Shield className="h-4 w-4 mr-2" />
                                        {getRoleDisplayName(role)}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Accountable (A) */}
                    <div className="space-y-4">
                      <FormField
                        control={siteForm.control}
                        name="accountableType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accountable (A) Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center">
                                    <UserCircle className="h-4 w-4 mr-2" />
                                    Individual User
                                  </div>
                                </SelectItem>
                                <SelectItem value="role">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Role Group
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={siteForm.control}
                        name="accountableId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accountable (A)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select accountable person/role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {siteForm.watch("accountableType") === "user" ? (
                                  users.map(user => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      <div className="flex items-center">
                                        <UserCircle className="h-4 w-4 mr-2" />
                                        {user.username}
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  roles.map(role => (
                                    <SelectItem key={role} value={role}>
                                      <div className="flex items-center">
                                        <Shield className="h-4 w-4 mr-2" />
                                        {getRoleDisplayName(role)}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Consulted (C) */}
                    <div className="space-y-4">
                      <FormField
                        control={siteForm.control}
                        name="consultedType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Consulted (C) Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center">
                                    <UserCircle className="h-4 w-4 mr-2" />
                                    Individual Users
                                  </div>
                                </SelectItem>
                                <SelectItem value="role">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Role Groups
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={siteForm.control}
                        name="consultedIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Consulted (C)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select people/roles to consult" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {siteForm.watch("consultedType") === "user" ? (
                                  users.map(user => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      <div className="flex items-center">
                                        <UserCircle className="h-4 w-4 mr-2" />
                                        {user.username}
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  roles.map(role => (
                                    <SelectItem key={role} value={role}>
                                      <div className="flex items-center">
                                        <Shield className="h-4 w-4 mr-2" />
                                        {getRoleDisplayName(role)}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Informed (I) */}
                    <div className="space-y-4">
                      <FormField
                        control={siteForm.control}
                        name="informedType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Informed (I) Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">
                                  <div className="flex items-center">
                                    <UserCircle className="h-4 w-4 mr-2" />
                                    Individual Users
                                  </div>
                                </SelectItem>
                                <SelectItem value="role">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Role Groups
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={siteForm.control}
                        name="informedIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Informed (I)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select people/roles to inform" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {siteForm.watch("informedType") === "user" ? (
                                  users.map(user => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      <div className="flex items-center">
                                        <UserCircle className="h-4 w-4 mr-2" />
                                        {user.username}
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  roles.map(role => (
                                    <SelectItem key={role} value={role}>
                                      <div className="flex items-center">
                                        <Shield className="h-4 w-4 mr-2" />
                                        {getRoleDisplayName(role)}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={siteForm.control}
                    name="securityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select security level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createSiteMutation.isPending}>
                      {createSiteMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Site
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Server className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{editingDevice ? 'Edit Device' : 'Add New Device'}</DialogTitle>
                <DialogDescription>
                  {editingDevice ? 'Update device information.' : 'Register a new device in your infrastructure inventory.'}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...deviceForm}>
                <form onSubmit={deviceForm.handleSubmit(handleSubmitDevice)} className="space-y-6">
                  <FormField
                    control={deviceForm.control}
                    name="siteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a site" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sites?.map(site => (
                              <SelectItem key={site.id} value={site.id.toString()}>
                                {site.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={deviceForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter device name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={deviceForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select device type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="server">Server</SelectItem>
                            <SelectItem value="network">Network Device</SelectItem>
                            <SelectItem value="storage">Storage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={deviceForm.control}
                      name="ipAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IP Address</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 192.168.1.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={deviceForm.control}
                      name="vlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VLAN</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. VLAN10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={deviceForm.control}
                    name="operatingSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating System</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ubuntu 22.04 LTS" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={deviceForm.control}
                    name="services"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Services</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Web, Database, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={deviceForm.control}
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
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createDeviceMutation.isPending || updateDeviceMutation.isPending}
                    >
                      {(createDeviceMutation.isPending || updateDeviceMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingDevice ? 'Update Device' : 'Create Device'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
        <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sites">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Responsible (R)</TableHead>
                    <TableHead>Accountable (A)</TableHead>
                    <TableHead>Security Level</TableHead>
                    <TableHead>Device Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites && sites.length > 0 ? (
                    sites.map((site) => {
                      const siteDevices = devices?.filter(d => d.siteId === site.id) || [];
                      const responsibleDisplay = site.responsibleType === "user" 
                        ? users.find(u => u.id.toString() === site.responsibleId)?.username 
                        : getRoleDisplayName(site.responsibleId as Role);
                      const accountableDisplay = site.accountableType === "user"
                        ? users.find(u => u.id.toString() === site.accountableId)?.username
                        : getRoleDisplayName(site.accountableId as Role);
                      
                      return (
                        <TableRow key={site.id}>
                          <TableCell className="font-medium">{site.id}</TableCell>
                          <TableCell>{site.name}</TableCell>
                          <TableCell>{getSiteTypeBadge(site.type)}</TableCell>
                          <TableCell>{site.location || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {site.responsibleType === "user" ? (
                                <UserCircle className="h-4 w-4 mr-2" />
                              ) : (
                                <Shield className="h-4 w-4 mr-2" />
                              )}
                              {responsibleDisplay || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {site.accountableType === "user" ? (
                                <UserCircle className="h-4 w-4 mr-2" />
                              ) : (
                                <Shield className="h-4 w-4 mr-2" />
                              )}
                              {accountableDisplay || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={site.securityLevel === "critical" ? "destructive" : "default"}>
                              {site.securityLevel?.toUpperCase() || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>{siteDevices.length}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No sites found. Add your first site to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="devices">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="w-[50px]">Status</TableHead>
                    {hasPermission('manage_devices') && <TableHead className="w-[70px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices && devices.length > 0 ? (
                    devices.map((device) => {
                      const site = sites?.find(s => s.id === device.siteId);
                      
                      return (
                        <TableRow key={device.id}>
                          <TableCell className="font-medium">{device.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getDeviceTypeIcon(device.type)}
                              <span className="ml-2">{device.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{device.type.charAt(0).toUpperCase() + device.type.slice(1)}</TableCell>
                          <TableCell>{site?.name || `Site ${device.siteId}`}</TableCell>
                          <TableCell>{device.ipAddress || "-"}</TableCell>
                          <TableCell>{getDeviceStatusIcon(device.status)}</TableCell>
                          {hasPermission('manage_devices') && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditDevice(device)}
                                className="h-8 w-8"
                                title="Edit Device"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={hasPermission('manage_devices') ? 7 : 6} className="text-center py-4">
                        No devices found. Add your first device to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

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
import { Loader2, Plus, Server, Network, HardDrive, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Site, Device, insertSiteSchema, insertDeviceSchema } from "@shared/schema";

export default function HardwareInventory() {
  const [activeTab, setActiveTab] = useState<string>("sites");
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch sites and devices
  const { data: sites, isLoading: isLoadingSites } = useQuery<Site[]>({
    queryKey: ['/api/sites']
  });

  const { data: devices, isLoading: isLoadingDevices } = useQuery<Device[]>({
    queryKey: ['/api/devices']
  });

  // Site form schema
  const siteFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    location: z.string().optional(),
    description: z.string().optional(),
  });

  const siteForm = useForm<z.infer<typeof siteFormSchema>>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: "",
      type: "primary",
      location: "",
      description: "",
    },
  });

  // Device form schema
  const deviceFormSchema = z.object({
    siteId: z.string().transform(val => parseInt(val)),
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

  const handleCreateSite = (data: z.infer<typeof siteFormSchema>) => {
    createSiteMutation.mutate(data);
  };

  const handleCreateDevice = (data: z.infer<typeof deviceFormSchema>) => {
    createDeviceMutation.mutate(data);
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

  // Device status badge
  const getDeviceStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success-100 text-success-800">Active</Badge>;
      case "inactive":
        return <Badge className="bg-error-100 text-error-800">Inactive</Badge>;
      case "maintenance":
        return <Badge className="bg-warning-100 text-warning-800">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Loading state
  if (isLoadingSites || isLoadingDevices) {
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
                <DialogTitle>Add New Device</DialogTitle>
                <DialogDescription>
                  Register a new device in your infrastructure inventory.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...deviceForm}>
                <form onSubmit={deviceForm.handleSubmit(handleCreateDevice)} className="space-y-6">
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
                    <Button type="submit" disabled={createDeviceMutation.isPending}>
                      {createDeviceMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Device
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
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
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
                    <TableHead>Description</TableHead>
                    <TableHead>Device Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites && sites.length > 0 ? (
                    sites.map((site) => {
                      const siteDevices = devices?.filter(d => d.siteId === site.id) || [];
                      
                      return (
                        <TableRow key={site.id}>
                          <TableCell className="font-medium">{site.id}</TableCell>
                          <TableCell>{site.name}</TableCell>
                          <TableCell>{getSiteTypeBadge(site.type)}</TableCell>
                          <TableCell>{site.location || "-"}</TableCell>
                          <TableCell>{site.description || "-"}</TableCell>
                          <TableCell>{siteDevices.length}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
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
                    <TableHead>Operating System</TableHead>
                    <TableHead>Status</TableHead>
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
                          <TableCell>{device.operatingSystem || "-"}</TableCell>
                          <TableCell>{getDeviceStatusBadge(device.status)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
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

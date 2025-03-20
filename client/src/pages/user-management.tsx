import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, UserPlus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";

export default function UserManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();

  // Check permissions
  const canManageUsers = hasPermission('manage_users');
  const canChangeRoles = hasPermission('change_roles');
  const canEditUserInfo = hasPermission('edit_user_info');
  const canViewUsers = hasPermission('view_users');

  // Debug permissions
  console.log('Current user role:', currentUser?.role);
  console.log('Can edit user info:', canEditUserInfo);

  // Fetch users
  const { data: users, isLoading, refetch } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: canViewUsers,
    gcTime: 0,      // Don't keep unused data in cache
    refetchOnMount: true  // Always refetch on mount
  });

  // User form schema
  const userFormSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email"),
    role: z.string().min(1, "Role is required"),
  });

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: "user",
    },
  });

  const editForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      role: "user",
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userFormSchema>) => {
      if (!canManageUsers) {
        throw new Error("You don't have permission to create users");
      }
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "User Created",
        description: "The user has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create User",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userFormSchema> & { id: number }) => {
      const { id, ...userData } = data;
      
      // Check role change permission
      if (userData.role && selectedUser?.role !== userData.role && !canChangeRoles) {
        throw new Error("You don't have permission to change user roles");
      }

      // Check general edit permission
      if (!canEditUserInfo) {
        throw new Error("You don't have permission to edit user information");
      }

      try {
        const res = await apiRequest("PUT", `/api/users/${id}`, userData);
        if (!res.ok) {
          const errorData = await res.text();
          console.error('Update user error response:', errorData);
          throw new Error(`Failed to update user: ${res.status} ${res.statusText}`);
        }
        return res.json();
      } catch (error) {
        console.error('Update user error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditDialogOpen(false);
      editForm.reset();
      setSelectedUser(null);
      toast({
        title: "User Updated",
        description: "The user has been successfully updated.",
      });
    },
    onError: (error: any) => {
      console.error('Update user mutation error:', error);
      toast({
        title: "Failed to Update User",
        description: error.message || "An error occurred while updating the user",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (data: z.infer<typeof userFormSchema>) => {
    createUserMutation.mutate(data);
  };

  const handleEditUser = (data: z.infer<typeof userFormSchema>) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ ...data, id: selectedUser.id });
  };

  const handleOpenEditDialog = (user: User) => {
    if (!canEditUserInfo) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit user information",
        variant: "destructive",
      });
      return;
    }
    setSelectedUser(user);
    editForm.reset({
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  // Role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-error-100 text-error-800";
      case "ciso":
      case "cto":
        return "bg-purple-100 text-purple-800";
      case "security_manager":
        return "bg-amber-100 text-amber-800";
      case "network_engineer":
        return "bg-blue-100 text-blue-800";
      case "approver":
        return "bg-warning-100 text-warning-800";
      case "implementer":
        return "bg-info-100 text-info-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout title="User Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!canViewUsers) {
    return (
      <DashboardLayout title="User Management">
        <div className="flex items-center justify-center h-64">
          <p className="text-error-600">You don't have permission to view users.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management">
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <p>Current Role: {currentUser?.role || 'Not logged in'}</p>
        <p>Can Edit Users: {canEditUserInfo ? 'Yes' : 'No'}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            refetch();
          }}
          className="mt-2"
        >
          Refresh User Data
        </Button>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <div className="flex space-x-2">
          {canManageUsers && (
            <>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system. All users will have access based on their assigned role.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="approver">Approver</SelectItem>
                                <SelectItem value="implementer">Implementer</SelectItem>
                                {canChangeRoles && (
                                  <>
                                    <SelectItem value="security_manager">Security Manager</SelectItem>
                                    <SelectItem value="network_engineer">Network Engineer</SelectItem>
                                    <SelectItem value="ciso">CISO</SelectItem>
                                    <SelectItem value="cto">CTO</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit" disabled={createUserMutation.isPending}>
                          {createUserMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create User
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                      Update user information. Leave password blank to keep the current password.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-6">
                      <FormField
                        control={editForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password (Optional)</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Leave blank to keep current password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={!canChangeRoles}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="approver">Approver</SelectItem>
                                <SelectItem value="implementer">Implementer</SelectItem>
                                {canChangeRoles && (
                                  <>
                                    <SelectItem value="security_manager">Security Manager</SelectItem>
                                    <SelectItem value="network_engineer">Network Engineer</SelectItem>
                                    <SelectItem value="ciso">CISO</SelectItem>
                                    <SelectItem value="cto">CTO</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            {!canChangeRoles && (
                              <p className="text-sm text-muted-foreground">
                                Only administrators can change user roles
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit" disabled={updateUserMutation.isPending}>
                          {updateUserMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Update User
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canEditUserInfo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditDialog(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

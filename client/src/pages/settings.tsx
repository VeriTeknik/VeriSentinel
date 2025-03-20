import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, User, BellRing, Shield, Globe, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const { toast } = useToast();
  const { user } = useAuth();

  // Form schemas
  const profileFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email"),
    avatar: z.string().optional(),
  });

  const securityFormSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const notificationFormSchema = z.object({
    emailNotifications: z.boolean(),
    securityAlerts: z.boolean(),
    complianceReminders: z.boolean(),
    taskReminders: z.boolean(),
  });

  // Forms
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    },
  });

  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      securityAlerts: true,
      complianceReminders: true,
      taskReminders: true,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // Placeholder
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Profile",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      // Placeholder
      return { success: true };
    },
    onSuccess: () => {
      securityForm.reset();
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Change Password",
        description: error.message || "An error occurred while changing your password.",
        variant: "destructive",
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async () => {
      // Placeholder
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Notification Settings",
        description: error.message || "An error occurred while updating your notification preferences.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate();
  };

  const handleChangePassword = (data: z.infer<typeof securityFormSchema>) => {
    changePasswordMutation.mutate();
  };

  const handleUpdateNotifications = (data: z.infer<typeof notificationFormSchema>) => {
    updateNotificationsMutation.mutate();
  };

  return (
    <DashboardLayout title="Settings">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex flex-col items-start space-y-1">
              <button 
                onClick={() => setActiveTab("profile")} 
                className={`w-full justify-start px-2 py-1.5 flex items-center text-left ${activeTab === "profile" ? "bg-gray-100 font-medium" : ""} rounded hover:bg-gray-50`}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </button>
              <button 
                onClick={() => setActiveTab("security")} 
                className={`w-full justify-start px-2 py-1.5 flex items-center text-left ${activeTab === "security" ? "bg-gray-100 font-medium" : ""} rounded hover:bg-gray-50`}
              >
                <Shield className="h-4 w-4 mr-2" />
                Security
              </button>
              <button 
                onClick={() => setActiveTab("notifications")} 
                className={`w-full justify-start px-2 py-1.5 flex items-center text-left ${activeTab === "notifications" ? "bg-gray-100 font-medium" : ""} rounded hover:bg-gray-50`}
              >
                <BellRing className="h-4 w-4 mr-2" />
                Notifications
              </button>
              <button 
                onClick={() => setActiveTab("about")} 
                className={`w-full justify-start px-2 py-1.5 flex items-center text-left ${activeTab === "about" ? "bg-gray-100 font-medium" : ""} rounded hover:bg-gray-50`}
              >
                <Globe className="h-4 w-4 mr-2" />
                About
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Main content */}
        <div className="col-span-1 md:col-span-3">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(handleChangePassword)} className="space-y-6">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your current password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Change Password
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not yet available</AlertTitle>
                    <AlertDescription>
                      Two-factor authentication will be available in a future update.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(handleUpdateNotifications)} className="space-y-6">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormDescription>
                              Receive email notifications for important updates
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="securityAlerts"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Security Alerts</FormLabel>
                            <FormDescription>
                              Receive notifications for security-related events
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="complianceReminders"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Compliance Reminders</FormLabel>
                            <FormDescription>
                              Receive reminders for upcoming compliance deadlines
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="taskReminders"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Task Reminders</FormLabel>
                            <FormDescription>
                              Receive reminders for assigned tasks and deadlines
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateNotificationsMutation.isPending}
                      >
                        {updateNotificationsMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Preferences
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === "about" && (
            <Card>
              <CardHeader>
                <CardTitle>About Verisentinel</CardTitle>
                <CardDescription>Information about the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Version</h3>
                  <p className="text-gray-600">1.0.0</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Description</h3>
                  <p className="text-gray-600">
                    Verisentinel is an open-source, monolithic compliance and infrastructure monitoring tool 
                    designed for small to medium organizations. It integrates core requirements from PCI DSS, 
                    ISO 27001, and select controls from other standards into a unified compliance framework.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Features</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                    <li>Integrated compliance framework with risk-based severity mapping</li>
                    <li>Hardware inventory and network topology visualization</li>
                    <li>Change management workflow for critical changes</li>
                    <li>Task management with notifications and deadlines</li>
                    <li>Robust security with RBAC and audit logging</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">License</h3>
                  <p className="text-gray-600">Open Source (MIT)</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => window.open("https://github.com/organization/verisentinel", "_blank")}>
                  View Source Code
                </Button>
                <Button variant="outline" onClick={() => window.open("https://github.com/organization/verisentinel/issues", "_blank")}>
                  Report an Issue
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
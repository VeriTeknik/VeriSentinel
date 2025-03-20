import { Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import Compliance from "@/pages/compliance";
import HardwareInventory from "@/pages/hardware-inventory";
import NetworkTopologyWrapper from "@/pages/network-topology-wrapper";
import ChangeManagement from "@/pages/change-management";
import Tasks from "@/pages/tasks";
import UserManagement from "@/pages/user-management";
import Settings from "@/pages/settings";
import AuditLogs from "@/pages/audit-logs";
import { Route } from "wouter";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/compliance" component={Compliance} />
      <ProtectedRoute path="/hardware-inventory" component={HardwareInventory} />
      <ProtectedRoute path="/network-topology" component={NetworkTopologyWrapper} />
      <ProtectedRoute path="/change-management" component={ChangeManagement} />
      <ProtectedRoute path="/tasks" component={Tasks} />
      <ProtectedRoute path="/user-management" component={UserManagement} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/audit-logs" component={AuditLogs} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

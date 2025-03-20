import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Shield, 
  Server, 
  Network, 
  FileEdit, 
  Clipboard, 
  Users, 
  Settings, 
  LogOut
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { path: "/compliance", label: "Compliance", icon: <Shield className="h-5 w-5 mr-3" /> },
    { path: "/hardware-inventory", label: "Hardware Inventory", icon: <Server className="h-5 w-5 mr-3" /> },
    { path: "/network-topology", label: "Network Topology", icon: <Network className="h-5 w-5 mr-3" /> },
    { path: "/change-management", label: "Change Management", icon: <FileEdit className="h-5 w-5 mr-3" /> },
    { path: "/tasks", label: "Tasks", icon: <Clipboard className="h-5 w-5 mr-3" /> },
    { path: "/user-management", label: "User Management", icon: <Users className="h-5 w-5 mr-3" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  return (
    <div className="w-64 bg-gray-900 flex-shrink-0 hidden md:flex flex-col h-screen shadow-lg z-10">
      <div className="p-4 flex-1">
        <div className="flex items-center space-x-2 mb-6">
          <svg className="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="text-white font-bold text-lg">Verisentinel</h1>
        </div>
        
        <div className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center px-4 py-2 rounded-md cursor-pointer ${
                location === item.path 
                  ? "bg-gray-800 text-white" 
                  : "text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              }`}>
                {item.icon}
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary-700 text-white flex items-center justify-center mr-3">
            {user?.name ? user.name.charAt(0) : (user?.username ? user.username.charAt(0) : 'U')}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name || user?.username || 'User'}</p>
            <p className="text-xs text-gray-400">{user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'User'}</p>
          </div>
          <div className="ml-auto">
            <button onClick={handleLogout} className="text-gray-400 hover:text-white">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

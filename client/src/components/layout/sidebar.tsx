import { useLocation } from "wouter";
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
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: "/compliance", label: "Compliance", icon: <Shield className="h-5 w-5" /> },
    { path: "/hardware-inventory", label: "Hardware Inventory", icon: <Server className="h-5 w-5" /> },
    { path: "/network-topology", label: "Network Topology", icon: <Network className="h-5 w-5" /> },
    { path: "/change-management", label: "Change Management", icon: <FileEdit className="h-5 w-5" /> },
    { path: "/tasks", label: "Tasks", icon: <Clipboard className="h-5 w-5" /> },
    { path: "/user-management", label: "User Management", icon: <Users className="h-5 w-5" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <div 
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } flex-shrink-0 hidden md:flex flex-col h-screen shadow-lg z-10 relative transition-all duration-300`}
      style={{ backgroundColor: 'oklch(55% 0.065 350)' }}
    >
      <div
        onClick={toggleSidebar}
        className="absolute right-0 top-6 -translate-x-1/2 rounded-full p-1.5 text-white hover:text-gray-100 transition-colors border border-white/20 cursor-pointer"
        style={{ backgroundColor: 'oklch(70% 0.1 350)' }}
      >
        {isCollapsed ? 
          <ChevronRight className="h-4 w-4 stroke-current" /> : 
          <ChevronLeft className="h-4 w-4 stroke-current" />
        }
      </div>

      <div className="p-4 flex-1">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-2"} mb-6`}>
          <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && <h1 className="text-white font-bold text-lg">Verisentinel</h1>}
        </div>
        
        <div className="mt-8 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center ${
                isCollapsed ? "justify-center px-2" : "px-4"
              } py-2 rounded-md cursor-pointer w-full ${
                isCollapsed ? "" : "text-left"
              } ${
                location === item.path 
                  ? "bg-white/10 text-white" 
                  : "text-white hover:bg-white/10 hover:text-white transition-colors"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className={isCollapsed ? "" : "mr-3"}>{item.icon}</div>
              {!isCollapsed && item.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-white/10">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : ""}`}>
          <div className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center">
            {user?.name ? user.name.charAt(0) : (user?.username ? user.username.charAt(0) : 'U')}
          </div>
          {!isCollapsed && (
            <>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name || user?.username || 'User'}</p>
                <p className="text-xs text-white/70">{user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'User'}</p>
              </div>
              <div className="ml-auto">
                <button onClick={handleLogout} className="text-white hover:text-gray-100">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

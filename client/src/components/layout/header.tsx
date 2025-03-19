import { Bell, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const [location] = useLocation();
  
  // Get page title based on current location if not provided
  const pageTitle = title || (() => {
    switch (location) {
      case '/':
        return 'Dashboard';
      case '/compliance':
        return 'Compliance';
      case '/hardware-inventory':
        return 'Hardware Inventory';
      case '/network-topology':
        return 'Network Topology';
      case '/change-management':
        return 'Change Management';
      case '/tasks':
        return 'Tasks';
      case '/user-management':
        return 'User Management';
      case '/settings':
        return 'Settings';
      default:
        return 'Verisentinel';
    }
  })();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
        <div className="flex items-center space-x-4">
          <button className="bg-white p-1.5 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <Bell className="h-6 w-6" />
          </button>
          <button className="bg-white p-1.5 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <Calendar className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;

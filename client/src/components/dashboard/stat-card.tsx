import { ReactNode, useCallback } from 'react';
import { useLocation } from 'wouter';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  linkUrl: string;
  iconBgColor: string;
  iconColor: string;
}

export function StatCard({
  title,
  value,
  icon,
  linkUrl,
  iconBgColor,
  iconColor,
}: StatCardProps) {
  const [, setLocation] = useLocation();
  
  const handleNavigation = useCallback(() => {
    setLocation(linkUrl);
  }, [linkUrl, setLocation]);
  
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <button 
            onClick={handleNavigation} 
            className="font-medium text-primary-600 hover:text-primary-700 cursor-pointer bg-transparent border-none p-0"
          >
            View details
          </button>
        </div>
      </div>
    </div>
  );
}

export default StatCard;

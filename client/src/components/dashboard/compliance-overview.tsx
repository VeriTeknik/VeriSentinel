import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ComplianceFramework, ComplianceControl } from '@shared/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export function ComplianceOverview() {
  const [selectedFramework, setSelectedFramework] = useState<string>("all");
  const [_, navigate] = useLocation();
  
  const { data: frameworks, isLoading: isLoadingFrameworks } = useQuery<ComplianceFramework[]>({ 
    queryKey: ['/api/compliance-frameworks'] 
  });
  
  const { data: controls, isLoading: isLoadingControls } = useQuery<ComplianceControl[]>({ 
    queryKey: ['/api/compliance-controls'] 
  });

  if (isLoadingFrameworks || isLoadingControls) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8 text-center animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  // Group controls by framework
  const controlsByFramework = controls?.reduce((acc, control) => {
    const frameworkId = control.frameworkId;
    if (!acc[frameworkId]) {
      acc[frameworkId] = [];
    }
    acc[frameworkId].push(control);
    return acc;
  }, {} as Record<number, ComplianceControl[]>) || {};

  // Calculate compliance percentages for each framework
  const complianceStats = frameworks?.map(framework => {
    const frameworkControls = controlsByFramework[framework.id] || [];
    const totalControls = frameworkControls.length;
    const compliantControls = frameworkControls.filter(c => c.status === 'compliant').length;
    const percentage = totalControls > 0 ? Math.round((compliantControls / totalControls) * 100) : 0;
    
    return {
      id: framework.id,
      name: framework.name,
      percentage,
      compliantControls,
      totalControls
    };
  }) || [];

  // Calculate risk severity distribution
  const highRiskControls = controls?.filter(c => c.severity === 'high').length || 0;
  const mediumRiskControls = controls?.filter(c => c.severity === 'medium').length || 0;
  const lowRiskControls = controls?.filter(c => c.severity === 'low').length || 0;

  // Get color class based on percentage
  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return "bg-primary-500";
    if (percentage >= 60) return "bg-warning-500";
    return "bg-error-500";
  };

  // Get text color class based on percentage
  const getTextColorClass = (percentage: number) => {
    if (percentage >= 80) return "bg-primary-100 text-primary-800";
    if (percentage >= 60) return "bg-warning-100 text-warning-800";
    return "bg-error-100 text-error-800";
  };

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Compliance Overview</h2>
          <div className="flex space-x-2">
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="All Frameworks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                {frameworks?.map(framework => (
                  <SelectItem key={framework.id} value={framework.id.toString()}>
                    {framework.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="p-5">
        {/* Compliance Progress Bars */}
        <div className="space-y-4">
          {complianceStats.filter(stat => 
            selectedFramework === "all" || stat.id.toString() === selectedFramework
          ).map(stat => (
            <div key={stat.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <span className="font-medium text-sm">{stat.name}</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getTextColorClass(stat.percentage)}`}>
                    {stat.percentage}%
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {stat.compliantControls}/{stat.totalControls} controls
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`${getColorClass(stat.percentage)} h-2.5 rounded-full`} style={{ width: `${stat.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Severity Distribution */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Risk Severity Distribution</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-100 p-3 rounded-md text-center">
              <div className="text-xl font-semibold text-error-600 mb-1">{highRiskControls}</div>
              <div className="text-xs text-gray-500">High</div>
            </div>
            <div className="flex-1 bg-gray-100 p-3 rounded-md text-center">
              <div className="text-xl font-semibold text-warning-600 mb-1">{mediumRiskControls}</div>
              <div className="text-xs text-gray-500">Medium</div>
            </div>
            <div className="flex-1 bg-gray-100 p-3 rounded-md text-center">
              <div className="text-xl font-semibold text-success-600 mb-1">{lowRiskControls}</div>
              <div className="text-xs text-gray-500">Low</div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <button 
          onClick={() => navigate('/compliance')} 
          className="text-sm font-medium text-primary-600 hover:text-primary-700 border-none bg-transparent p-0"
        >
          View all compliance controls →
        </button>
      </div>
    </div>
  );
}

export default ComplianceOverview;

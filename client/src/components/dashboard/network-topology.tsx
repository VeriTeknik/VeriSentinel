import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Filter, Download } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface TopologyNode {
  id: number;
  name: string;
  type: string;
  devices?: DeviceNode[];
}

interface DeviceNode {
  id: number;
  name: string;
  type: string;
  status: string;
  ipAddress?: string;
}

export function NetworkTopology() {
  const { data: topology, isLoading } = useQuery<TopologyNode[]>({ 
    queryKey: ['/api/topology'] 
  });

  const svgRef = useRef<SVGSVGElement>(null);

  // Simple network topology visualization
  // In a real implementation, this would use D3.js for more interactive visualization
  
  const handleNodeClick = (nodeId: number) => {
    console.log(`Node clicked: ${nodeId}`);
    // Here you would handle node click to show details, etc.
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8 text-center animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-64 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Network Topology</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>
      <div className="p-5">
        {/* Network Topology Visualization */}
        <div className="w-full h-64 bg-gray-50 border border-gray-200 rounded-lg relative overflow-hidden">
          <svg width="100%" height="100%" viewBox="0 0 800 400" className="p-2" ref={svgRef}>
            {/* Internet Cloud */}
            <ellipse cx="400" cy="50" rx="120" ry="40" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" className="device-node" />
            <text x="400" y="55" textAnchor="middle" className="text-sm font-medium">Internet</text>
            
            {/* Firewall */}
            <rect x="370" y="100" width="60" height="40" rx="5" fill="#FEF3C7" stroke="#FF832B" strokeWidth="2" className="device-node" onClick={() => handleNodeClick(1)} />
            <text x="400" y="124" textAnchor="middle" className="text-xs font-medium">Firewall</text>
            
            {/* Lines from Internet to Firewall */}
            <line x1="400" y1="70" x2="400" y2="100" stroke="#9CA3AF" strokeWidth="2" />
            
            {/* Router */}
            <rect x="370" y="170" width="60" height="40" rx="5" fill="#D1FAE5" stroke="#42BE65" strokeWidth="2" className="device-node" onClick={() => handleNodeClick(2)} />
            <text x="400" y="194" textAnchor="middle" className="text-xs font-medium">Router</text>
            
            {/* Line from Firewall to Router */}
            <line x1="400" y1="140" x2="400" y2="170" stroke="#9CA3AF" strokeWidth="2" />
            
            {/* Switch 1 */}
            <rect x="250" y="240" width="60" height="40" rx="5" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2" className="device-node" onClick={() => handleNodeClick(3)} />
            <text x="280" y="264" textAnchor="middle" className="text-xs font-medium">Switch 1</text>
            
            {/* Switch 2 */}
            <rect x="370" y="240" width="60" height="40" rx="5" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2" className="device-node" onClick={() => handleNodeClick(4)} />
            <text x="400" y="264" textAnchor="middle" className="text-xs font-medium">Switch 2</text>
            
            {/* Switch 3 */}
            <rect x="490" y="240" width="60" height="40" rx="5" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2" className="device-node" onClick={() => handleNodeClick(5)} />
            <text x="520" y="264" textAnchor="middle" className="text-xs font-medium">Switch 3</text>
            
            {/* Lines from Router to Switches */}
            <line x1="400" y1="210" x2="280" y2="240" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="400" y1="210" x2="400" y2="240" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="400" y1="210" x2="520" y2="240" stroke="#9CA3AF" strokeWidth="2" />
            
            {/* Servers */}
            <rect x="220" y="320" width="50" height="40" rx="5" fill="#FEE2E2" stroke="#FF0000" strokeWidth="2" className="device-node" onClick={() => handleNodeClick(6)} />
            <text x="245" y="344" textAnchor="middle" className="text-xs font-medium">DB</text>
            
            <rect x="280" y="320" width="50" height="40" rx="5" fill="#CCE0FF" stroke="#0F62FE" strokeWidth="2" className="device-node" onClick={() => handleNodeClick(7)} />
            <text x="305" y="344" textAnchor="middle" className="text-xs font-medium">Web</text>
            
            <rect x="375" y="320" width="50" height="40" rx="5" fill="#CCE0FF" stroke="#0F62FE" strokeWidth="2" className="device-node" onClick={() => handleNodeClick(8)} />
            <text x="400" y="344" textAnchor="middle" className="text-xs font-medium">App</text>
            
            <rect x="490" y="320" width="50" height="40" rx="5" fill="#FEF3C7" stroke="#FF832B" strokeWidth="2" className="device-node" onClick={() => handleNodeClick(9)} />
            <text x="515" y="344" textAnchor="middle" className="text-xs font-medium">Auth</text>
            
            <rect x="550" y="320" width="50" height="40" rx="5" fill="#D1FAE5" stroke="#42BE65" strokeWidth="2" className="device-node" onClick={() => handleNodeClick(10)} />
            <text x="575" y="344" textAnchor="middle" className="text-xs font-medium">Log</text>
            
            {/* Lines from Switches to Servers */}
            <line x1="280" y1="280" x2="245" y2="320" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="280" y1="280" x2="305" y2="320" stroke="#9CA3AF" strokeWidth="2" />
            
            <line x1="400" y1="280" x2="400" y2="320" stroke="#9CA3AF" strokeWidth="2" />
            
            <line x1="520" y1="280" x2="515" y2="320" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="520" y1="280" x2="575" y2="320" stroke="#9CA3AF" strokeWidth="2" />
            
            {/* Risk Indicators */}
            <circle cx="245" cy="315" r="10" fill="#FF0000" className="animate-pulse" opacity="0.6" />
            <circle cx="515" cy="315" r="8" fill="#FF832B" className="animate-pulse" opacity="0.6" />
          </svg>
          
          {/* Legend */}
          <div className="absolute bottom-2 right-2 bg-white p-2 rounded-md border border-gray-200 text-xs shadow-sm">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>High Risk</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span>Medium Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Low Risk</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <Link href="/network-topology">
          <a className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View full network topology →
          </a>
        </Link>
      </div>
    </div>
  );
}

export default NetworkTopology;

import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
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
  parentDeviceId?: number | null;
  siteId: number;
}

export function NetworkTopology() {
  const { data: topology, isLoading } = useQuery<TopologyNode[]>({ 
    queryKey: ['/api/topology'] 
  });
  
  const { data: devices, isLoading: isLoadingDevices } = useQuery<DeviceNode[]>({
    queryKey: ['/api/devices']
  });

  const svgRef = useRef<SVGSVGElement>(null);
  
  const handleNodeClick = (device: DeviceNode) => {
    console.log(`Device clicked:`, device);
    
    // Find parent and child relationships
    const parentDevice = device.parentDeviceId ? 
      devices?.find(d => d.id === device.parentDeviceId) : undefined;
    
    const childDevices = devices?.filter(d => 
      d.parentDeviceId === device.id
    ) || [];
    
    // Log hierarchical relationships for this device
    console.log('Hierarchical information:');
    console.log('Parent device:', parentDevice || 'None (top-level device)');
    console.log('Child devices:', childDevices.length > 0 ? childDevices : 'None (leaf device)');
    
    // In full implementation, show device details in modal/drawer with relationship information
  };

  if (isLoading || isLoadingDevices) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8 text-center animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-64 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }
  
  // Get network devices (firewall, switch, router types)
  const networkDevices = devices?.filter(d => 
    d.type === 'firewall' || d.type === 'switch' || d.type === 'router'
  ) || [];
  
  // Get server devices
  const serverDevices = devices?.filter(d => d.type === 'server') || [];

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
            
            {/* Dynamic Network Devices */}
            {networkDevices.slice(0, 5).map((device, index) => {
              // Calculate positions based on index
              let x = 370;
              let y = 100 + (index * 70);
              
              if (index > 0) {
                // Offset switches to show network structure
                if (index === 1) {
                  x = 370; // Router in center
                  y = 170;
                } else if (index === 2) {
                  x = 250; // Left switch
                  y = 240;
                } else if (index === 3) {
                  x = 370; // Middle switch
                  y = 240; 
                } else if (index === 4) {
                  x = 490; // Right switch
                  y = 240;
                }
              }
              
              // Determine color based on device type
              let fill = "#FEF3C7"; // Default - orange for firewall
              let stroke = "#FF832B";
              
              if (device.type === "router") {
                fill = "#D1FAE5"; // Green for router
                stroke = "#42BE65";
              } else if (device.type === "switch") {
                fill = "#E0E7FF"; // Blue for switch
                stroke = "#6366F1";
              }
              
              return (
                <g key={`network-${device.id}`}>
                  <rect 
                    x={x} 
                    y={y} 
                    width={60} 
                    height={40} 
                    rx={5} 
                    fill={fill} 
                    stroke={stroke} 
                    strokeWidth={2} 
                    className="device-node" 
                    onClick={() => handleNodeClick(device)} 
                  />
                  <text 
                    x={x + 30} 
                    y={y + 24} 
                    textAnchor="middle" 
                    className="text-xs font-medium"
                  >
                    {device.name.length > 10 ? device.name.substring(0, 8) + '...' : device.name}
                  </text>
                </g>
              );
            })}
            
            {/* Lines for connections */}
            <line x1="400" y1="70" x2="400" y2="100" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="400" y1="140" x2="400" y2="170" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="400" y1="210" x2="280" y2="240" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="400" y1="210" x2="400" y2="240" stroke="#9CA3AF" strokeWidth="2" />
            <line x1="400" y1="210" x2="520" y2="240" stroke="#9CA3AF" strokeWidth="2" />
            
            {/* Dynamic Server Devices */}
            {serverDevices.slice(0, 5).map((device, index) => {
              // Calculate positions based on index
              let x = 220 + (index * 85);
              if (index > 2) {
                x = 490 + ((index - 3) * 60); // Adjust for right side
              }
              const y = 320;
              
              // Determine color based on server type or status
              let fill = "#CCE0FF"; // Default blue for servers
              let stroke = "#0F62FE";
              
              if (device.status === "critical" || device.status === "down") {
                fill = "#FEE2E2"; // Red for critical servers
                stroke = "#FF0000";
              } else if (device.status === "warning") {
                fill = "#FEF3C7"; // Orange for warning
                stroke = "#FF832B";
              } else if (device.status === "secure" || device.status === "compliant") {
                fill = "#D1FAE5"; // Green for compliant/secure
                stroke = "#42BE65";
              }
              
              return (
                <g key={`server-${device.id}`}>
                  <rect 
                    x={x} 
                    y={y} 
                    width={50} 
                    height={40} 
                    rx={5} 
                    fill={fill} 
                    stroke={stroke} 
                    strokeWidth={2} 
                    className="device-node" 
                    onClick={() => handleNodeClick(device)} 
                  />
                  <text 
                    x={x + 25} 
                    y={y + 24} 
                    textAnchor="middle" 
                    className="text-xs font-medium"
                  >
                    {device.name.length > 6 ? device.name.substring(0, 4) + '...' : device.name}
                  </text>
                  
                  {/* Add risk indicator for critical/warning status */}
                  {(device.status === "critical" || device.status === "down") && (
                    <circle cx={x + 25} cy={y - 5} r={10} fill="#FF0000" className="animate-pulse" opacity={0.6} />
                  )}
                  {device.status === "warning" && (
                    <circle cx={x + 25} cy={y - 5} r={8} fill="#FF832B" className="animate-pulse" opacity={0.6} />
                  )}
                </g>
              );
            })}
            
            {/* Lines from Parent Devices to Child Devices - Using actual hierarchical relationships */}
            {serverDevices.slice(0, 5).map((device, index) => {
              // Skip devices without parent
              if (!device.parentDeviceId) return null;
              
              let serverX = 220 + (index * 85);
              if (index > 2) {
                serverX = 490 + ((index - 3) * 60);
              }
              const serverY = 320;
              
              // Find parent device - might be a switch or other network device
              const parentDevice = devices?.find(d => d.id === device.parentDeviceId);
              if (!parentDevice) return null;
              
              // Determine parent device position based on its type and our layout
              let parentX = 400; // Default center position
              let parentY = 170; // Default router position
              
              // Determine parent position based on type
              if (parentDevice.type === 'switch') {
                if (parentDevice.siteId === 1) {
                  // Primary site switches
                  parentX = 250;
                  parentY = 240;
                } else {
                  // DR site switches
                  parentX = 490;
                  parentY = 240;
                }
              } else if (parentDevice.type === 'firewall') {
                parentX = 400;
                parentY = 120;
              }
              
              // Special case for dashboard view, set positions based on parent type
              // to create a logical hierarchy visualization regardless of actual parent id
              if (parentDevice.type === 'switch') {
                // Position based on which side the server is on
                if (index < 3) {
                  parentX = 280; // Left switch
                } else {
                  parentX = 520; // Right switch
                }
                parentY = 280;
              }
              
              return (
                <line 
                  key={`line-${device.id}`} 
                  x1={parentX + 30} // Center of parent device
                  y1={parentY + 40} // Bottom of parent device
                  x2={serverX + 25} // Center of server
                  y2={serverY} // Top of server
                  stroke="#9CA3AF" 
                  strokeWidth={2}
                  strokeDasharray={device.status === 'critical' ? "5,5" : ""} // Dashed line for critical devices
                />
              );
            })}
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

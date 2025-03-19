import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Download, ZoomIn, ZoomOut, Info } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Site, Device } from "@shared/schema";

interface TopologyNode {
  id: number;
  name: string;
  type: string;
  devices?: Device[];
}

interface DeviceDetails {
  id: number;
  name: string;
  type: string;
  ipAddress: string | null;
  vlan: string | null;
  operatingSystem: string | null;
  services: string | null;
  status: string;
  siteId: number;
  siteName?: string;
}

export default function NetworkTopology() {
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceDetails | null>(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const { data: sites, isLoading: isLoadingSites } = useQuery<Site[]>({
    queryKey: ['/api/sites']
  });

  const { data: devices, isLoading: isLoadingDevices } = useQuery<Device[]>({
    queryKey: ['/api/devices']
  });

  const { data: topology, isLoading: isLoadingTopology } = useQuery<TopologyNode[]>({
    queryKey: ['/api/topology']
  });

  // Filter devices based on selections
  const filteredDevices = devices?.filter(device => {
    const siteMatch = selectedSite === "all" || device.siteId.toString() === selectedSite;
    const typeMatch = selectedDeviceType === "all" || device.type === selectedDeviceType;
    return siteMatch && typeMatch;
  });
  
  // Separate devices by type for visualization
  const networkDevices = filteredDevices?.filter(d => 
    d.type === 'firewall' || d.type === 'switch' || d.type === 'router'
  ) || [];
  
  // Get server devices
  const serverDevices = filteredDevices?.filter(d => d.type === 'server') || [];

  const handleDeviceClick = (device: Device) => {
    const site = sites?.find(s => s.id === device.siteId);
    
    setSelectedDevice({
      ...device,
      siteName: site?.name
    });
    
    setDetailsOpen(true);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const exportTopology = () => {
    if (svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'network-topology.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Loading state
  if (isLoadingSites || isLoadingDevices || isLoadingTopology) {
    return (
      <DashboardLayout title="Network Topology">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Network Topology">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Network Topology</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleZoomOut} disabled={zoom <= 0.5}>
            <ZoomOut className="h-4 w-4 mr-1" />
            Zoom Out
          </Button>
          <Button variant="outline" onClick={handleZoomIn} disabled={zoom >= 2}>
            <ZoomIn className="h-4 w-4 mr-1" />
            Zoom In
          </Button>
          <Button variant="outline" onClick={exportTopology}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="site-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Site
              </label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger id="site-filter">
                  <SelectValue placeholder="All Sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites?.map(site => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="device-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Device Type
              </label>
              <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
                <SelectTrigger id="device-type-filter">
                  <SelectValue placeholder="All Device Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Device Types</SelectItem>
                  <SelectItem value="server">Servers</SelectItem>
                  <SelectItem value="network">Network Devices</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="w-full h-[600px] bg-gray-50 border border-gray-200 rounded-lg relative overflow-hidden">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 800 600" 
              className="p-2" 
              ref={svgRef}
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'center', 
                transition: 'transform 0.3s ease' 
              }}
            >
              {/* Internet Cloud */}
              <ellipse cx="400" cy="50" rx="120" ry="40" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" className="device-node" />
              <text x="400" y="55" textAnchor="middle" className="text-sm font-medium">Internet</text>
              
              {/* Internet Connection Line with Interface Symbol */}
              <line x1="400" y1="90" x2="400" y2="115" stroke="#9CA3AF" strokeWidth="2" />
              <circle cx="400" cy="115" r="3" fill="#9CA3AF" /> {/* Interface point */}
              
              {/* Dynamic Network Infrastructure with Interfaces */}
              {networkDevices
                .filter(d => d.type === 'firewall')
                .map((device, index) => {
                  // Position at the top for firewall (between internet and internal network)
                  const x = 370;
                  const y = 120;
                  
                  return (
                    <g key={`firewall-${device.id}`}>
                      {/* Firewall device - special shape with multiple interfaces */}
                      <rect 
                        x={x} 
                        y={y} 
                        width={60} 
                        height={40} 
                        rx={5} 
                        fill="#FEF3C7" 
                        stroke="#FF832B" 
                        strokeWidth={2} 
                        className="device-node" 
                        onClick={() => handleDeviceClick(device)} 
                      />
                      
                      {/* Input interface at top */}
                      <circle cx={x + 30} cy={y} r={3} fill="#FF832B" />
                      
                      {/* Output interfaces at bottom */}
                      <circle cx={x + 20} cy={y + 40} r={3} fill="#FF832B" />
                      <circle cx={x + 40} cy={y + 40} r={3} fill="#FF832B" />
                      
                      {/* Interface labels */}
                      <text x={x + 40} y={y + 5} textAnchor="start" className="text-[8px]">WAN</text>
                      <text x={x + 15} y={y + 35} textAnchor="middle" className="text-[8px]">LAN1</text>
                      <text x={x + 45} y={y + 35} textAnchor="middle" className="text-[8px]">LAN2</text>
                      
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
              
              {/* Router Devices */}
              {networkDevices
                .filter(d => d.type === 'router')
                .map((device, index) => {
                  const x = 370;
                  const y = 190;
                  
                  return (
                    <g key={`router-${device.id}`}>
                      <rect 
                        x={x} 
                        y={y} 
                        width={60} 
                        height={40} 
                        rx={5} 
                        fill="#D1FAE5" 
                        stroke="#42BE65" 
                        strokeWidth={2} 
                        className="device-node" 
                        onClick={() => handleDeviceClick(device)} 
                      />
                      
                      {/* Input interface at top */}
                      <circle cx={x + 30} cy={y} r={3} fill="#42BE65" />
                      
                      {/* Output interfaces at left and right sides */}
                      <circle cx={x} cy={y + 20} r={3} fill="#42BE65" />
                      <circle cx={x + 60} cy={y + 20} r={3} fill="#42BE65" />
                      
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
              
              {/* Switch Devices */}
              {networkDevices
                .filter(d => d.type === 'switch')
                .map((device, index) => {
                  // Position switches based on their site
                  const site = sites?.find(s => s.id === device.siteId);
                  let x = 200; // Default primary site
                  let y = 320;
                  
                  if (site && site.id !== 1) {
                    // Secondary/DR site
                    x = 570;
                    y = 320;
                  }
                  
                  return (
                    <g key={`switch-${device.id}`}>
                      <rect 
                        x={x} 
                        y={y} 
                        width={60} 
                        height={40} 
                        rx={5} 
                        fill="#E0E7FF" 
                        stroke="#6366F1" 
                        strokeWidth={2} 
                        className="device-node" 
                        onClick={() => handleDeviceClick(device)} 
                      />
                      
                      {/* Input interface at top */}
                      <circle cx={x + 30} cy={y} r={3} fill="#6366F1" />
                      
                      {/* Multiple output interfaces at bottom for servers */}
                      <circle cx={x + 15} cy={y + 40} r={3} fill="#6366F1" />
                      <circle cx={x + 30} cy={y + 40} r={3} fill="#6366F1" />
                      <circle cx={x + 45} cy={y + 40} r={3} fill="#6366F1" />
                      
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
              
              {/* Network Connection Lines with Interfaces */}
              {/* Internet to Firewall */}
              <line x1="400" y1="118" x2="400" y2="120" stroke="#9CA3AF" strokeWidth="2" />
              
              {/* Firewall to Router */}
              <path 
                d="M390,160 L390,170 Q390,175 395,175 L405,175 Q410,175 410,180 L410,190" 
                fill="none" 
                stroke="#9CA3AF" 
                strokeWidth="2" 
              />
              
              {/* Router to Primary Switch (Site 1) */}
              <path 
                d="M370,210 L350,210 Q340,210 335,220 L270,290 Q265,300 255,305 L235,315" 
                fill="none" 
                stroke="#9CA3AF" 
                strokeWidth="2" 
              />
              
              {/* Router to DR Switch (Site 2) */}
              <path 
                d="M430,210 L450,210 Q460,210 465,220 L530,290 Q535,300 550,310 L570,320" 
                fill="none" 
                stroke="#9CA3AF" 
                strokeWidth="2" 
              />
              
              {/* Dynamic Site Areas */}
              {topology?.map((site, siteIndex) => {
                // Calculate site positions - primary site on left, DR site on right
                const x = siteIndex === 0 ? 150 : 500;
                const width = siteIndex === 0 ? 300 : 200;
                const y = 260;
                const height = 300;
                
                // Get devices for this site
                const siteDevices = serverDevices.filter(d => d.siteId === site.id);
                
                return (
                  <g key={`site-${site.id}`}>
                    <rect 
                      x={x} 
                      y={y} 
                      width={width} 
                      height={height} 
                      rx={5} 
                      fill="#F3F4F6" 
                      stroke="#D1D5DB" 
                      strokeWidth={2} 
                      strokeDasharray="5,5" 
                    />
                    <text 
                      x={x + (width/2)} 
                      y={y + 20} 
                      textAnchor="middle" 
                      fontWeight="bold" 
                      className="text-sm"
                    >
                      {site.name}
                    </text>
                    
                    {/* Render site's servers */}
                    {siteDevices.map((device, deviceIndex) => {
                      // Calculate server positions within site
                      const serverX = x + 20 + (deviceIndex * 70);
                      const serverY = y + 140;
                      
                      // Determine color based on server status
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
                          {/* Server representation */}
                          <rect 
                            x={serverX} 
                            y={serverY} 
                            width={50} 
                            height={40} 
                            rx={5} 
                            fill={fill} 
                            stroke={stroke} 
                            strokeWidth={2} 
                            className="device-node" 
                            onClick={() => handleDeviceClick(device)} 
                          />
                          
                          {/* Network interface port */}
                          <circle cx={serverX + 25} cy={serverY} r={3} fill={stroke} />
                          
                          {/* Port details */}
                          {device.ipAddress && (
                            <text 
                              x={serverX + 25} 
                              y={serverY - 5} 
                              textAnchor="middle" 
                              className="text-[8px] font-medium"
                              fill="#6B7280"
                            >
                              NIC
                            </text>
                          )}
                          
                          {/* Server label */}
                          <text 
                            x={serverX + 25} 
                            y={serverY + 24} 
                            textAnchor="middle" 
                            className="text-xs font-medium"
                          >
                            {device.name.length > 6 ? device.name.substring(0, 4) + '...' : device.name}
                          </text>
                          
                          {/* Connection line to site switch with curve */}
                          <path 
                            d={`M${siteIndex === 0 ? 230 : 600},360 
                               C${siteIndex === 0 ? 250 : 580},${serverY + 20} 
                                ${serverX + (siteIndex === 0 ? 10 : 40)},${serverY + 15} 
                                ${serverX + 25},${serverY}`}
                            fill="none"
                            stroke="#9CA3AF" 
                            strokeWidth={2} 
                          />
                          
                          {/* Add risk indicator for critical/warning status */}
                          {(device.status === "critical" || device.status === "down") && (
                            <circle cx={serverX + 25} cy={serverY - 15} r={8} fill="#FF0000" className="animate-pulse" opacity={0.6} />
                          )}
                          {device.status === "warning" && (
                            <circle cx={serverX + 25} cy={serverY - 15} r={6} fill="#FF832B" className="animate-pulse" opacity={0.6} />
                          )}
                          
                          {/* Service indicators */}
                          {device.services && (
                            <g>
                              <rect 
                                x={serverX + 5} 
                                y={serverY + 30} 
                                width={40} 
                                height={12} 
                                rx={3} 
                                fill="#F3F4F6" 
                                stroke={stroke} 
                                strokeWidth={1} 
                              />
                              <text 
                                x={serverX + 25} 
                                y={serverY + 39} 
                                textAnchor="middle" 
                                className="text-[8px]"
                              >
                                {device.services.split(',')[0] || 'Service'}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
              
              {/* Legend */}
              <g transform="translate(20, 520)">
                {/* Risk Legend */}
                <rect x="0" y="0" width="200" height="60" rx="5" fill="white" stroke="#D1D5DB" />
                <text x="10" y="20" className="text-xs font-bold">Risk Level</text>
                <circle cx="20" cy="35" r="5" fill="#FF0000" />
                <text x="30" y="39" className="text-xs">High Risk</text>
                <circle cx="80" cy="35" r="5" fill="#FF832B" />
                <text x="90" y="39" className="text-xs">Medium Risk</text>
                <circle cx="150" cy="35" r="5" fill="#42BE65" />
                <text x="160" y="39" className="text-xs">Low Risk</text>
                
                {/* Network Interfaces Legend */}
                <rect x="220" y="0" width="280" height="60" rx="5" fill="white" stroke="#D1D5DB" />
                <text x="230" y="20" className="text-xs font-bold">Network Interfaces</text>
                
                {/* Firewall interface */}
                <circle cx="240" cy="35" r="3" fill="#FF832B" />
                <text x="250" y="39" className="text-xs">Firewall</text>
                
                {/* Router interface */}
                <circle cx="310" cy="35" r="3" fill="#42BE65" />
                <text x="320" y="39" className="text-xs">Router</text>
                
                {/* Switch interface */}
                <circle cx="370" cy="35" r="3" fill="#6366F1" />
                <text x="380" y="39" className="text-xs">Switch</text>
                
                {/* Server interface */}
                <circle cx="430" cy="35" r="3" fill="#0F62FE" />
                <text x="440" y="39" className="text-xs">Server</text>
              </g>
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Device Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Device Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedDevice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="text-base">{selectedDevice.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="text-base capitalize">{selectedDevice.type}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">IP Address</h3>
                  <p className="text-base">{selectedDevice.ipAddress || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="text-base capitalize">{selectedDevice.status}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Site</h3>
                  <p className="text-base">{selectedDevice.siteName || `Site ${selectedDevice.siteId}`}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Operating System</h3>
                  <p className="text-base">{selectedDevice.operatingSystem || "Not specified"}</p>
                </div>
              </div>
              
              {/* Network interfaces section for firewalls and network devices */}
              {(selectedDevice.type === 'firewall' || selectedDevice.type === 'router' || selectedDevice.type === 'switch') && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Network Interfaces</h3>
                  <div className="text-sm space-y-2">
                    {selectedDevice.type === 'firewall' && (
                      <>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                            <span>WAN Interface</span>
                          </div>
                          <div className="text-gray-600">Internet Facing</div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                            <span>LAN1 Interface</span>
                          </div>
                          <div className="text-gray-600">Primary Site</div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                            <span>LAN2 Interface</span>
                          </div>
                          <div className="text-gray-600">DR Site</div>
                        </div>
                      </>
                    )}
                    
                    {selectedDevice.type === 'router' && (
                      <>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                            <span>Main Interface</span>
                          </div>
                          <div className="text-gray-600">Firewall Connection</div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                            <span>Primary Site Interface</span>
                          </div>
                          <div className="text-gray-600">Primary Network</div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                            <span>DR Site Interface</span>
                          </div>
                          <div className="text-gray-600">Disaster Recovery</div>
                        </div>
                      </>
                    )}
                    
                    {selectedDevice.type === 'switch' && (
                      <>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full bg-indigo-500 mr-2"></div>
                            <span>Uplink Interface</span>
                          </div>
                          <div className="text-gray-600">Router Connection</div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full bg-indigo-500 mr-2"></div>
                            <span>Server Ports (1-16)</span>
                          </div>
                          <div className="text-gray-600">Device Connections</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Related compliance controls section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Related Compliance Controls</h3>
                <div className="text-sm text-gray-700">
                  {selectedDevice.type === 'firewall' ? (
                    <div className="space-y-1">
                      <div className="p-2 bg-gray-50 rounded flex justify-between">
                        <span>FW-001: Firewall Baseline</span>
                        <span className="text-green-600">Compliant</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded flex justify-between">
                        <span>FW-002: Rule Review</span>
                        <span className="text-amber-600">Pending</span>
                      </div>
                    </div>
                  ) : selectedDevice.type === 'server' && selectedDevice.status === 'critical' ? (
                    <div className="space-y-1">
                      <div className="p-2 bg-gray-50 rounded flex justify-between">
                        <span>SRV-003: Patch Management</span>
                        <span className="text-red-600">Non-compliant</span>
                      </div>
                    </div>
                  ) : (
                    "No related compliance controls found."
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

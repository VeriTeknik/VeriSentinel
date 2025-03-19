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
  ipAddress?: string;
  operatingSystem?: string;
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
              
              {/* Firewall */}
              <rect x="370" y="120" width="60" height="40" rx="5" fill="#FEF3C7" stroke="#FF832B" strokeWidth="2" className="device-node" />
              <text x="400" y="144" textAnchor="middle" className="text-xs font-medium">Firewall</text>
              
              {/* Lines from Internet to Firewall */}
              <line x1="400" y1="90" x2="400" y2="120" stroke="#9CA3AF" strokeWidth="2" />
              
              {/* Router */}
              <rect x="370" y="190" width="60" height="40" rx="5" fill="#D1FAE5" stroke="#42BE65" strokeWidth="2" className="device-node" />
              <text x="400" y="214" textAnchor="middle" className="text-xs font-medium">Router</text>
              
              {/* Line from Firewall to Router */}
              <line x1="400" y1="160" x2="400" y2="190" stroke="#9CA3AF" strokeWidth="2" />
              
              {/* Primary Site */}
              <g>
                <rect x="150" y="260" width="300" height="300" rx="5" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="5,5" />
                <text x="300" y="280" textAnchor="middle" fontWeight="bold" className="text-sm">Primary Site</text>
                
                {/* Switch 1 */}
                <rect x="200" y="320" width="60" height="40" rx="5" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2" className="device-node" onClick={() => handleDeviceClick({
                  id: 3,
                  siteId: 1,
                  name: "Switch 1",
                  type: "network",
                  ipAddress: "192.168.1.2",
                  status: "active"
                })} />
                <text x="230" y="344" textAnchor="middle" className="text-xs font-medium">Switch 1</text>
                
                {/* Line from Router to Switch 1 */}
                <line x1="370" y1="210" x2="230" y2="320" stroke="#9CA3AF" strokeWidth="2" />
                
                {/* Servers */}
                <rect x="170" y="400" width="50" height="40" rx="5" fill="#FEE2E2" stroke="#FF0000" strokeWidth="2" className="device-node" onClick={() => handleDeviceClick({
                  id: 6,
                  siteId: 1,
                  name: "DB Server",
                  type: "server",
                  ipAddress: "192.168.1.10",
                  operatingSystem: "Ubuntu 20.04 LTS",
                  status: "active"
                })} />
                <text x="195" y="424" textAnchor="middle" className="text-xs font-medium">DB</text>
                
                <rect x="240" y="400" width="50" height="40" rx="5" fill="#CCE0FF" stroke="#0F62FE" strokeWidth="2" className="device-node" onClick={() => handleDeviceClick({
                  id: 7,
                  siteId: 1,
                  name: "Web Server",
                  type: "server",
                  ipAddress: "192.168.1.11",
                  operatingSystem: "Ubuntu 20.04 LTS",
                  status: "active"
                })} />
                <text x="265" y="424" textAnchor="middle" className="text-xs font-medium">Web</text>
                
                {/* Lines from Switch to Servers */}
                <line x1="230" y1="360" x2="195" y2="400" stroke="#9CA3AF" strokeWidth="2" />
                <line x1="230" y1="360" x2="265" y2="400" stroke="#9CA3AF" strokeWidth="2" />
                
                {/* Risk Indicator */}
                <circle cx="195" cy="395" r="10" fill="#FF0000" className="animate-pulse" opacity="0.6" />
              </g>
              
              {/* DR Site */}
              <g>
                <rect x="500" y="260" width="200" height="300" rx="5" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="5,5" />
                <text x="600" y="280" textAnchor="middle" fontWeight="bold" className="text-sm">DR Site</text>
                
                {/* Switch 2 */}
                <rect x="570" y="320" width="60" height="40" rx="5" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2" className="device-node" onClick={() => handleDeviceClick({
                  id: 4,
                  siteId: 2,
                  name: "Switch DR",
                  type: "network",
                  ipAddress: "192.168.2.2",
                  status: "active"
                })} />
                <text x="600" y="344" textAnchor="middle" className="text-xs font-medium">Switch DR</text>
                
                {/* Line from Router to Switch 2 */}
                <line x1="430" y1="210" x2="570" y2="320" stroke="#9CA3AF" strokeWidth="2" />
                
                {/* Servers */}
                <rect x="530" y="400" width="50" height="40" rx="5" fill="#FEF3C7" stroke="#FF832B" strokeWidth="2" className="device-node" onClick={() => handleDeviceClick({
                  id: 9,
                  siteId: 2,
                  name: "Auth Server",
                  type: "server",
                  ipAddress: "192.168.2.10",
                  operatingSystem: "CentOS 8",
                  status: "active"
                })} />
                <text x="555" y="424" textAnchor="middle" className="text-xs font-medium">Auth</text>
                
                <rect x="600" y="400" width="50" height="40" rx="5" fill="#D1FAE5" stroke="#42BE65" strokeWidth="2" className="device-node" onClick={() => handleDeviceClick({
                  id: 10,
                  siteId: 2,
                  name: "Log Server",
                  type: "server",
                  ipAddress: "192.168.2.11",
                  operatingSystem: "CentOS 8",
                  status: "active"
                })} />
                <text x="625" y="424" textAnchor="middle" className="text-xs font-medium">Log</text>
                
                {/* Lines from Switch to Servers */}
                <line x1="600" y1="360" x2="555" y2="400" stroke="#9CA3AF" strokeWidth="2" />
                <line x1="600" y1="360" x2="625" y2="400" stroke="#9CA3AF" strokeWidth="2" />
                
                {/* Risk Indicator */}
                <circle cx="555" cy="395" r="8" fill="#FF832B" className="animate-pulse" opacity="0.6" />
              </g>
              
              {/* Add your actual devices based on the API data here */}
              {/* This would replace or augment the hardcoded layout above */}
              
              {/* Legend */}
              <g transform="translate(20, 530)">
                <rect x="0" y="0" width="200" height="60" rx="5" fill="white" stroke="#D1D5DB" />
                <text x="10" y="20" className="text-xs font-bold">Risk Level</text>
                <circle cx="20" cy="35" r="5" fill="#FF0000" />
                <text x="30" y="39" className="text-xs">High Risk</text>
                <circle cx="80" cy="35" r="5" fill="#FF832B" />
                <text x="90" y="39" className="text-xs">Medium Risk</text>
                <circle cx="150" cy="35" r="5" fill="#42BE65" />
                <text x="160" y="39" className="text-xs">Low Risk</text>
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
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Related Compliance Controls</h3>
                <div className="text-sm text-gray-700">
                  No related compliance controls found.
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

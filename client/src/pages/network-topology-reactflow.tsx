import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Filter, Download, ZoomIn, ZoomOut, Info, Server, Monitor, Wifi, Globe } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Site, Device } from "@shared/schema";

// Import ReactFlow components and hooks
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  Position,
  MarkerType,
  useReactFlow,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node components for different device types
const FirewallNode = ({ data, isConnectable }: any) => {
  return (
    <div 
      className={`p-2 rounded border-2 ${
        data.status === 'critical' ? 'border-red-500 bg-red-50' : 
        data.status === 'warning' ? 'border-amber-500 bg-amber-50' : 
        'border-amber-500 bg-amber-50'
      } w-[120px] text-center transition-shadow hover:shadow-md`}
      onClick={data.onClick}
    >
      <div className="flex flex-col items-center">
        <Monitor className="h-8 w-8 text-amber-500 mb-1" />
        <div className="font-semibold text-sm mb-1">{data.label}</div>
        <div className="text-xs text-gray-500">Firewall</div>
        {(data.status === 'critical' || data.status === 'warning') && (
          <div className={`text-xs mt-1 rounded-full px-2 ${
            data.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {data.status}
          </div>
        )}
      </div>
    </div>
  );
};

const RouterNode = ({ data, isConnectable }: any) => {
  return (
    <div 
      className={`p-2 rounded border-2 ${
        data.status === 'critical' ? 'border-red-500 bg-red-50' : 
        data.status === 'warning' ? 'border-amber-500 bg-amber-50' : 
        'border-green-500 bg-green-50'
      } w-[120px] text-center transition-shadow hover:shadow-md`}
      onClick={data.onClick}
    >
      <div className="flex flex-col items-center">
        <Wifi className="h-8 w-8 text-green-500 mb-1" />
        <div className="font-semibold text-sm mb-1">{data.label}</div>
        <div className="text-xs text-gray-500">Router</div>
        {(data.status === 'critical' || data.status === 'warning') && (
          <div className={`text-xs mt-1 rounded-full px-2 ${
            data.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {data.status}
          </div>
        )}
      </div>
    </div>
  );
};

const SwitchNode = ({ data, isConnectable }: any) => {
  return (
    <div 
      className={`p-2 rounded border-2 ${
        data.status === 'critical' ? 'border-red-500 bg-red-50' : 
        data.status === 'warning' ? 'border-amber-500 bg-amber-50' : 
        'border-indigo-500 bg-indigo-50'
      } w-[120px] text-center transition-shadow hover:shadow-md`}
      onClick={data.onClick}
    >
      <div className="flex flex-col items-center">
        <Wifi className="h-8 w-8 text-indigo-500 mb-1" />
        <div className="font-semibold text-sm mb-1">{data.label}</div>
        <div className="text-xs text-gray-500">Switch</div>
        {(data.status === 'critical' || data.status === 'warning') && (
          <div className={`text-xs mt-1 rounded-full px-2 ${
            data.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {data.status}
          </div>
        )}
      </div>
    </div>
  );
};

const ServerNode = ({ data, isConnectable }: any) => {
  return (
    <div 
      className={`p-2 rounded border-2 ${
        data.status === 'critical' ? 'border-red-500 bg-red-50' : 
        data.status === 'warning' ? 'border-amber-500 bg-amber-50' : 
        'border-blue-500 bg-blue-50'
      } w-[120px] text-center transition-shadow hover:shadow-md`}
      onClick={data.onClick}
    >
      <div className="flex flex-col items-center">
        <Server className="h-8 w-8 text-blue-500 mb-1" />
        <div className="font-semibold text-sm mb-1">{data.label}</div>
        <div className="text-xs text-gray-500">Server</div>
        <div className="text-xs text-gray-500">{data.ipAddress || 'No IP'}</div>
        {(data.status === 'critical' || data.status === 'warning') && (
          <div className={`text-xs mt-1 rounded-full px-2 ${
            data.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {data.status}
          </div>
        )}
      </div>
    </div>
  );
};

const InternetNode = ({ data, isConnectable }: any) => {
  return (
    <div className="p-3 rounded-full border-2 border-gray-400 bg-gray-100 w-[120px] text-center">
      <div className="flex flex-col items-center">
        <Globe className="h-8 w-8 text-gray-500 mb-1" />
        <div className="font-semibold">Internet</div>
      </div>
    </div>
  );
};

// Group Node for sites
const SiteNode = ({ data, isConnectable }: any) => {
  return (
    <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 min-w-[300px] min-h-[200px]">
      <div className="absolute top-[-10px] left-2 bg-white px-2 text-sm font-bold text-gray-700">
        {data.label}
      </div>
      {data.childNodes && (
        <div className="text-xs text-gray-500 mt-2 absolute bottom-1 right-2">
          {data.childNodes} devices
        </div>
      )}
    </div>
  );
};

// Define node types for ReactFlow
const nodeTypes: NodeTypes = {
  firewall: FirewallNode,
  router: RouterNode,
  switch: SwitchNode,
  server: ServerNode,
  internet: InternetNode,
  site: SiteNode
};

interface TopologyNode {
  id: number;
  name: string;
  type: string;
  devices?: DeviceNode[];
}

interface DeviceNode extends Device {
  children?: DeviceNode[];
}

interface DeviceDetails {
  id: number;
  name: string;
  type: string;
  deviceRole: string | null;
  parentDeviceId: number | null;
  ipAddress: string | null;
  vlan: string | null;
  operatingSystem: string | null;
  services: string | null;
  status: string;
  siteId: number;
  siteName?: string;
  parentDevice?: Device;
  childDevices?: Device[];
}

export default function NetworkTopology() {
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceDetails | null>(null);
  
  // ReactFlow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useReactFlow();

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
    const parentDevice = device.parentDeviceId ? 
      devices?.find(d => d.id === device.parentDeviceId) : undefined;
    const childDevices = devices?.filter(d => d.parentDeviceId === device.id) || [];
    
    setSelectedDevice({
      ...device,
      siteName: site?.name,
      parentDevice,
      childDevices
    });
    
    setDetailsOpen(true);
  };

  const exportTopology = () => {
    // Use ReactFlow export functionality or implement custom export
    const svgElement = document.querySelector('.react-flow__renderer svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'network-topology.svg';
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Convert topology data to ReactFlow nodes and edges
  useEffect(() => {
    if (!topology || !sites || !devices) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Add Internet node
    newNodes.push({
      id: 'internet',
      type: 'internet',
      data: { label: 'Internet' },
      position: { x: 400, y: 50 },
    });

    // Process each site with its devices
    topology.forEach((site, siteIndex) => {
      const baseX = siteIndex === 0 ? 200 : 600; // Position sites horizontally
      const baseY = 150;
      const siteWidth = 300;
      const siteHeight = 300;
      
      // Add site group node
      newNodes.push({
        id: `site-${site.id}`,
        type: 'site',
        data: { 
          label: site.name,
          childNodes: site.devices?.length || 0
        },
        position: { x: baseX - 150, y: baseY },
        style: { 
          width: siteWidth,
          height: siteHeight,
          zIndex: -1 // Place behind other nodes
        }
      });

      // Find top-level devices for this site (parentDeviceId is null)
      const topLevelDevices = devices.filter(d => d.siteId === site.id && d.parentDeviceId === null);
      
      // Process top-level devices first (like firewalls)
      topLevelDevices.forEach((topDevice, idx) => {
        const nodeType = topDevice.type;
        
        newNodes.push({
          id: `device-${topDevice.id}`,
          type: nodeType as any,
          data: { 
            label: topDevice.name,
            status: topDevice.status,
            ipAddress: topDevice.ipAddress,
            onClick: () => handleDeviceClick(topDevice)
          },
          position: { x: siteWidth/2 - 60, y: 40 },
          parentNode: `site-${site.id}`,
          extent: 'parent'
        });
        
        // Connect to the Internet
        newEdges.push({
          id: `edge-internet-${topDevice.id}`,
          source: 'internet',
          target: `device-${topDevice.id}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#9CA3AF' },
          markerEnd: {
            type: MarkerType.Arrow,
            color: '#9CA3AF',
          },
        });
        
        // Get child devices
        const childDevices = devices.filter(d => d.parentDeviceId === topDevice.id);
        
        // If there are multiple children, arrange them in a row
        if (childDevices.length > 0) {
          const childWidth = siteWidth / (childDevices.length + 1);
          
          childDevices.forEach((childDevice, childIdx) => {
            // Determine position within site
            const childX = (childIdx + 1) * childWidth - 60;
            const childY = 120;
            const nodeType = childDevice.type;
            
            // Add child device node
            newNodes.push({
              id: `device-${childDevice.id}`,
              type: nodeType as any,
              data: {
                label: childDevice.name,
                status: childDevice.status,
                ipAddress: childDevice.ipAddress,
                onClick: () => handleDeviceClick(childDevice)
              },
              position: { x: childX, y: childY },
              parentNode: `site-${site.id}`,
              extent: 'parent'
            });
            
            // Connect to parent
            newEdges.push({
              id: `edge-${childDevice.parentDeviceId}-${childDevice.id}`,
              source: `device-${childDevice.parentDeviceId}`,
              target: `device-${childDevice.id}`,
              type: 'smoothstep',
              style: { stroke: '#9CA3AF' },
              markerEnd: {
                type: MarkerType.Arrow,
                color: '#9CA3AF',
              },
            });
            
            // Find third-level devices (grandchildren)
            const grandchildDevices = devices.filter(d => d.parentDeviceId === childDevice.id);
            
            // Position grandchildren in a row beneath their parent
            if (grandchildDevices.length > 0) {
              const gcWidth = siteWidth / (grandchildDevices.length + 1);
              
              grandchildDevices.forEach((gcDevice, gcIdx) => {
                const gcX = (gcIdx + 0.5) * gcWidth - 25;
                const gcY = 200;
                const nodeType = gcDevice.type;
                
                // Add grandchild node
                newNodes.push({
                  id: `device-${gcDevice.id}`,
                  type: nodeType as any,
                  data: {
                    label: gcDevice.name,
                    status: gcDevice.status,
                    ipAddress: gcDevice.ipAddress,
                    onClick: () => handleDeviceClick(gcDevice)
                  },
                  position: { x: gcX, y: gcY },
                  parentNode: `site-${site.id}`,
                  extent: 'parent'
                });
                
                // Connect to parent (second level device)
                newEdges.push({
                  id: `edge-${gcDevice.parentDeviceId}-${gcDevice.id}`,
                  source: `device-${gcDevice.parentDeviceId}`,
                  target: `device-${gcDevice.id}`,
                  type: 'smoothstep',
                  style: { stroke: '#9CA3AF' },
                  markerEnd: {
                    type: MarkerType.Arrow,
                    color: '#9CA3AF',
                  },
                });
              });
            }
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
    
    // Fit view to show all nodes
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
    }, 100);
  }, [topology, sites, devices, selectedSite, selectedDeviceType, reactFlowInstance]);

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
          <Button variant="outline" onClick={() => reactFlowInstance.zoomOut()}>
            <ZoomOut className="h-4 w-4 mr-1" />
            Zoom Out
          </Button>
          <Button variant="outline" onClick={() => reactFlowInstance.zoomIn()}>
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
                  <SelectItem value="firewall">Firewalls</SelectItem>
                  <SelectItem value="router">Routers</SelectItem>
                  <SelectItem value="switch">Switches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="w-full h-[600px] bg-gray-50 border border-gray-200 rounded-lg relative overflow-hidden">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
            >
              <Background color="#e5e7eb" gap={16} size={1} />
              <Controls />
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.type === 'firewall') return '#FF832B';
                  if (n.type === 'router') return '#42BE65';
                  if (n.type === 'switch') return '#6366F1';
                  if (n.type === 'server') return '#0F62FE';
                  return '#bbb';
                }}
                nodeColor={(n) => {
                  if (n.type === 'firewall') return '#FEF3C7';
                  if (n.type === 'router') return '#D1FAE5';
                  if (n.type === 'switch') return '#E0E7FF';
                  if (n.type === 'server') return '#CCE0FF';
                  return '#fff';
                }}
                maskColor="rgba(240, 240, 240, 0.6)"
              />
              <Panel position="bottom-center" className="bg-white rounded shadow p-2 mb-2">
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                    <span>Warning</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                    <span>Normal</span>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
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

              {/* Device Relationships - Parent Device and Child Devices */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Network Relationships</h3>
                <div className="text-sm text-gray-700 space-y-3">
                  {/* Parent device info */}
                  <div>
                    <h4 className="text-sm font-medium">Parent Device</h4>
                    {selectedDevice.parentDevice ? (
                      <div className="p-2 bg-gray-50 rounded flex justify-between items-center mt-1">
                        <div>
                          <span className="font-medium">{selectedDevice.parentDevice.name}</span>
                          <span className="text-gray-500 ml-2 text-xs capitalize">({selectedDevice.parentDevice.type})</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          selectedDevice.parentDevice.status === 'active' ? 'bg-green-100 text-green-800' : 
                          selectedDevice.parentDevice.status === 'warning' ? 'bg-amber-100 text-amber-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedDevice.parentDevice.status}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded mt-1">
                        <span className="text-gray-500">No parent device (top-level device)</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Child devices list */}
                  <div>
                    <h4 className="text-sm font-medium">Child Devices</h4>
                    {selectedDevice.childDevices && selectedDevice.childDevices.length > 0 ? (
                      <div className="space-y-1 mt-1">
                        {selectedDevice.childDevices.map(child => (
                          <div key={child.id} className="p-2 bg-gray-50 rounded flex justify-between items-center">
                            <div>
                              <span className="font-medium">{child.name}</span>
                              <span className="text-gray-500 ml-2 text-xs capitalize">({child.type})</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              child.status === 'active' ? 'bg-green-100 text-green-800' : 
                              child.status === 'warning' ? 'bg-amber-100 text-amber-800' : 
                              child.status === 'critical' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {child.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded mt-1">
                        <span className="text-gray-500">No child devices (leaf device)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
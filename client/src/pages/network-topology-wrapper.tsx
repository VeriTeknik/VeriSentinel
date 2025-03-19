import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import NetworkTopology from './network-topology-reactflow';

export default function NetworkTopologyWrapper() {
  return (
    <ReactFlowProvider>
      <NetworkTopology />
    </ReactFlowProvider>
  );
}
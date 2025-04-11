'use client';

import React, { useEffect, useRef } from 'react';
import { WebTwain } from 'dwt/dist/types/WebTwain';

interface DWTProps {
  license?: "DLS2eyJoYW5kc2hha2VDb2RlIjoiMTAzODk2MjQwLVRYbFFjbTlxIiwibWFpblNlcnZlclVSTCI6Imh0dHBzOi8vbWRscy5keW5hbXNvZnRvbmxpbmUuY29tIiwib3JnYW5pemF0aW9uSUQiOiIxMDM4OTYyNDAiLCJzdGFuZGJ5U2VydmVyVVJMIjoiaHR0cHM6Ly9zZGxzLmR5bmFtc29mdG9ubGluZS5jb20iLCJjaGVja0NvZGUiOi0xNDg4NDgxMzc1fQ==";
  width?: string;
  height?: string;
  viewMode?: { cols: number, rows: number };
  onWebTWAINReady?: (dwt: WebTwain) => void;
}

const DWT: React.FC<DWTProps> = (props) => {
  const containerID = "dwtcontrolContainer";
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Dynamsoft namespace if not already available
    if (typeof window !== 'undefined' && !(window as any).Dynamsoft) {
      console.error('Dynamsoft namespace is not available. Make sure to include the DWT script.');
      return;
    }

    const Dynamsoft = (window as any).Dynamsoft;

    if (props.license) {
      Dynamsoft.DWT.ProductKey = props.license;
    }

    Dynamsoft.DWT.RegisterEvent('OnWebTwainReady', () => {
      const DWObject = Dynamsoft.DWT.GetWebTwain(containerID);
      
      // Configure viewer dimensions
      DWObject.Viewer.width = "100%";
      DWObject.Viewer.height = "100%";
      
      if (props.width && container.current) {
        container.current.style.width = props.width;
      }
      
      if (props.height && container.current) {
        container.current.style.height = props.height;
      }
      
      // Set view mode if provided
      if (props.viewMode) {
        DWObject.Viewer.setViewMode(props.viewMode.cols, props.viewMode.rows);
      }
      
      // Expose the DWT object to parent components
      if (props.onWebTWAINReady) {
        props.onWebTWAINReady(DWObject);
      }
    });

    // Configure DWT
    Dynamsoft.DWT.ResourcesPath = "https://unpkg.com/dwt@18.5.1/dist";
    Dynamsoft.DWT.Containers = [{
      WebTwainId: 'dwtObject',
      ContainerId: containerID
    }];
    
    // Load DWT
    Dynamsoft.DWT.Load();

    // Cleanup function
    return () => {
      // Optional: Add cleanup code if needed
    };
  }, [props]);

  return (
    <div ref={container} id={containerID}></div>
  );
};

export default DWT;
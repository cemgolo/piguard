"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useDemo } from "@/app/lib/DemoContext";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { GPSData } from "@/types/gps";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

// Fixed marker icon component to fix Leaflet icon issues in Next.js
const MarkerIcon = () => {
  useEffect(() => {
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);
  
  return null;
};

// Generate realistic movement path with smooth curves
const generateRealisticPath = (count: number) => {
  // Mimicking a robot's movement pattern - starting point (Istanbul)
  const baseLat = 41.015137;
  const baseLng = 28.979530;
  const data = [];
  
  // Create an initial path pattern that looks like a robot exploration
  // For a demo, we'll make a slightly randomized path 
  let currentLat = baseLat;
  let currentLng = baseLng;
  
  // First data point
  data.push({
    latitude: currentLat,
    longitude: currentLng,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    altitude: 100 + Math.random() * 5,
    satellites: Math.floor(Math.random() * 3) + 6,
    signalStrength: 75 + Math.random() * 15,
  });
  
  // Direction changes to create a more realistic path
  const movementPatterns = [
    { lat: 0.0002, lng: 0.0001 },   // Northeast
    { lat: 0.0001, lng: 0.0003 },   // East
    { lat: -0.0001, lng: 0.0002 },  // Southeast
    { lat: -0.0002, lng: 0 },       // South
    { lat: -0.0001, lng: -0.0002 }, // Southwest
    { lat: 0.0001, lng: -0.0002 },  // West
    { lat: 0.0003, lng: 0 },        // North
  ];
  
  // Generate the path
  for (let i = 1; i < count; i++) {
    // Gradually change direction to create a smooth path
    const pattern = movementPatterns[Math.floor(i / 10) % movementPatterns.length];
    const randomFactor = 0.6 + Math.random() * 0.8; // Randomize the movement a bit
    
    currentLat += pattern.lat * randomFactor;
    currentLng += pattern.lng * randomFactor;
    
    // Add some very small random noise for naturalness
    currentLat += (Math.random() - 0.5) * 0.00005;
    currentLng += (Math.random() - 0.5) * 0.00005;
    
    // Calculate time for this point (going backwards from now)
    const time = new Date(Date.now() - (count - i) * 15000);
    
    data.push({
      latitude: currentLat,
      longitude: currentLng,
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      altitude: 100 + Math.sin(i / 5) * 5 + Math.random() * 2,
      satellites: Math.floor(Math.random() * 3) + 6,
      signalStrength: 75 + Math.sin(i / 10) * 10 + Math.random() * 5,
    });
  }
  
  return data;
};

export default function DashboardPage() {
  const { isDemoMode } = useDemo();
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [gpsData, setGpsData] = useState<GPSData[]>([]);
  const [showPath, setShowPath] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load Leaflet CSS and fetch data
  useEffect(() => {
    const loadLeafletCSS = async () => {
      await import('leaflet/dist/leaflet.css');
      setLeafletLoaded(true);
    };
    
    loadLeafletCSS();
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch GPS data
        const gpsResponse = await fetch('/api/robot/gps');
        if (!gpsResponse.ok) {
          throw new Error('Failed to fetch GPS data');
        }
        const gpsData = await gpsResponse.json();
        setGpsData(gpsData);
        
        // Update data periodically
        const interval = setInterval(async () => {
          const newGpsResponse = await fetch('/api/robot/gps');
          if (newGpsResponse.ok) {
            const newGpsData = await newGpsResponse.json();
            setGpsData(newGpsData);
          }
        }, 5000); // Update every 5 seconds
        
        return () => clearInterval(interval);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // In a real app, we would fetch this data from the Raspberry Pi API
  const metrics = [
    {
      title: "CPU Usage",
      value: "32%",
      change: "+2%",
      changeType: "increase",
    },
    {
      title: "RAM",
      value: "1.8GB/4GB",
      change: "-120MB",
      changeType: "decrease",
    },
    {
      title: "Temperature",
      value: "52°C",
      change: "+3°C",
      changeType: "increase",
    },
    {
      title: "Battery",
      value: "85%",
      change: "-5%",
      changeType: "decrease",
    },
  ];

  // Status information
  const statusItems = [
    { label: "Last Connection", value: "2 mins ago" },
    { label: "Active Sensors", value: "5/6" },
    { label: "Warnings", value: "2" },
    { label: "Uptime", value: "3d 4h 12m" },
  ];

  // Get current GPS position
  const currentPosition = gpsData.length > 0 ? gpsData[gpsData.length - 1] : null;
  
  // Default center (Istanbul) if no GPS data
  const mapCenter = currentPosition 
    ? [currentPosition.latitude, currentPosition.longitude] 
    : [41.015137, 28.979530];
    
  // Create line coordinates for path
  const pathPositions = gpsData.map(point => [point.latitude, point.longitude]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Welcome to the Robot Management System. Monitor and control your Raspberry Pi robot.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {metric.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div
                    className={`text-xs font-medium mt-2 ${
                      metric.changeType === "increase"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {metric.change} since last hour
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status Summary and Location Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Status Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Robot Location</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPath(!showPath)}
                >
                  {showPath ? "Hide Path" : "Show Path"}
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-b-lg">
                {leafletLoaded && (
                  <div className="h-[300px] w-full">
                    <MarkerIcon />
                    <MapContainer 
                      center={mapCenter as [number, number]} 
                      zoom={15} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      {currentPosition && (
                        <Marker position={[currentPosition.latitude, currentPosition.longitude]}>
                          <Popup>
                            <div className="text-sm">
                              <div className="font-semibold mb-1">Current Location</div>
                              <div>Latitude: {currentPosition.latitude.toFixed(6)}</div>
                              <div>Longitude: {currentPosition.longitude.toFixed(6)}</div>
                              <div>Altitude: {currentPosition.altitude.toFixed(1)}m</div>
                              <div>Updated: {currentPosition.time}</div>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                      
                      {showPath && pathPositions.length > 1 && (
                        <Polyline 
                          positions={pathPositions as [number, number][]} 
                          color="blue" 
                          weight={3}
                          opacity={0.7}
                        />
                      )}
                    </MapContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
} 
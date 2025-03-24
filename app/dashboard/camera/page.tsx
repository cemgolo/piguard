"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";
import { CameraResponse } from "@/types/camera";

export default function CameraPage() {
  const [cameraData, setCameraData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCameraData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/robot/camera');
      if (!response.ok) {
        throw new Error('Failed to fetch camera data');
      }
      
      const data: CameraResponse = await response.json();
      setCameraData(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching camera data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCameraData();
    
    // Update camera feed every 2 seconds
    const interval = setInterval(fetchCameraData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Camera Feed</h1>
          <p className="text-gray-500 mt-2">
            Live camera feed from the robot's camera
          </p>
        </div>
        <Button
          onClick={fetchCameraData}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Live Camera Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-[480px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : cameraData ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={`data:image/jpeg;base64,${cameraData}`}
                alt="Camera Feed"
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-[480px] text-gray-500">
              No camera feed available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
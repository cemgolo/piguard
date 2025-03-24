export interface GPSData {
  latitude: number;
  longitude: number;
  altitude: number;
  time: string;
  satellites: number;
  signalStrength: number;
}

export interface GPSResponse {
  data: GPSData[];
  error?: string;
} 
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Camera, AlertTriangle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CameraPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const router = useRouter();

  // Verileri getir
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Kamera görüntüleri getir
      const imagesResponse = await fetch("/api/camera?limit=12&latest=true");
      
      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json();
        setImages(imagesData);
      } else {
        throw new Error("Kamera görüntüleri alınamadı");
      }
      
      // Anomali uyarıları getir
      const anomaliesResponse = await fetch("/api/anomalies?limit=5");
      
      if (anomaliesResponse.ok) {
        const anomaliesData = await anomaliesResponse.json();
        setAnomalies(anomaliesData);
      } else {
        throw new Error("Anomali uyarıları alınamadı");
      }
    } catch (err) {
      console.error("Veri getirme hatası:", err);
      setError("Veriler alınırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde ve her 30 saniyede bir verileri getir
  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Refresh butonu için handler
  const handleRefresh = () => {
    fetchData();
  };

  // Tarih formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Anomali durumuna göre renk belirleme
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-red-500";
      case "ACKNOWLEDGED":
        return "bg-yellow-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "RESOLVED":
        return "bg-green-500";
      case "FALSE_ALARM":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // Anomali önem derecesine göre metin belirleme
  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "LOW":
        return "Düşük";
      case "MEDIUM":
        return "Orta";
      case "HIGH":
        return "Yüksek";
      case "CRITICAL":
        return "Kritik";
      default:
        return "Bilinmiyor";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kamera ve Anomali Tespiti</h1>
          <p className="text-gray-500 mt-2">
            Kamera görüntüleri ve tespit edilen anomaliler
          </p>
        </div>
        <Button onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
            <div>
              <h3 className="font-semibold">Hata</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Son Kamera Görüntüleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-video bg-gray-200 rounded-md"></div>
                  ))}
                </div>
              ) : images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="group relative overflow-hidden rounded-md border bg-gray-100">
                      <div className="aspect-video relative">
                        <Image
                          src={image.imageUrl}
                          alt="Kamera Görüntüsü"
                          fill
                          className="object-cover"
                        />
                        {image.processed && image.detections && image.detections.length > 0 && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              {image.detections.length} Tespit
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="outline"
                            className="bg-white text-black hover:bg-gray-100"
                            onClick={() => router.push(`/dashboard/camera/${image.id}`)}
                          >
                            Detayları Gör
                          </Button>
                        </div>
                      </div>
                      <div className="p-2 text-xs">
                        <p className="font-medium">{formatDate(image.capturedAt)}</p>
                        {image.gpsLatitude && image.gpsLongitude && (
                          <p className="text-gray-500 truncate">
                            GPS: {image.gpsLatitude.toFixed(6)}, {image.gpsLongitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Henüz kaydedilmiş kamera görüntüsü yok</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Son Anomaliler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="animate-pulse space-y-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 border-b last:border-b-0"></div>
                  ))}
                </div>
              ) : anomalies.length > 0 ? (
                <div>
                  {anomalies.map((anomaly) => (
                    <div key={anomaly.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(anomaly.status)}`}></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium truncate">{anomaly.title}</p>
                            <span className="text-xs ml-1 whitespace-nowrap">
                              {formatDate(anomaly.createdAt).split(" ")[1]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{anomaly.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {getSeverityText(anomaly.severity)}
                            </span>
                            {anomaly.assignedUser ? (
                              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                {anomaly.assignedUser.name}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 text-center">
                    <Link href="/dashboard/anomalies" className="text-sm text-blue-600 hover:text-blue-800">
                      Tüm anomalileri görüntüle
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Tespit edilmiş bir anomali yok</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
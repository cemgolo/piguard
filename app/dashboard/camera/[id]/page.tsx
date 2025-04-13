"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import Image from "next/image";

export default function CameraDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kamera görüntüsü detaylarını getir
  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/camera', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: params.id }),
        });

        if (!response.ok) {
          throw new Error("Görüntü detayları alınamadı");
        }

        const data = await response.json();
        setImage(data);
      } catch (err) {
        console.error("Görüntü detayları getirme hatası:", err);
        setError("Görüntü detayları alınırken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchImage();
    }
  }, [params.id]);

  // Tarih formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Tespit tipine göre renk belirleme
  const getDetectionColor = (type: string) => {
    switch (type) {
      case "PERSON":
        return "border-red-500 bg-red-50 text-red-700";
      case "VEHICLE":
        return "border-blue-500 bg-blue-50 text-blue-700";
      case "ANIMAL":
        return "border-green-500 bg-green-50 text-green-700";
      case "FIRE":
        return "border-orange-500 bg-orange-50 text-orange-700";
      case "SMOKE":
        return "border-purple-500 bg-purple-50 text-purple-700";
      default:
        return "border-gray-500 bg-gray-50 text-gray-700";
    }
  };

  // Tespit tipinin Türkçe karşılığı
  const getDetectionTypeName = (type: string) => {
    switch (type) {
      case "PERSON":
        return "İnsan";
      case "VEHICLE":
        return "Araç";
      case "ANIMAL":
        return "Hayvan";
      case "FIRE":
        return "Yangın";
      case "SMOKE":
        return "Duman";
      case "UNKNOWN":
        return "Bilinmeyen";
      case "CUSTOM":
        return "Özel";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri Dön
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

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="aspect-video bg-gray-200 rounded-md"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      ) : image ? (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">
            Kamera Görüntüsü Detayları
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Görüntü</span>
                    <span className="text-sm font-normal text-gray-500">
                      {formatDate(image.capturedAt)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video rounded-md overflow-hidden border">
                    <Image
                      src={image.imageUrl}
                      alt="Kamera Görüntüsü"
                      fill
                      className="object-contain"
                    />

                    {/* Tespit işaretlerini göster */}
                    {image.detections && image.detections.length > 0 && (
                      <>
                        {image.detections.map((detection: any, index: number) => (
                          <div 
                            key={detection.id || index} 
                            className="absolute border-2 border-dashed rounded-sm flex items-center justify-center"
                            style={{
                              top: `${detection.boundingBox?.y || 0}%`,
                              left: `${detection.boundingBox?.x || 0}%`,
                              width: `${detection.boundingBox?.width || 10}%`,
                              height: `${detection.boundingBox?.height || 10}%`,
                              borderColor: detection.detectionType === "PERSON" ? 'red' : 
                                          detection.detectionType === "VEHICLE" ? 'blue' : 
                                          detection.detectionType === "FIRE" ? 'orange' : 'green'
                            }}
                          >
                            <div className="absolute -top-6 left-0 text-xs bg-black/75 text-white px-1 py-0.5 rounded whitespace-nowrap">
                              {getDetectionTypeName(detection.detectionType)} ({Math.round(detection.confidence * 100)}%)
                            </div>
                            
                            {/* Zaman damgası */}
                            <div className="absolute -bottom-6 left-0 text-xs bg-black/75 text-white px-1 py-0.5 rounded flex items-center gap-1 whitespace-nowrap">
                              <Clock className="h-3 w-3" />
                              {new Date(detection.detectedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Detaylar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" /> Yakalanma Tarihi
                    </h3>
                    <p>{formatDate(image.capturedAt)}</p>
                  </div>

                  {(image.gpsLatitude && image.gpsLongitude) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" /> GPS Koordinatları
                      </h3>
                      <p>
                        {image.gpsLatitude.toFixed(6)}, {image.gpsLongitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">İşlenme Durumu</h3>
                    <p className={image.processed ? "text-green-500" : "text-amber-500"}>
                      {image.processed ? "İşlendi" : "İşlenmedi"}
                    </p>
                  </div>

                  {image.detections && image.detections.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Tespitler</h3>
                      <div className="space-y-2 mt-2">
                        {image.detections.map((detection: any, index: number) => (
                          <div 
                            key={detection.id || index} 
                            className={`border rounded-md p-2 ${getDetectionColor(detection.detectionType)}`}
                          >
                            <div className="flex justify-between items-start">
                              <p className="font-medium">
                                {getDetectionTypeName(detection.detectionType)}
                              </p>
                              <span className="text-xs bg-white/50 px-1 py-0.5 rounded">
                                %{Math.round(detection.confidence * 100)}
                              </span>
                            </div>
                            
                            {detection.boundingBox && (
                              <p className="text-xs mt-1">
                                Konum: x:{detection.boundingBox.x.toFixed(1)}%, y:{detection.boundingBox.y.toFixed(1)}%
                              </p>
                            )}
                            
                            <p className="text-xs mt-1 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(detection.detectedAt)}
                            </p>
                            
                            {detection.notes && (
                              <p className="text-xs mt-1 italic">{detection.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Görüntü bulunamadı veya yükleniyor...</p>
        </div>
      )}
    </div>
  );
} 
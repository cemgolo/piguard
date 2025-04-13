"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CameraSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Kamera ayarları
  const [frameRate, setFrameRate] = useState(30); // FPS
  const [quality, setQuality] = useState(75); // 1-100 aralığında
  const [anomalyDetection, setAnomalyDetection] = useState(true);
  const [autoRecord, setAutoRecord] = useState(true);
  const [recordDuration, setRecordDuration] = useState(30); // Anomali tespit edildikten sonra kayıt süresi (saniye)

  // Kamera ayarlarını yükle
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // RaspberryPiConfig tablosundan ayarları çek
        const response = await fetch("/api/settings/camera");
        
        if (response.ok) {
          const settings = await response.json();
          
          // Ayarları atama
          if (settings.frame_rate) setFrameRate(parseInt(settings.frame_rate));
          if (settings.quality) setQuality(parseInt(settings.quality));
          if (settings.anomaly_detection) setAnomalyDetection(settings.anomaly_detection === "true");
          if (settings.auto_record) setAutoRecord(settings.auto_record === "true");
          if (settings.record_duration) setRecordDuration(parseInt(settings.record_duration));
        } else {
          // Hata durumunda varsayılan değerleri kullan
          console.warn("Kamera ayarları alınamadı, varsayılan değerler kullanılıyor");
        }
      } catch (err) {
        console.error("Kamera ayarları getirme hatası:", err);
        setError("Kamera ayarları alınırken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Ayarları kaydet
  const saveSettings = async () => {
    setSaving(true);
    
    try {
      const response = await fetch("/api/settings/camera", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frame_rate: frameRate.toString(),
          quality: quality.toString(),
          anomaly_detection: anomalyDetection.toString(),
          auto_record: autoRecord.toString(),
          record_duration: recordDuration.toString(),
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Ayarlar Kaydedildi",
          description: "Kamera ayarları başarıyla güncellendi.",
        });
      } else {
        throw new Error("Ayarlar kaydedilemedi");
      }
    } catch (err) {
      console.error("Ayarları kaydetme hatası:", err);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kamera Ayarları</h1>
        <p className="text-gray-500 mt-2">
          Kamera görüntüleme ve yakalama ayarlarını yapılandırın
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
            <div>
              <h3 className="font-semibold">Hata</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Görüntü Ayarları</CardTitle>
            <CardDescription>
              Görüntü kalitesi ve kare hızı ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Kare Hızı Ayarı */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="frame-rate">Kare Hızı (FPS)</Label>
                <span className="text-sm font-medium">{frameRate} FPS</span>
              </div>
              <div className="flex space-x-4">
                <Slider
                  id="frame-rate"
                  value={[frameRate]}
                  min={1}
                  max={60}
                  step={1}
                  onValueChange={(value) => setFrameRate(value[0])}
                  disabled={loading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                Daha yüksek kare hızı daha akıcı görüntü sağlar, ancak bant genişliği kullanımını artırır.
              </p>
            </div>
            
            {/* Görüntü Kalitesi */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="quality">Görüntü Kalitesi</Label>
                <span className="text-sm font-medium">%{quality}</span>
              </div>
              <div className="flex space-x-4">
                <Slider
                  id="quality"
                  value={[quality]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(value) => setQuality(value[0])}
                  disabled={loading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                Daha yüksek görüntü kalitesi daha net görüntü sağlar, ancak bant genişliği kullanımını artırır.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Anomali Tespiti Ayarları</CardTitle>
            <CardDescription>
              Anomali tespiti ve otomatik kayıt ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Anomali Tespiti */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="anomaly-detection" className="flex-1">
                Anomali Tespiti
                <p className="text-xs font-normal text-gray-500 mt-1">
                  Görüntüde anormal durumların otomatik olarak tespit edilmesini sağlar
                </p>
              </Label>
              <Switch
                id="anomaly-detection"
                checked={anomalyDetection}
                onCheckedChange={setAnomalyDetection}
                disabled={loading}
              />
            </div>
            
            {/* Otomatik Kayıt */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="auto-record" className="flex-1">
                Otomatik Kayıt
                <p className="text-xs font-normal text-gray-500 mt-1">
                  Anomali tespit edildiğinde otomatik olarak video kaydını başlatır
                </p>
              </Label>
              <Switch
                id="auto-record"
                checked={autoRecord}
                onCheckedChange={setAutoRecord}
                disabled={loading || !anomalyDetection}
              />
            </div>
            
            {/* Kayıt Süresi */}
            <div className="space-y-2">
              <Label htmlFor="record-duration">
                Anomali Sonrası Kayıt Süresi (Saniye)
              </Label>
              <Input
                id="record-duration"
                type="number"
                min={5}
                max={300}
                value={recordDuration}
                onChange={(e) => setRecordDuration(parseInt(e.target.value) || 30)}
                disabled={loading || !anomalyDetection || !autoRecord}
              />
              <p className="text-xs text-gray-500">
                Anomali tespit edildikten sonra devam edilecek kayıt süresi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={loading || saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Ayarları Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 
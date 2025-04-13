import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth/authOptions";

export async function POST(req: NextRequest) {
  try {
    // Kimlik doğrulama kontrolü
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 401 }
      );
    }

    // İstek gövdesini al
    const body = await req.json();
    const { 
      imageUrl, 
      thumbnailUrl, 
      gpsLatitude, 
      gpsLongitude, 
      detections, 
      robotStatus,
      captureTimestamp 
    } = body;

    // Gerekli alan kontrolü
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Görüntü URL'si gereklidir" },
        { status: 400 }
      );
    }

    // Kamera görüntüsü kaydet
    const cameraImage = await prisma.cameraImage.create({
      data: {
        imageUrl,
        thumbnailUrl,
        gpsLatitude: gpsLatitude || null,
        gpsLongitude: gpsLongitude || null,
        robotStatus: robotStatus || null,
        processed: detections ? true : false,
        capturedAt: captureTimestamp ? new Date(captureTimestamp) : new Date(),
      },
    });

    // Eğer tespit verileri varsa bunları da kaydet
    if (detections && Array.isArray(detections) && detections.length > 0) {
      await prisma.detection.createMany({
        data: detections.map((detection: any) => ({
          cameraImageId: cameraImage.id,
          detectionType: detection.type,
          confidence: detection.confidence,
          boundingBox: detection.boundingBox || null, // {x, y, width, height} formatında koordinat bilgisi
          notes: detection.notes || null,
          detectedAt: detection.timestamp ? new Date(detection.timestamp) : new Date(),
        })),
      });

      // Yüksek güvenilirlikli bir tespit varsa alarm oluştur
      const highConfidenceDetections = detections.filter(
        (d: any) => d.confidence > 0.7
      );

      if (highConfidenceDetections.length > 0) {
        // En yüksek güvenilirliğe sahip tespiti bul
        const highestConfidence = highConfidenceDetections.reduce(
          (prev: any, current: any) => 
            prev.confidence > current.confidence ? prev : current
        );

        // Tespit edilen koordinatları al
        const coordinates = highestConfidence.boundingBox 
          ? `[${highestConfidence.boundingBox.x},${highestConfidence.boundingBox.y}]` 
          : 'Bilinmeyen konum';

        // Tespit zamanını al
        const detectionTime = highestConfidence.timestamp 
          ? new Date(highestConfidence.timestamp) 
          : new Date();

        // Alarm oluştur
        await prisma.anomalyAlert.create({
          data: {
            title: `${highestConfidence.type} Tespit Edildi`,
            description: `Güvenilirlik: %${(highestConfidence.confidence * 100).toFixed(2)} | Konum: ${coordinates} | Zaman: ${detectionTime.toLocaleTimeString()}`,
            severity: highestConfidence.confidence > 0.9 ? "HIGH" : "MEDIUM",
            gpsLatitude: gpsLatitude || null,
            gpsLongitude: gpsLongitude || null,
            relatedImages: {
              create: [
                {
                  imageUrl: imageUrl,
                  addedAt: new Date(),
                },
              ],
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: cameraImage,
    });
  } catch (error) {
    console.error("Kamera yakalama hatası:", error);
    return NextResponse.json(
      { error: "Kamera görüntüsü işlenirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 
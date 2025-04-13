import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth/authOptions";

export async function GET(req: NextRequest) {
  try {
    // Kimlik doğrulama kontrolü
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 401 }
      );
    }

    // RaspberryPiConfig tablosundan kamera ayarlarını getir
    const settings = await prisma.raspberryPiConfig.findMany({
      where: {
        category: "camera",
      },
    });

    // Ayarları kolay kullanılabilir bir formata çevir
    const formattedSettings: Record<string, string> = {};
    settings.forEach((setting) => {
      formattedSettings[setting.name] = setting.value;
    });

    // Varsayılan değerleri ekle (eğer veritabanında yoksa)
    const defaults = {
      frame_rate: "30",
      quality: "75",
      anomaly_detection: "true",
      auto_record: "true",
      record_duration: "30",
    };

    // Eksik ayarlar için varsayılan değerleri kullan
    const result = { ...defaults, ...formattedSettings };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Kamera ayarları getirme hatası:", error);
    return NextResponse.json(
      { error: "Kamera ayarları alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

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

    // Kullanıcı admin mi kontrol et
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bu işlem için admin yetkileri gerekiyor" },
        { status: 403 }
      );
    }

    // İstek gövdesini al
    const body = await req.json();
    
    // Kaydedilecek ayarları belirle
    const settingsToSave = [
      { name: "frame_rate", value: body.frame_rate || "30" },
      { name: "quality", value: body.quality || "75" },
      { name: "anomaly_detection", value: body.anomaly_detection || "true" },
      { name: "auto_record", value: body.auto_record || "true" },
      { name: "record_duration", value: body.record_duration || "30" },
    ];

    // Toplu işlem yerine her ayar için ayrı upsert işlemi yap
    const results = await Promise.all(
      settingsToSave.map(async (setting) => {
        return prisma.raspberryPiConfig.upsert({
          where: {
            name: setting.name,
          },
          update: {
            value: setting.value,
            category: "camera",
          },
          create: {
            name: setting.name,
            value: setting.value,
            category: "camera",
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: "Kamera ayarları başarıyla güncellendi",
      updated: results.length,
    });
  } catch (error) {
    console.error("Kamera ayarları güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Kamera ayarları güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 
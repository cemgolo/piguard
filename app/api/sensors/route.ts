import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth/authOptions";

// Sensör verilerini getir
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

    // URL'den filtreleme parametrelerini al
    const searchParams = req.nextUrl.searchParams;
    const sensorType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

    // Filtreleme kriterleri oluştur
    const where: any = {};
    
    if (sensorType) {
      where.sensorType = sensorType;
    }
    
    if (fromDate || toDate) {
      where.timestamp = {};
      
      if (fromDate) {
        where.timestamp.gte = fromDate;
      }
      
      if (toDate) {
        where.timestamp.lte = toDate;
      }
    }

    // Veritabanından sensör verilerini al
    const sensorData = await prisma.sensorData.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: Math.min(limit, 1000), // Maximum 1000 kayıt dönecek şekilde limit
    });

    return NextResponse.json(sensorData);
  } catch (error) {
    console.error("Sensör verisi getirme hatası:", error);
    return NextResponse.json(
      { error: "Sensör verileri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Sensör verisi ekle
export async function POST(req: NextRequest) {
  try {
    // İstek gövdesini al
    const body = await req.json();
    const { sensorType, value, unit } = body;

    // Gerekli alan kontrolü
    if (!sensorType || value === undefined || !unit) {
      return NextResponse.json(
        { error: "Sensör tipi, değer ve birim gereklidir" },
        { status: 400 }
      );
    }

    // Sensör verisi kaydet
    const sensorData = await prisma.sensorData.create({
      data: {
        sensorType,
        value,
        unit,
      },
    });

    return NextResponse.json({
      success: true,
      data: sensorData,
    });
  } catch (error) {
    console.error("Sensör verisi kaydetme hatası:", error);
    return NextResponse.json(
      { error: "Sensör verisi kaydedilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 
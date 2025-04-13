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

    // URL'den filtreleme parametrelerini al
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const latest = searchParams.get('latest') === 'true';
    const withDetections = searchParams.get('withDetections') === 'true';
    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

    // Filtreleme kriterleri oluştur
    const where: any = {};
    
    if (withDetections) {
      where.processed = true;
    }
    
    if (fromDate || toDate) {
      where.capturedAt = {};
      
      if (fromDate) {
        where.capturedAt.gte = fromDate;
      }
      
      if (toDate) {
        where.capturedAt.lte = toDate;
      }
    }

    // Veritabanından kamera görüntülerini al
    const cameraImages = await prisma.cameraImage.findMany({
      where,
      include: {
        detections: true,
      },
      orderBy: {
        capturedAt: latest ? 'desc' : 'asc',
      },
      take: Math.min(limit, 100), // Maximum 100 kayıt dönecek şekilde limit
    });

    return NextResponse.json(cameraImages);
  } catch (error) {
    console.error("Kamera görüntüsü getirme hatası:", error);
    return NextResponse.json(
      { error: "Kamera görüntüleri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Tek bir kamera görüntüsü detayını getir
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

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Görüntü ID'si gereklidir" },
        { status: 400 }
      );
    }

    // Veritabanından kamera görüntüsünü detaylarıyla getir
    const cameraImage = await prisma.cameraImage.findUnique({
      where: {
        id,
      },
      include: {
        detections: true,
      },
    });

    if (!cameraImage) {
      return NextResponse.json(
        { error: "Görüntü bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(cameraImage);
  } catch (error) {
    console.error("Kamera görüntüsü getirme hatası:", error);
    return NextResponse.json(
      { error: "Kamera görüntüsü alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
} 
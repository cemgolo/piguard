import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth/authOptions";

// Anomali uyarılarını getir
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
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '100');
    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

    // Filtreleme kriterleri oluştur
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (severity) {
      where.severity = severity;
    }
    
    if (fromDate || toDate) {
      where.createdAt = {};
      
      if (fromDate) {
        where.createdAt.gte = fromDate;
      }
      
      if (toDate) {
        where.createdAt.lte = toDate;
      }
    }

    // Veritabanından anomali uyarılarını al
    const anomalies = await prisma.anomalyAlert.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 1000), // Maximum 1000 kayıt dönecek şekilde limit
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        relatedImages: true,
      },
    });

    return NextResponse.json(anomalies);
  } catch (error) {
    console.error("Anomali uyarısı getirme hatası:", error);
    return NextResponse.json(
      { error: "Anomali uyarıları alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Anomali uyarısını güncelle (durum değiştirme)
export async function PATCH(req: NextRequest) {
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
    const { id, status, assignedUserId } = body;

    // Gerekli alan kontrolü
    if (!id) {
      return NextResponse.json(
        { error: "Anomali ID'si gereklidir" },
        { status: 400 }
      );
    }

    // Güncellenecek verileri hazırla
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      
      // Eğer durum RESOLVED olarak ayarlandıysa, çözülme tarihini şimdiki zaman olarak ayarla
      if (status === "RESOLVED") {
        updateData.resolvedAt = new Date();
      }
    }
    
    if (assignedUserId) {
      // Kullanıcı gerçekten var mı kontrol et
      const user = await prisma.user.findUnique({
        where: { id: assignedUserId },
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "Atanacak kullanıcı bulunamadı" },
          { status: 404 }
        );
      }
      
      updateData.assignedUserId = assignedUserId;
    }
    
    // Veritabanında anomali uyarısını güncelle
    const anomaly = await prisma.anomalyAlert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: anomaly,
    });
  } catch (error) {
    console.error("Anomali uyarısı güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Anomali uyarısı güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 
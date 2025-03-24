import { NextResponse } from 'next/server';

const RASPBERRY_PI_URL = process.env.RASPBERRY_PI_URL || 'http://raspberry-pi-ip:5000';

export async function GET() {
  try {
    const response = await fetch(`${RASPBERRY_PI_URL}/gps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GPS data');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching GPS data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GPS data' },
      { status: 500 }
    );
  }
} 
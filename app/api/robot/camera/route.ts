import { NextResponse } from 'next/server';

const RASPBERRY_PI_URL = process.env.RASPBERRY_PI_URL || 'http://raspberry-pi-ip:5000';

export async function GET() {
  try {
    const response = await fetch(`${RASPBERRY_PI_URL}/camera`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch camera data');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching camera data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch camera data' },
      { status: 500 }
    );
  }
} 
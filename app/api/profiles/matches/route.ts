import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement actual matches fetching logic
    return NextResponse.json({ matches: [] });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
} 
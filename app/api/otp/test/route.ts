import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('Test endpoint hit!');
  
  return NextResponse.json({
    message: 'OTP API is working',
    hasWatiToken: !!process.env.WATI_ACCESS_TOKEN,
    hasWatiEndpoint: !!process.env.WATI_API_ENDPOINT,
    watiEndpoint: process.env.WATI_API_ENDPOINT || 'NOT SET',
    timestamp: new Date().toISOString()
  });
} 
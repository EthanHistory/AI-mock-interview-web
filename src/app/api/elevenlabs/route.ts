// src/app/api/elevenlabs/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const CHRIS_VOICE_ID = "iP95p4xoKVk53GoZ742B";
    const text = await req.json();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': `${process.env.ELEVENLABS_API_KEY}`,
      },
      body: JSON.stringify({
        "text": text,
        "voice_settings": {
          "stability": 0.5,
          "similarity_boost": 0.5,
        },
      }),
    };

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/` + CHRIS_VOICE_ID, options);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Eleven Labs API');
    }

    const audioBlob = await response.blob();
    return new NextResponse(audioBlob, {
      headers: { 'Content-Type': 'audio/mpeg' },  // Ensure the correct MIME type
    });
}

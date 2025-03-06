import { Deepgram } from '@deepgram/sdk';
import { NextResponse } from 'next/server';

const deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
const deepgram = new Deepgram(deepgramApiKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as Blob;
    
    if (!audio) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(await audio.arrayBuffer());
    
    const response = await deepgram.transcription.preRecorded(
      {
        buffer: audioBuffer,
        mimetype: audio.type,
      },
      {
        smart_format: true,
        model: 'nova',
      }
    );

    const transcript = response.results?.channels[0]?.alternatives[0]?.transcript || '';
    
    return NextResponse.json({ text: transcript });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
} 
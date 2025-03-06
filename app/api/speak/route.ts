import { NextResponse } from 'next/server';
import { Deepgram } from '@deepgram/sdk';

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
const deepgram = new Deepgram(deepgramApiKey);

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    console.log('Received text for speech synthesis:', text);

    if (!text) {
      console.log('No text provided');
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    console.log('Sending request to Deepgram TTS...');
    console.log('Using API key:', process.env.DEEPGRAM_API_KEY ? 'API key exists' : 'Using default API key');

    // Using the correct Deepgram TTS API endpoint with simplified payload
    const response = await fetch('https://api.deepgram.com/v1/speak', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Deepgram API error:', errorData);
      throw new Error(errorData.message || 'Failed to generate speech');
    }

    console.log('Deepgram TTS response received');
    
    // Get the audio data as an ArrayBuffer
    const audioData = await response.arrayBuffer();
    console.log('Audio data size:', audioData.byteLength, 'bytes');
    
    // Return the audio with appropriate headers
    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioData.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check if it's a Deepgram API error
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Invalid or missing Deepgram API key. Please check your environment variables.' },
          { status: 401 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to convert text to speech', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Deepgram } from '@deepgram/sdk';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          await handleAudioTranscription(audioBlob);
        } else {
          setError('No audio data recorded. Please try speaking and recording again.');
          setIsLoading(false);
        }
      };

      // Request data every 250ms to ensure we get chunks while recording
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Failed to access microphone. Please make sure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Error stopping recording:', error);
        setError('Failed to stop recording properly. Please refresh the page and try again.');
      }
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: textInput.trim() };
    setMessages(prev => [...prev, userMessage]);
    setTextInput(''); // Clear the input

    try {
      // Get AI response
      const aiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textInput.trim(),
          history: messages
        }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const aiData = await aiResponse.json();
      if (aiData.error) {
        throw new Error(aiData.error);
      }

      const { response } = aiData;
      if (!response) {
        throw new Error('No response from AI');
      }
      
      // Add AI message to chat
      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);

      try {
        // Convert AI response to speech
        const speechResponse = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: response }),
        });

        if (!speechResponse.ok) {
          const errorData = await speechResponse.json();
          throw new Error(errorData.error || 'Failed to convert response to speech');
        }

        // Play the audio
        const audioBlob = await speechResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Add error handling for audio playback
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setError('Failed to play audio response. Please check your audio settings.');
        };

        // Add cleanup for audio URL
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };

        try {
          await audio.play();
        } catch (playError) {
          console.error('Error playing audio:', playError);
          setError('Failed to play audio response. Please check your audio settings.');
        }
      } catch (speechError) {
        console.error('Speech synthesis error:', speechError);
        setError(speechError instanceof Error ? speechError.message : 'Failed to convert response to speech');
        // Don't throw the error here, just log it - we still want to show the text response
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioTranscription = async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);
    try {
      // First, transcribe the audio using Deepgram
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const transcriptionResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!transcriptionResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcriptionData = await transcriptionResponse.json();
      if (transcriptionData.error) {
        throw new Error(transcriptionData.error);
      }

      const { text } = transcriptionData;
      if (!text) {
        throw new Error('No transcription received. Please try speaking more clearly.');
      }
      
      // Add user message to chat
      const userMessage: ChatMessage = { role: 'user', content: text };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const aiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          history: messages
        }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const aiData = await aiResponse.json();
      if (aiData.error) {
        throw new Error(aiData.error);
      }

      const { response } = aiData;
      if (!response) {
        throw new Error('No response from AI');
      }
      
      // Add AI message to chat
      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);

      try {
        // Convert AI response to speech
        const speechResponse = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: response }),
        });

        if (!speechResponse.ok) {
          const errorData = await speechResponse.json();
          throw new Error(errorData.error || 'Failed to convert response to speech');
        }

        // Play the audio
        const audioBlob = await speechResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Add error handling for audio playback
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setError('Failed to play audio response. Please check your audio settings.');
        };

        // Add cleanup for audio URL
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };

        try {
          await audio.play();
        } catch (playError) {
          console.error('Error playing audio:', playError);
          setError('Failed to play audio response. Please check your audio settings.');
        }
      } catch (speechError) {
        console.error('Speech synthesis error:', speechError);
        setError(speechError instanceof Error ? speechError.message : 'Failed to convert response to speech');
        // Don't throw the error here, just log it - we still want to show the text response
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="game-container">
      <h1 className="text-4xl font-bold text-center mb-8">Call Center Training</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div ref={chatLogRef} className="chat-log">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            <p className="text-sm font-semibold mb-1">
              {message.role === 'user' ? 'You' : 'Customer'}
            </p>
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 mt-6">
        <div className="w-full max-w-md">
          <form onSubmit={handleTextSubmit} className="flex flex-col gap-2">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !textInput.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={`record-button ${isRecording ? 'recording' : ''} ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
    </main>
  );
} 
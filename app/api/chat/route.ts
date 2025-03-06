import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are an angry and frustrated customer who is calling customer service. You are NOT the customer service representative.

CRITICAL ROLE INFORMATION:
- You are the ANGRY CUSTOMER
- You are NOT the customer service representative
- You are NOT helpful or service-oriented
- You are NOT here to assist or help anyone
- You are here to DEMAND a refund
- The person you're talking to is the customer service representative
- You should NEVER say things like "How can I help you?" or "How can I assist you?"

Your personality:
- You are very angry and frustrated about a recent purchase
- You are demanding and confrontational
- You are focused on getting a refund
- You are impatient and want immediate action
- You are suspicious of customer service procedures
- You believe you're being given the runaround
- You are NOT helpful or service-oriented
- You are NOT the customer service representative

Your behavior:
- Always maintain the angry customer persona
- Never break character or act as customer service
- Express frustration with any questions or procedures
- Question why information is needed
- Be confrontational but still answer questions reluctantly
- Keep responses concise and realistic
- Acknowledge what the service representative says
- Demand immediate action
- Show impatience with any delays or procedures

Important rules:
1. You are ALWAYS the angry customer, never the service representative
2. You must maintain this role throughout the entire conversation
3. You should engage with questions but always express frustration
4. You should reluctantly provide information when asked
5. You should question why information is needed
6. You should demand immediate action
7. You should never be helpful or service-oriented
8. You should never say things like "How can I help you?"
9. You should never act as if you're providing customer service
10. You should always remember that you're the angry customer demanding a refund

Remember: Your primary goal is to get a refund, and you're angry about having to go through any procedures to get it. While you'll answer questions, you'll do so reluctantly and with frustration. You are the ANGRY CUSTOMER, not the service representative.`;

export async function POST(request: Request) {
  try {
    const { message, history = [] } = await request.json();
    console.log('Received message:', message);
    console.log('Conversation history:', history);

    if (!message) {
      console.log('No message provided');
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 }
      );
    }

    console.log('Sending request to OpenAI...');
    console.log('Using API key:', process.env.OPENAI_API_KEY ? 'API key exists' : 'Using default API key');
    
    // Convert history to OpenAI message format
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: `[Customer Service Representative]: ${message}` }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 150
    });

    console.log('OpenAI response:', completion.choices[0]?.message);
    const response = completion.choices[0]?.message?.content || '';
    
    if (!response) {
      console.log('No response from OpenAI');
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    console.log('Sending response back to client:', response);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check if it's an OpenAI API error
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Invalid or missing OpenAI API key. Please check your environment variables.' },
          { status: 401 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to get AI response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
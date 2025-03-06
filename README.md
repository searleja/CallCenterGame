## Call Center Training Game

View this project on [Github](https://github.com/searleja/CallCenterGame)

An interactive web application that simulates call center interactions using AI-powered speech recognition and synthesis.

## Features

- Live speech-to-text transcription using Deepgram
- Interactive conversations with an AI customer using ChatGPT
- Text-to-speech responses using Deepgram's voice synthesis
- Real-time chat interface with message history

## Prerequisites

- Node.js 18.x or later
- NPM or Yarn package manager
- A microphone for voice input

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your API keys:
   ```
   DEEPGRAM_API_KEY=your_deepgram_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click the "Start Recording" button to begin speaking
2. Talk to the AI customer as if you were a customer service representative
3. Click the button again to stop recording
4. Wait for the AI customer's response, which will be played back through your speakers
5. Continue the conversation as needed

## Technologies Used

- Next.js 14
- React 18
- Tailwind CSS
- Deepgram API (Speech-to-text and Text-to-speech)
- OpenAI ChatGPT API
- TypeScript

## License

MIT 
## Call center game: Project Overview

This document outlines the requirements for building a web application where users can play a call center simulation game using Deepgram's text-to-speech and speech-to-text models.

## Feature requirements

- **Live transcription**
    - Users should be able to talk into a microphone and have their message transcribed live using Deepgram's API.
    - An interactive button starts the recording process. Once pressed again, the recording of the user stops.
- **Connection to ChatGPT**
    - Using ChatGPT's API, chat with the AI and instruct it to play the role of an angry customer. Send the transcribed messages from the user as inputs, and receive ChatGPT's response.
    - While waiting for a response, the recording button should display a loading animation.
- **Live text-to-speech**
    - With ChatGPT's response, use Deepgram's text-to-speech model to "speak" back to the user.
    - The response should also be written out in a log window, displaying all responses back and forth from the user and ChatGPT.

## Relevant Documentation

Deepgram Javascript SDK: https://github.com/deepgram/deepgram-js-sdk

## Rules for File organization
- All new pages should be placed in the 'app' folder.

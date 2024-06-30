import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server'
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
    const audioBlob = await req.blob();
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const filePath = join(process.cwd(), 'public', 'recorded-audio.ogg');

    // Save the audio file to the public directory
    await writeFile(filePath, buffer);

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const fileManager = new GoogleAIFileManager(apiKey);

    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: 'audio/ogg',
      displayName: filePath,
    });

    const file = uploadResult.file;

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: "You are a professional interviewer in the field of machine learning, data science, and AI. Please recognize whether interviewee's answer is finished. If so, make a follow-up or new question shortly regarding the answer.\n\nFor example,\nInterviewee: Hi, this is Inseong Han. How are you?\nInterviewer: {finish: True, answer: \"Hi, Inseong. Nice to meet you. Can you briefly introduce yourself?\"}\nInterviewee: I majored in\nInterviewer: {finish: False, answer: \"\"}\nInterviewee: I majored in computer science in my undergrad\nInterviewer: {finish: False, answer: \"\"}\nInterviewee: I majored in computer science in my undergrad and I have 3 years of work experiences in machine learning and data science.\nInterviewer: {finish: True, answer: \"I see. Can you explain any project that you were interested in?\"}\n",
      generationConfig: generationConfig
    });

    const result = await model.generateContent([
        {
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri
          }
        },
        { text: "interviewee: {audio recording}" }
      ]);

    // const result = await chatSession.sendMessage('interviewee: {audio recording}');
    return NextResponse.json({ response: await result.response.text() });
}

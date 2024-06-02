'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, animate } from 'framer-motion';
import axios from 'axios';

export default function ChatPage() {
  const scope = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const recordingRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [amplitudeArray, setAmplitudeArray] = useState(new Uint8Array(16)); // Reduced number of bars
  const [transcription, setTranscription] = useState(""); // State to store transcribed text
  const [interviewerAnswer, setInterviewerAnswer] = useState(""); // State to store interviewer's response

  useEffect(() => {
    async function sequence() {
      await animate(scope.current, { opacity: 1, x: '-35vw', y: '-40vh' }, { duration: 2 });
    }
    sequence();
  }, []);

  const startRecording = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }

    // Get audio stream for visualizing amplitude
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 256; // Smaller fftSize to reduce number of bars
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAmplitude = () => {
      if (!recordingRef.current) return; // Exit if not recording
      requestAnimationFrame(updateAmplitude);
      analyser.getByteFrequencyData(dataArray);
      setAmplitudeArray([...dataArray.slice(10, 26)]); // Only take the first 16 values
    };

    setRecording(true);
    recordingRef.current = true; // Set recording flag to true
    updateAmplitude();

    audioRef.current = { stream, audioContext, analyser };

    // Speech recognition
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // We don't need interim results
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setRecording(true);
    };

    recognition.onresult = async (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalTranscription = event.results[i][0].transcript;
          setTranscription(finalTranscription); // Update the transcription state
          console.log('Final Transcription:', finalTranscription);
          // Send transcription to FastAPI endpoint
          try {
            const response = await axios.post('http://localhost:8000/answer', {
              interviewee_answer: finalTranscription
            });
            setInterviewerAnswer(response.data.interviewer_answer); // Update interviewer's response state
          } catch (error) {
            console.error('Error sending transcription:', error);
          }
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event);
    };

    recognition.onend = () => {
      if (recordingRef.current) {
        recognition.start();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (audioRef.current) {
      const { stream, audioContext } = audioRef.current;
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
      setRecording(false);
      recordingRef.current = false; // Set recording flag to false
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recordingRef.current = false;
      setRecording(false);
    }
  };

  const handleToggleRecording = () => {
    if (!recording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 relative">
      <motion.h1
        ref={scope}
        className="text-4xl font-bold mb-4"
        initial={{ opacity: 0, x: '-35vw', y: '-40vh'}}
        style={{ position: 'absolute' }}
      >
        Interview Session
      </motion.h1>
      <div className="flex items-center mt-4">
        <motion.button
          className="px-4 py-2 bg-red-500 text-white rounded-full mr-4"
          onClick={handleToggleRecording}
          animate={{ scale: recording ? 1.1 : 1 }}
          transition={{ duration: 0.1, ease: 'easeInOut' }}
        >
          {recording ? 'Stop Recording' : 'Start Recording'}
        </motion.button>
        {recording && (
          <div className="flex space-x-1 h-24 items-center justify-center">
            {Array.from(amplitudeArray).map((value, index) => (
              <motion.div
                key={index}
                className="w-4 bg-green-500 rounded-sm"
                style={{ marginLeft: index === 0 ? 0 : '2px' }}
                initial={{ height: '10%', transform: 'translateY(10%)' }}
                animate={{ height: `${(value / 200) * 100 + 10}%`, transform: 'translateY(10%)' }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
        )}
      </div>
      {transcription && (
        <div className="mt-4 bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl text-black font-semibold">Interviewee:</h2>
          <p className="text-black">{transcription}</p>
        </div>
      )}
      {interviewerAnswer && (
        <div className="mt-4 bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl text-black font-semibold">Interviewer:</h2>
          <p className="text-black">{interviewerAnswer}</p>
        </div>
      )}
    </div>
  );
}

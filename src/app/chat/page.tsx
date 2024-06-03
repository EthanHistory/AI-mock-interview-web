'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, animate } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';

export type TupleList = [string, string][];

export default function ChatPage() {
  const scope = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const recordingRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [amplitudeArray, setAmplitudeArray] = useState(new Uint8Array(16)); // Reduced number of bars
  const [transcription, setTranscription] = useState(""); // State to store transcribed text
  const [interviewerAnswer, setInterviewerAnswer] = useState("Please introduce yourself."); // State to store interviewer's response
  const [loading, setLoading] = useState(false); // State for loading spinner
  const [colorChangeTrigger, setColorChangeTrigger] = useState(false); // State to trigger color change
  const intervieweeResponseRef = useRef(""); // Ref for interviewee response
  const chatHistoryRef = useRef<TupleList>([
    ["ai", "Please introduce yourself."]
  ]);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function sequence() {
      await animate(scope.current, { opacity: 1, x: '-35vw', y: '-40vh' }, { duration: 2 });
    }
    sequence();
  }, []);

  useEffect(() => {
    if (interviewerAnswer) {
      setColorChangeTrigger(true);
    }
  }, [interviewerAnswer]);

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
      setAmplitudeArray(dataArray.slice(10, 26)); // Only take the first 16 values
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
          const combinedTranscription = intervieweeResponseRef.current + " " + finalTranscription;
          intervieweeResponseRef.current = combinedTranscription
          setTranscription(finalTranscription); // Update the transcription state

          // Abort the previous request if it exists
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }

          // Create a new AbortController
          const abortController = new AbortController();
          abortControllerRef.current = abortController;

          setLoading(true); // Start loading
          try {
            const response = await fetch('http://localhost:8000/answer', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                'input': intervieweeResponseRef.current,
                'chat_history': chatHistoryRef.current
              }),
              signal: abortController.signal // Attach the abort signal to the fetch request
            });
            if (!abortController.signal.aborted && response.ok) {
              const data = await response.json();
              if (data.is_enough_response) {
                chatHistoryRef.current.push(["human", intervieweeResponseRef.current]);
                chatHistoryRef.current.push(["ai", data.output]);
                intervieweeResponseRef.current = "";
                setInterviewerAnswer(data.output); // Update interviewer's response state
              } else{
                console.log("NONO")
              }
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.log('Fetch aborted');
            } else {
              console.error('Error sending transcription:', error);
            }
          } finally {
            setLoading(false); // Stop loading
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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
      <motion.div
        className="mt-4 p-4 rounded-lg relative"
        initial={{ backgroundColor: 'white' }}
        animate={{
          backgroundColor: colorChangeTrigger ? ['green', 'white'] : 'white',
        }}
        transition={{ duration: 1, times: [0, 1] }}
        onAnimationComplete={() => setColorChangeTrigger(false)}
      >
        <h2 className="text-xl text-black font-semibold">Interviewer:</h2>
        <p className="text-black">{interviewerAnswer}</p>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <LoadingSpinner />
          </div>
        )}
      </motion.div>
    </div>
  );
}

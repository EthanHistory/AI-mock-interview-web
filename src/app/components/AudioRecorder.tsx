// components/AudioRecorder.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AudioRecorder({ onAmplitudeChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const audioRef = useRef(new Audio());
  const silenceStart = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
      // Reset audio chunks when recording stops
      audioChunksRef.current = [];
    }
    // Cleanup the animation frame on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    audioRef.current.onended = () => {
      setIsPlaying(false);
      setIsRecording(true); // Restart recording after playback
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.addEventListener("dataavailable", event => {
      audioChunksRef.current.push(event.data);
    });

    mediaRecorderRef.current.addEventListener("stop", () => {
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        if (audioBlob.size > 0) {
          const audioURL = URL.createObjectURL(audioBlob);
          audioRef.current.src = audioURL;
          setIsPlaying(true);
          audioRef.current.play().catch(error => {
            console.error("Failed to play audio:", error);
          });
        } else {
          console.warn("Recorded audio is too short or empty.");
        }
      }
    });

    mediaRecorderRef.current.start();

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    source.connect(analyserRef.current);
    dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateAmplitude = () => {
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
      const amplitude = Math.max(...dataArrayRef.current) - 128;
      onAmplitudeChange(amplitude);

      const silenceBuffer = 5;
      const isSilent = dataArrayRef.current.every(amplitude => 
        amplitude >= (128 - silenceBuffer) && amplitude <= (128 + silenceBuffer)
      );

      if (isSilent) {
        if (silenceStart.current === null) {
          silenceStart.current = Date.now();
        } else if (Date.now() - silenceStart.current > 1500) {
          setIsRecording(false);
        }
      } else {
        silenceStart.current = null;
      }

      if (isRecording) {
        animationFrameId.current = requestAnimationFrame(updateAmplitude);
      }
    };

    updateAmplitude();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    silenceStart.current = null; // Reset silenceStart when stopping the recording
  };

  const handleRecord = () => {
    setIsRecording(prevState => !prevState);
  };

  return (
    <div>
      <motion.button
        className={`px-4 py-2 text-white rounded ${
          isRecording ? 'bg-red-500' : (isPlaying ? 'bg-gray-500' : 'bg-blue-500')
        } ${isPlaying ? 'cursor-not-allowed' : ''}`}        
        whileHover={{ scale: isPlaying ? 1 : 1.2 }}
        whileTap={{ scale: isPlaying ? 1 : 0.95 }}
        onClick={handleRecord}
        disabled={isPlaying}
      >
        {isRecording ? 'Stop Recording' : (isPlaying ? 'Playing' : 'Start Recording')}
      </motion.button>
      <audio ref={audioRef} hidden />
    </div>
  );
}

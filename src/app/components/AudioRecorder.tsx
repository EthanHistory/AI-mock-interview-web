// components/AudioRecorder.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AudioRecorder({ onAmplitudeChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.addEventListener("dataavailable", event => {
      audioChunksRef.current.push(event.data);
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
      if (isRecording) {
        requestAnimationFrame(updateAmplitude);
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
  };

  const handleRecord = () => {
    setIsRecording(prevState => !prevState);
  };

  return (
    <div>
      { isRecording ? 
          <motion.button
            className="px-4 py-2 bg-red-500 text-white rounded"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRecord}
          >
          Stop Recording
          </motion.button>
          :
          <motion.button 
          className="px-4 py-2 bg-blue-500 text-white rounded"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRecord}>
          Start Recording
          </motion.button>
      }
    </div>
  );
}

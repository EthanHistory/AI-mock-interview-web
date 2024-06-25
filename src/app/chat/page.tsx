'use client'

// pages/chat.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AudioRecorder from '../components/AudioRecorder';

export default function ChatPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [name, setName] = useState('');
  const [amplitude, setAmplitude] = useState(0);
  const [scaledAmplitude, setScaledAmplitude] = useState(1);

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsModalOpen(false);
  };

  const handleAmplitudeChange = (newAmplitude) => {
    setAmplitude(newAmplitude);
  };

  useEffect(() => {
    const threshold = 5; // Set a threshold for amplitude change
    if (Math.abs(amplitude - scaledAmplitude) > threshold) {
      setScaledAmplitude(amplitude);
    }
  }, [amplitude]);

  const maxScale = 1.2; // Define the maximum scale limit

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-1xl mb-4 text-black">Who the interviewer is talking to?</h2>
            <form onSubmit={handleFormSubmit} className="flex flex-col">
              <label className="mb-2 text-black">
                Name:
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border p-2 rounded mt-1 ml-4"
                  required
                />
              </label>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
      {!isModalOpen && (
        <>
          <motion.h1 
            className="text-4xl font-bold mb-24" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            AI Mock Interview Session
          </motion.h1>
          <div className="flex justify-center space-x-40">
            <div className="flex flex-col items-center">
              <motion.div 
                className="relative"
                initial={{ scale: 1 }}
                animate={{ scale: Math.min(1 + scaledAmplitude * 0.01, maxScale) }} // Apply the maximum scale limit
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  mass: 1,
                }}
              >
                <motion.img 
                  src="/user.png" 
                  alt="User" 
                  className="rounded-full w-80 h-80" 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
              />
              </motion.div>
              <p className="mt-2">{name}</p>
            </div>
            <div className="flex flex-col items-center">
              <motion.img 
                src="/interviewer.png" 
                alt="AI Interviewer" 
                className="rounded-full w-80 h-80" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
              <p className="mt-2">AI Interviewer</p>
            </div>
          </div>
          <div className="mt-6">
            <AudioRecorder onAmplitudeChange={handleAmplitudeChange} />
          </div>
        </>
      )}
    </div>
  );
}

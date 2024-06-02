'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import pdfToText from 'react-pdftotext';

export default function InterviewPreparePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState({
    raw_text: '',
    summarized_text: ''
  });
  const [job_description, setJobDescription] = useState({
    raw_text: '',
    summarized_text: ''
  });
  const [submitText, setSubmitText] = useState('Submit');
  const [dots, setDots] = useState('');

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
      }, 500);
    } else {
      setDots('');
    }
    return () => clearInterval(interval);
  }, [loading]);

  const summarizeResume = async (resume) => {
    try {
      const response = await fetch('http://localhost:8000/summarize_resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: resume })
      });

      if (response.ok) {
        const data = await response.json();
        return data.summary;
      } else {
        console.error('PDF text summarization API request failed');
        return null;
      }
    } catch (error) {
      console.error('PDF text summarization API request error:', error);
      return null;
    }
  };

  const summarizeJobDescription = async (jd) => {
    try {
      const response = await fetch('http://localhost:8000/summarize_job_description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: jd })
      });

      if (response.ok) {
        const data = await response.json();
        return data.summary;
      } else {
        console.error('Regular text summarization API request failed');
        return null;
      }
    } catch (error) {
      console.error('Regular text summarization API request error:', error);
      return null;
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    pdfToText(file)
      .then((text) =>
        setResume((previousState) => ({
          ...previousState,
          raw_text: text
        }))
      )
      .catch((error) => console.error('Failed to extract text from pdf', error));
  };

  const handleTextChange = (event) => {
    setJobDescription((previousState) => ({
      ...previousState,
      raw_text: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSubmitText('Submitting');

    const [summarizedResume, summarizedJobDescription] = await Promise.all([
      summarizeResume(resume.raw_text),
      summarizeJobDescription(job_description.raw_text)
    ]);

    setResume((previousState) => ({
      ...previousState,
      summarized_text: summarizedResume
    }));

    setJobDescription((previousState) => ({
      ...previousState,
      summarized_text: summarizedJobDescription
    }));

    console.log("Done")

    setLoading(false);
    setSubmitText('Submit');

    router.push('/chat', {
      state: {
        resume: summarizedResume,
        job_description: summarizedJobDescription
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">Interview Prepare Page</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <div className="mb-4">
          <label htmlFor="fileInput" className="text-lg mr-4">
            Upload PDF:
          </label>
          <input type="file" id="fileInput" onChange={handleFileChange} />
        </div>

        <div className="mb-4">
          <label htmlFor="textInput" className="text-lg mr-4">
            Enter Text:
          </label>
          <textarea
            id="textInput"
            value={job_description.raw_text}
            onChange={handleTextChange}
            className="w-80 h-40 p-2 border border-gray-300 rounded text-black"
          />
        </div>

        <motion.button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={loading}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? `Submitting${dots}` : 'Submit'}
        </motion.button>
      </form>
    </div>
  );
}

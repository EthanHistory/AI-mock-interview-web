'use client';

import pdf from 'pdf-parse';

export const extractTextFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const data = await pdf(arrayBuffer);
  return data.text;
};

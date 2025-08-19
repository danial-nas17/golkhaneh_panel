// src/hooks/useGemini.js
import { useState } from 'react';
import { model } from '../services/geminiService';

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateContent = async (prompt) => {
    setLoading(true);
    setError(null);
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { generateContent, loading, error };
};
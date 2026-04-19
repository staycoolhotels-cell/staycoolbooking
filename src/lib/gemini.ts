import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiModel = (modelName: string = 'gemini-2.0-flash') => {
  return genAI.getGenerativeModel({ modelName });
};

/**
 * Sends a structured prompt to Gemini and expects a JSON response.
 * @param prompt The prompt to send.
 * @returns Parsed JSON object or null if failed.
 */
export const fetchGeminiJSON = async <T>(prompt: string): Promise<T | null> => {
  try {
    if (!apiKey) {
      console.warn('GOOGLE_GENERATIVE_AI_API_KEY is missing.');
      return null;
    }

    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown if Gemini wraps it in code blocks
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim();
    }

    return JSON.parse(text) as T;
  } catch (error) {
    console.error('Gemini API Error:', error);
    return null;
  }
};

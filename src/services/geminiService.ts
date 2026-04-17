import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getGeminiStream = async function* (prompt: string, systemInstruction?: string) {
  const response = await ai.models.generateContentStream({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: systemInstruction ? { systemInstruction } : undefined,
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
};

export const getGeminiResponse = async (prompt: string, systemInstruction?: string, useJson?: boolean, schema?: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction,
      ...(useJson ? { responseMimeType: "application/json" } : {}),
      ...(schema ? { responseSchema: schema } : {})
    },
  });

  return response.text;
};

export { Type };


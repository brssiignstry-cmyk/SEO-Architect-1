import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const extractTextFromDocument = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf') {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const promptParts = [
      { inlineData: { mimeType: 'application/pdf', data: base64.split(',')[1] } },
      { text: `Extract all readable text and relevant content from this document cleanly so I can use it as context for article generation.` }
    ];
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts: promptParts }
    });
    return response.text?.trim() || "";
  } else if (file.name.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
  } else {
    return await file.text();
  }
};

export const extractLinksFromDocument = async (file: File, linkType: 'internal' | 'external'): Promise<string> => {
  const promptParts: any[] = [
    { text: `Extract all ${linkType} URLs and their related anchor texts from this document. Format as a clean list: "Anchor Text: URL". Only include actual URLs (avoid empty anchors or malformed links). If no ${linkType} links are found, return nothing. Provide just the text, no conversational filler.` }
  ];

  if (file.type === 'application/pdf') {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    promptParts.unshift({
      inlineData: {
        mimeType: 'application/pdf',
        data: base64.split(',')[1]
      }
    });
  } else if (file.name.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    promptParts.unshift({ text: `Context HTML extracted from DOCX: \n\n${result.value}` });
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const html = XLSX.utils.sheet_to_html(workbook.Sheets[firstSheetName]);
    promptParts.unshift({ text: `Context HTML extracted from Spreadsheet/CSV: \n\n${html}` });
  } else {
    const text = await file.text();
    promptParts.unshift({ text: `Document content: \n\n${text}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts: promptParts },
    config: {
      systemInstruction: "You are a helpful SEO data extraction assistant. Your job is to strictly extract links and anchor texts."
    }
  });

  return response.text?.trim() || "";
};

export const generateImageWithGemini = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
  });
  
  if (response.candidates && response.candidates.length > 0) {
    for (const part of response.candidates[0].content.parts || []) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${base64EncodeString}`;
      }
    }
  }
  throw new Error("Failed to generate image.");
};

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


import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

export const analyzeLog = async (logContent: string): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a cybersecurity expert assisting a CTF player.
    Analyze the following network reconnaissance log.
    Explain what happened, identifying specific errors (e.g., connection refused, permission denied),
    what tools were used, and what this implies about the target's security or the attacker's environment.
    Be concise and professional.
    
    Log content:
    ${logContent}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A brief summary of the log events." },
          keyFindings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of specific errors or discoveries found in the log."
          },
          securityPosture: { type: Type.STRING, description: "Assessment of the target based on this scan." },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Tips for the CTF player on how to proceed or fix their scan."
          }
        },
        required: ["summary", "keyFindings", "securityPosture", "recommendations"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(text) as AnalysisResult;
};
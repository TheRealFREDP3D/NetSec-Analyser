import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from 'openai';
import { AnalysisResult, LLMProvider, LLMModel } from '../types';

// Standardized error class for API errors
class APIError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Helper function to create consistent error messages
const createAPIError = (provider: string, message: string, statusCode?: number, originalError?: Error): APIError => {
  return new APIError(`${provider}: ${message}`, provider, statusCode, originalError);
};


export const fetchOllamaModels = async (): Promise<LLMModel[]> => {
  const ollamaBaseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`);
    
    if (!response.ok) {
      if (response.status === 0 || response.type === 'error') {
        throw createAPIError('Ollama', 'Cannot connect to Ollama. Make sure Ollama is running locally.');
      } else {
        throw createAPIError('Ollama', `API error: ${response.statusText}`, response.status);
      }
    }
    
    const data = await response.json();
    
    if (!data.models || !Array.isArray(data.models)) {
      throw createAPIError('Ollama', 'Invalid response format from API');
    }
    
    const models = data.models.map((model: any): LLMModel => ({
      id: model.name,
      name: `${model.name} (${model.size ? Math.round(model.size / 1024 / 1024 / 1024) + 'GB' : 'Unknown size'})`,
      provider: LLMProvider.OLLAMA
    }));

    if (models.length === 0) {
      console.warn("No models found in Ollama. Pull a model first with: ollama pull <model-name>");
    }

    return models;
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    
    // Return fallback models if API call fails
    const fallbackModels = [
      { id: 'llama3.2', name: 'Llama 3.2', provider: LLMProvider.OLLAMA },
      { id: 'llama3.1', name: 'Llama 3.1', provider: LLMProvider.OLLAMA },
      { id: 'qwen2.5', name: 'Qwen 2.5', provider: LLMProvider.OLLAMA },
      { id: 'mistral', name: 'Mistral', provider: LLMProvider.OLLAMA },
      { id: 'codellama', name: 'Code Llama', provider: LLMProvider.OLLAMA }
    ];
    
    if (error instanceof Error) {
      console.warn(`Using fallback Ollama models due to: ${error.message}`);
    }
    
    return fallbackModels;
  }
};

export const fetchOpenAIModels = async (): Promise<LLMModel[]> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw createAPIError('OpenAI', 'API key is missing. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  try {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    
    // Fetch available models directly from OpenAI API
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw createAPIError('OpenAI', 'API access unauthorized. Please check your API key.', 401);
      } else if (response.status === 429) {
        throw createAPIError('OpenAI', 'API rate limit exceeded. Please try again later.', 429);
      } else {
        throw createAPIError('OpenAI', `API error: ${response.statusText}`, response.status);
      }
    }
    
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw createAPIError('OpenAI', 'Invalid response format from API');
    }
    
    // Filter for GPT models that support chat completions
    const models = data.data
      .filter((model: any) => 
        model.id?.startsWith('gpt-') && 
        model.object === 'model'
      )
      .map((model: any): LLMModel => ({
        id: model.id,
        name: model.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        provider: LLMProvider.OPENAI
      }));

    if (models.length === 0) {
      console.warn("No GPT models found in OpenAI API response");
    }

    return models;
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    
    // Return fallback models if API call fails
    const fallbackModels = [
      { id: 'gpt-4o', name: 'GPT-4o', provider: LLMProvider.OPENAI },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: LLMProvider.OPENAI },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: LLMProvider.OPENAI },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: LLMProvider.OPENAI }
    ];
    
    if (error instanceof Error) {
      console.warn(`Using fallback OpenAI models due to: ${error.message}`);
    }
    
    return fallbackModels;
  }
};

export const fetchGeminiModels = async (): Promise<LLMModel[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw createAPIError('Gemini', 'API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  try {
    // Fetch available models directly from REST API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw createAPIError('Gemini', 'API access forbidden. Please check your API key and permissions.', 403);
      } else if (response.status === 429) {
        throw createAPIError('Gemini', 'API rate limit exceeded. Please try again later.', 429);
      } else {
        throw createAPIError('Gemini', `API error: ${response.statusText}`, response.status);
      }
    }
    
    const data = await response.json();
    
    if (!data.models || !Array.isArray(data.models)) {
      throw createAPIError('Gemini', 'Invalid response format from API');
    }
    
    // Filter for Gemini models that support content generation
    const models = data.models
      .filter((model: any) => 
        model.name?.startsWith('models/gemini') && 
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .map((model: any): LLMModel => ({
        id: model.name.split('/').pop(),
        name: model.displayName || model.name.split('/').pop(),
        provider: LLMProvider.GEMINI
      }));

    if (models.length === 0) {
      console.warn("No generative models found in Gemini API response");
    }

    return models;
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    
    // Return fallback models if API call fails
    const fallbackModels = [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: LLMProvider.GEMINI },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: LLMProvider.GEMINI },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: LLMProvider.GEMINI }
    ];
    
    if (error instanceof Error) {
      console.warn(`Using fallback models due to: ${error.message}`);
    }
    
    return fallbackModels;
  }
};

export const generateTitle = async (
  logContent: string,
  analysis: AnalysisResult,
  model: LLMModel
): Promise<string> => {
  const prompt = `
    Based on this network security analysis, generate a concise and descriptive title (max 60 characters).
    The title should capture the main finding or tool used.
    
    Log summary: ${analysis.summary}
    Key findings: ${analysis.keyFindings.slice(0, 2).join(', ')}
    
    Respond with only the title, no quotes or extra text.
  `;

  switch (model.provider) {
    case LLMProvider.GEMINI:
      return await generateTitleWithGemini(prompt, model.id);
    case LLMProvider.OPENAI:
      return await generateTitleWithOpenAI(prompt, model.id);
    case LLMProvider.OLLAMA:
      return await generateTitleWithOllama(prompt, model.id);
    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
};

export const analyzeLog = async (
  logContent: string, 
  model: LLMModel
): Promise<AnalysisResult> => {
  const prompt = `
    You are a cybersecurity expert assisting a CTF player.
    Analyze the following network reconnaissance log.
    Explain what happened, identifying specific errors (e.g., connection refused, permission denied),
    what tools were used, and what this implies about the target's security or the attacker's environment.
    Be concise and professional.
    
    Log content:
    ${logContent}
  `;

  switch (model.provider) {
    case LLMProvider.GEMINI:
      return await analyzeWithGemini(prompt, model.id);
    case LLMProvider.OPENAI:
      return await analyzeWithOpenAI(prompt, model.id);
    case LLMProvider.OLLAMA:
      return await analyzeWithOllama(prompt, model.id);
    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
};

async function analyzeWithGemini(prompt: string, modelId: string): Promise<AnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw createAPIError('Gemini', 'API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: modelId,
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
    throw createAPIError('Gemini', 'No response received from API');
  }

  return JSON.parse(text) as AnalysisResult;
}

async function analyzeWithOpenAI(prompt: string, modelId: string): Promise<AnalysisResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw createAPIError('OpenAI', 'API key is missing. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  
  const response = await openai.chat.completions.create({
    model: modelId,
    messages: [
      {
        role: "system",
        content: "You are a cybersecurity expert assistant. Always respond with valid JSON in the specified format."
      },
      {
        role: "user", 
        content: prompt + "\n\nRespond with a JSON object containing: summary (string), keyFindings (array of strings), securityPosture (string), recommendations (array of strings)."
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw createAPIError('OpenAI', 'No response received from API');
  }

  return JSON.parse(content) as AnalysisResult;
}


async function analyzeWithOllama(prompt: string, modelId: string): Promise<AnalysisResult> {
  const ollamaBaseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        prompt: prompt + "\n\nRespond with a JSON object containing: summary (string), keyFindings (array of strings), securityPosture (string), recommendations (array of strings).",
        stream: false,
        options: {
          temperature: 0.1,
        }
      })
    });

    if (!response.ok) {
      if (response.status === 0 || response.type === 'error') {
        throw new Error("Cannot connect to Ollama. Make sure Ollama is running locally.");
      } else if (response.status === 404) {
        throw new Error(`Model '${modelId}' not found in Ollama. Pull it first with: ollama pull ${modelId}`);
      } else {
        throw new Error(`Ollama API error (${response.status}): ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (!data.response) {
      throw new Error("No response from Ollama");
    }

    // Try to parse the response as JSON, fallback to parsing if needed
    try {
      return JSON.parse(data.response) as AnalysisResult;
    } catch (parseError) {
      // If direct JSON parsing fails, try to extract JSON from the response
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AnalysisResult;
      }
      
      // If still fails, create a structured response from the text
      return {
        summary: data.response.substring(0, 200) + "...",
        keyFindings: [data.response.substring(0, 100) + "..."],
        securityPosture: "Analysis completed but response format was unexpected",
        recommendations: ["Review the full response for detailed analysis"]
      };
    }
  } catch (error) {
    console.error('Error analyzing with Ollama:', error);
    
    if (error instanceof APIError) {
      throw error;
    } else if (error instanceof Error) {
      throw createAPIError('Ollama', `Analysis failed: ${error.message}`, undefined, error);
    }
    
    throw createAPIError('Ollama', 'Unknown error occurred during analysis');
  }
}

async function generateTitleWithGemini(prompt: string, modelId: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw createAPIError('Gemini', 'API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
  });

  const text = response.text;
  if (!text) {
    throw createAPIError('Gemini', 'No response received from API');
  }

  return text.trim().replace(/['"]/g, '');
}

async function generateTitleWithOpenAI(prompt: string, modelId: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw createAPIError('OpenAI', 'API key is missing. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  
  const response = await openai.chat.completions.create({
    model: modelId,
    messages: [
      {
        role: "system",
        content: "Generate concise titles for security analysis reports. Respond with only the title, no quotes."
      },
      {
        role: "user", 
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 50,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw createAPIError('OpenAI', 'No response received from API');
  }

  return content.trim().replace(/['"]/g, '');
}

async function generateTitleWithOllama(prompt: string, modelId: string): Promise<string> {
  const ollamaBaseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        prompt: prompt + "\n\nRespond with only the title, no quotes or extra text.",
        stream: false,
        options: {
          temperature: 0.3,
        }
      })
    });

    if (!response.ok) {
      if (response.status === 0 || response.type === 'error') {
        throw new Error("Cannot connect to Ollama. Make sure Ollama is running locally.");
      } else if (response.status === 404) {
        throw new Error(`Model '${modelId}' not found in Ollama. Pull it first with: ollama pull ${modelId}`);
      } else {
        throw new Error(`Ollama API error (${response.status}): ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (!data.response) {
      throw createAPIError('Ollama', 'No response received from API');
    }

    return data.response.trim().replace(/['"]/g, '');
  } catch (error) {
    console.error('Error generating title with Ollama:', error);
    
    if (error instanceof APIError) {
      throw error;
    } else if (error instanceof Error) {
      throw createAPIError('Ollama', `Title generation failed: ${error.message}`, undefined, error);
    }
    
    throw createAPIError('Ollama', 'Unknown error occurred during title generation');
  }
}

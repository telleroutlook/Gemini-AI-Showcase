import { GoogleGenAI, Chat, Content, Part, GenerateContentResponse, GenerationConfig, Type } from "@google/genai";
import { ChatMessage, Attachment, SessionConfig } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MAX_CONTEXT_MESSAGES = 30; // Maximum number of messages to send to the model (Sliding Window)

/**
 * Helper to clean undefined values from config to prevent SDK issues
 */
const cleanConfig = (config: Record<string, any>): Record<string, any> => {
  return Object.entries(config).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
};

/**
 * Helper for exponential backoff delay
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to generate suggestions if the main model fails to return them in JSON
 */
const generateFallbackSuggestions = async (contextText: string): Promise<string[]> => {
  try {
    const prompt = `Based on the following response, generate exactly 3 short, relevant, and concise follow-up questions the user might ask next. Return ONLY a JSON array of strings, like ["Q1", "Q2", "Q3"].\n\nResponse Context:\n${contextText.slice(0, 2000)}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.warn("Fallback suggestion generation failed", e);
    return [];
  }
};

/**
 * Creates a chat session, optionally restoring history.
 * Configures the session to use Structured Outputs (JSON Schema).
 */
export const createChatSession = (
  history?: ChatMessage[], 
  modelId: string = 'gemini-3-flash-preview',
  config?: SessionConfig
): Chat => {
  let sdkHistory: Content[] | undefined = undefined;

  if (history && history.length > 0) {
    // Optimization: Context Window Pruning
    const messagesToSend = history.slice(-MAX_CONTEXT_MESSAGES);

    sdkHistory = messagesToSend.map(msg => {
      const parts: Part[] = [];
      
      // Handle attachments
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          parts.push({
            inlineData: {
              data: att.data,
              mimeType: att.mimeType
            }
          });
        });
      }
      
      // Add text
      if (msg.text) {
        parts.push({ text: msg.text });
      }

      return {
        role: msg.role,
        parts: parts
      };
    });
  }

  // Define strict output schema for Answer + Suggestions
  const chatResponseSchema = {
    type: Type.OBJECT,
    properties: {
      answer: {
        type: Type.STRING,
        description: "The natural language response to the user. Use Markdown formatting (bold, italics, code blocks, tables, etc) as needed."
      },
      suggestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Exactly 3 short, relevant follow-up questions the user might ask next, based on the answer provided."
      }
    },
    required: ["answer", "suggestions"]
  };

  // Enhanced system instruction with visualization capabilities
  const visualizationCapabilities = `
VISUALIZATION & FORMATTING CAPABILITIES:
You are equipped with a powerful rendering engine. When asked to "draw", "visualize", "create", "design", or "plot" something, **you must prioritize generating code blocks** in one of the following formats over text descriptions. **Do not use ASCII art.**

**Choose the MOST APPROPRIATE format for the user's request:**

1. **SVG (\`svg\` code block)**:
   - **USE FOR:** Vector illustrations (e.g., "draw a plane"), icons, logos, simple artistic drawings, geometric shapes, and static visualizations.
   - **INSTRUCTION:** Generate valid, standalone XML SVG code. Ensure \`viewBox\` and dimensions are set correctly for a responsive container.
   - **Example:** \`\`\`svg <svg viewBox="0 0 100 100">...</svg> \`\`\`

2. **HTML/CSS (\`html\` code block)**:
   - **USE FOR:** UI components (buttons, cards, forms), interactive widgets, animations, dashboards, websites, or complex layouts.
   - **INSTRUCTION:** Generate a complete HTML snippet. Include all necessary CSS in \`<style>\` tags within the same block. You can use standard CSS or Tailwind CSS (via CDN).
   - **Example:** \`\`\`html <button style="color:red">Click</button> \`\`\`

3. **Mermaid (\`mermaid\` code block)**:
   - **USE FOR:** Structural diagrams, flowcharts, sequence diagrams, class diagrams, state charts, Gantt charts, mind maps, and entity-relationship diagrams.
   - **INSTRUCTION:** Use valid Mermaid syntax.
   - **Example:** \`\`\`mermaid graph TD; A-->B; \`\`\`

4. **Math (\`latex\`)**:
   - **USE FOR:** Mathematical equations and formulas.
   - **INSTRUCTION:** Use LaTeX syntax (e.g., $E=mc^2$).

**CRITICAL RULES:**
- **NO ASCII ART**: Never generate text-based drawings (e.g., no characters to form pictures). ALWAYS use SVG for drawings.
- **Visuals First**: If the user asks for a visual, provide the rendering code immediately.
`;

  const baseInstruction = (config?.systemInstruction || "You are a helpful, clever, and futuristic AI assistant powered by Gemini. Your responses should be concise, informative, and engaging.") + 
    "\n" + visualizationCapabilities +
    "\n\nIMPORTANT: You must ALWAYS respond using the JSON schema provided. Return an object with 'answer' (Markdown string) and 'suggestions' (Array of 3 strings). Do not output raw text.";
  
  // Prepare generation config with Schema
  const rawConfig: GenerationConfig = {
    systemInstruction: baseInstruction,
    temperature: config?.temperature,
    responseMimeType: "application/json",
    responseSchema: chatResponseSchema
  };

  if (config?.maxOutputTokens) {
    rawConfig.maxOutputTokens = config.maxOutputTokens;
  }

  // Thinking Config Logic
  if (config?.thinkingBudget && config.thinkingBudget > 0) {
    rawConfig.thinkingConfig = { thinkingBudget: config.thinkingBudget };
    
    // Safety check: if thinking is enabled, maxOutputTokens must be set and > thinkingBudget
    if (!rawConfig.maxOutputTokens) {
      rawConfig.maxOutputTokens = 8192; 
    } else if (rawConfig.maxOutputTokens <= config.thinkingBudget) {
      rawConfig.maxOutputTokens = config.thinkingBudget + 1024;
    }
  }

  return ai.chats.create({
    model: modelId,
    history: sdkHistory,
    config: cleanConfig(rawConfig)
  });
};

/**
 * Generator function for Chat Responses.
 * NOTE: This uses non-streaming 'sendMessage' internally to support Structured Output,
 * but yields the result as a single chunk to maintain interface compatibility.
 */
export async function* streamChatMessage(
  chat: Chat, 
  message: string, 
  attachments?: Attachment[],
  useSearch: boolean = false,
  signal?: AbortSignal
): AsyncGenerator<GenerateContentResponse & { suggestions?: string[] }, void, unknown> {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  let msgParts: Part[] | string = message;

  if (attachments && attachments.length > 0) {
    const attachmentParts: Part[] = attachments.map(att => ({
      inlineData: {
        data: att.data,
        mimeType: att.mimeType 
      }
    }));
    msgParts = [...attachmentParts, { text: message }];
  }

  const config = useSearch ? { tools: [{ googleSearch: {} }] } : undefined;
  
  let retryCount = 0;
  const maxRetries = 3;
  let response: GenerateContentResponse;

  // Retry Loop
  while (true) {
    try {
      // Non-streaming call to enforce JSON Schema
      response = await chat.sendMessage({ 
        message: msgParts as any,
        config: config
      });
      break; 
    } catch (error: any) {
      if (signal?.aborted) throw error;

      const isRetryable = error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('503');
      
      if (isRetryable && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 500;
        console.warn(`Gemini API Error (${error.status}). Retrying in ${delay.toFixed(0)}ms...`);
        await wait(delay);
        continue;
      }
      
      throw error;
    }
  }

  if (signal?.aborted) {
     throw new DOMException('Aborted', 'AbortError');
  }

  // Robust Parsing Logic
  let parsedContent = { answer: '', suggestions: [] as string[] };
  const text = response.text || "";

  if (text) {
    try {
      // Attempt 1: Direct JSON Parse
      parsedContent = JSON.parse(text);
    } catch (e1) {
      try {
        // Attempt 2: Strip Markdown Code Blocks
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedContent = JSON.parse(cleaned);
      } catch (e2) {
         try {
             // Attempt 3: Find first '{' and last '}'
             const startIndex = text.indexOf('{');
             const endIndex = text.lastIndexOf('}');
             if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                 const jsonStr = text.substring(startIndex, endIndex + 1);
                 parsedContent = JSON.parse(jsonStr);
             } else {
                 throw new Error("No JSON structure found");
             }
         } catch (e3) {
             // Fallback: The model likely ignored the schema and outputted raw text.
             // We treat the entire text as the answer.
             console.warn("Structured output parsing failed. Falling back to raw text.", e1);
             parsedContent.answer = text;
             parsedContent.suggestions = []; 
         }
      }
    }
  } else {
    parsedContent.answer = "Error: Empty response from model.";
  }

  // CRITICAL FIX: If suggestions are missing (because parsing failed or model forgot),
  // generate them manually now.
  if (!parsedContent.suggestions || parsedContent.suggestions.length === 0) {
      if (parsedContent.answer && parsedContent.answer.length > 10) {
          const fallbackSuggestions = await generateFallbackSuggestions(parsedContent.answer);
          parsedContent.suggestions = fallbackSuggestions;
      }
  }

  // Create a hybrid object that looks like a standard response but has our parsed data
  const processedResponse = {
    ...response,
    text: parsedContent.answer, // Override text with the inner answer
    suggestions: parsedContent.suggestions, // Attach suggestions
    candidates: response.candidates,
    usageMetadata: response.usageMetadata
  };

  yield processedResponse as any;
}

// Deprecated
export const generateSuggestions = async (
  history: ChatMessage[]
): Promise<string[]> => {
  return [];
};

export const sendChatMessage = async (chat: Chat, message: string): Promise<string> => {
   return "Please use streaming.";
};
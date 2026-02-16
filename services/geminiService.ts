import { GoogleGenAI, Chat, Content, Part, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Attachment, SessionConfig } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const SUGGESTION_SEPARATOR = "---SUGGESTIONS_JSON_START---";

/**
 * Creates a chat session, optionally restoring history.
 */
export const createChatSession = (
  history?: ChatMessage[], 
  modelId: string = 'gemini-3-flash-preview',
  config?: SessionConfig
): Chat => {
  let sdkHistory: Content[] | undefined = undefined;

  if (history && history.length > 0) {
    sdkHistory = history.map(msg => {
      const parts: Part[] = [];
      
      // Handle modern attachments
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
      
      // Handle legacy images
      if ((!msg.attachments) && (msg as any).images && (msg as any).images.length > 0) {
        (msg as any).images.forEach((img: string) => {
           parts.push({
             inlineData: {
               data: img,
               mimeType: 'image/jpeg' 
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

  // System instruction to enforce the suggestion format
  const baseInstruction = config?.systemInstruction || "You are a helpful, clever, and futuristic AI assistant powered by Gemini. Your responses should be concise, informative, and engaging.";
  
  // Strengthened instruction
  const suggestionInstruction = `
    
    SYSTEM_REQUIREMENT:
    After generating your response to the user, you MUST append 3 relevant, short follow-up questions for the user.
    
    CRITICAL FORMATTING RULES:
    1. Output the separator string "${SUGGESTION_SEPARATOR}" on a new line.
    2. Immediately follow the separator with a raw JSON array of strings.
    3. Do NOT use Markdown code blocks (like \`\`\`json) for this array.
    4. Do NOT add any introductory text before the JSON (like "Here are suggestions:").
    5. This section must be the very last part of your output.
    
    Example Output Structure:
    [Your normal helpful response text here...]
    ${SUGGESTION_SEPARATOR}
    ["Why is the sky blue?", "Tell me more about stars", "Explain gravity"]
  `;

  // Prepare generation config
  const generationConfig: any = {
    systemInstruction: baseInstruction + suggestionInstruction,
    temperature: config?.temperature,
  };

  // Add advanced configs if present
  if (config?.maxOutputTokens) {
    generationConfig.maxOutputTokens = config.maxOutputTokens;
  }

  // Thinking Config Logic
  if (config?.thinkingBudget && config.thinkingBudget > 0) {
    generationConfig.thinkingConfig = { thinkingBudget: config.thinkingBudget };
    
    // Safety check: if thinking is enabled, maxOutputTokens must be set and > thinkingBudget
    // If user hasn't set maxOutputTokens, default to a safe value
    if (!generationConfig.maxOutputTokens) {
      generationConfig.maxOutputTokens = 8192; 
    } else if (generationConfig.maxOutputTokens <= config.thinkingBudget) {
      // Ensure there is room for output
      generationConfig.maxOutputTokens = config.thinkingBudget + 1024;
    }
  }

  return ai.chats.create({
    model: modelId,
    history: sdkHistory,
    config: generationConfig
  });
};

/**
 * Generator function for streaming chat responses
 */
export async function* streamChatMessage(
  chat: Chat, 
  message: string, 
  attachments?: Attachment[],
  useSearch: boolean = false
): AsyncGenerator<GenerateContentResponse, void, unknown> {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  try {
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

    const resultStream = await chat.sendMessageStream({ 
      message: msgParts as any,
      config: config
    });

    for await (const chunk of resultStream) {
       yield chunk as GenerateContentResponse;
    }
  } catch (error) {
    console.error("Error generating stream:", error);
    throw error;
  }
}

// Separate generation function is no longer needed but kept for backward compatibility if imports exist
export const generateSuggestions = async (
  history: ChatMessage[],
  lastAiResponse: string
): Promise<string[]> => {
  return [];
};

export const sendChatMessage = async (chat: Chat, message: string): Promise<string> => {
   return "Please use streaming.";
};
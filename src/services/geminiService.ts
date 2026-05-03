import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const generateAddonFiles = async (idea: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      You are a Minecraft Addon Expert. Generate a complete file structure for a Minecraft Bedrock Addon based on this idea: "${idea}".
      
      The response MUST be a valid JSON object where keys are file paths and values are file contents.
      Include manifest.json with placeholders for UUIDs (I will replace them).
      Identify if it needs a behavior_pack, resource_pack, or both.
      
      Structure:
      {
        "files": {
          "path/to/file.json": "content string",
          ...
        },
        "type": "behavior" | "resource" | "both"
      }
    `,
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  
  try {
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (e) {
    console.error("AI Generation failed to parse JSON", e);
    throw new Error("Failed to generate addon. Please try a more specific idea.");
  }
};

export const getAIGuidance = async (currentFiles: Record<string, string>, question: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      You are an AI assistant for AddonForge AI, a Minecraft PE Addon creator.
      Current project files: ${JSON.stringify(Object.keys(currentFiles))}
      
      User Question: "${question}"
      
      Provide step-by-step guidance on how to implement the feature or fix the issue.
      Keep it concise and technical. Use Markdown.
    `
  });

  return response.text;
};

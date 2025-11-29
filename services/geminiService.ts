import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:video/mp4;base64,")
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SYSTEM_INSTRUCTION = `
你是“AI 健身搭子”,一个支持性强,专业且友好的健身教练.
你的目标是分析训练视频,给出动作质量评分(0-100),并提供建设性的反馈.
语气:鼓励,热情,移动端优先,像聊天一样自然.适度使用 emoji.
不要像个机器人.说话要像健身房里热心的朋友.
如果用户的动作有危险,要在友善的前提下坚定地指出安全隐患
语言:简体中文.
`;

export const analyzeVideo = async (file: File): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  
  const base64Data = await fileToGenerativePart(file);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        },
        {
          text: `分析这个训练视频。
          1. 识别动作名称。
          2. 基于动作标准度给出一个分数（0-100）。
          3. 找出 2 个做得好的地方。
          4. 找出最多 3 个需要改进的地方。对于改进建议，请用“我们可以试试...”或“咱们注意...”这种友好的语气开头。
          5. 提供一句友好的总结。
          请确保所有输出均为简体中文。`
        }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          exerciseName: { type: Type.STRING },
          score: { type: Type.INTEGER },
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                point: { type: Type.STRING, description: "Short title of the issue" },
                explanation: { type: Type.STRING, description: "Friendly explanation" },
                correction: { type: Type.STRING, description: "Actionable advice" },
                timestamp: { type: Type.NUMBER, description: "Approximate second in video where this happens, default to 0 if unsure" }
              }
            }
          },
          tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "General tips for this exercise" },
          muscleGroups: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as AnalysisResult;
};

export const chatWithBuddy = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[], 
  message: string,
  context?: string
): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");
  
    const ai = new GoogleGenAI({ apiKey });
    
    // We create a new chat for every request in this stateless demo, 
    // but we preload the history and context.
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + (context ? `\n当前分析的上下文: ${context}` : ''),
      },
      history: history
    });
  
    const result = await chat.sendMessage({ message });
    return result.text || "不好意思，我刚刚走神了。能再说一遍吗？";
};
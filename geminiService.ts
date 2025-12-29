
import { GoogleGenAI, Type } from "@google/genai";
import { TaskType, Exercise, DailySentence, UserProfile } from "./types";

// 获取 AI 实例的辅助函数
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing. Ensure it is set in environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

export async function generateDailySentence(profile: UserProfile): Promise<DailySentence> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere um padrão de escrita avançado em português para o Celpe-Bras. Nível: ${profile.targetLevel}. Forneça: 
    1. O padrão (Português)
    2. Significado (Português + Chinês)
    3. Exemplo (Português)
    4. Um exercício de múltipla escolha (choice) com uma explicação (explicação/解析) bilíngue curta.
    Responda em JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pattern: { type: Type.STRING },
          meaning: { type: Type.STRING },
          example: { type: Type.STRING },
          exercise: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ["id", "question", "options", "answer", "explanation", "type"]
          }
        },
        required: ["pattern", "meaning", "example", "exercise"]
      }
    }
  });
  
  if (!response.text) throw new Error("Empty response from AI");
  return JSON.parse(response.text);
}

export async function generateExercises(task: { type: TaskType, title: string }, profile: UserProfile): Promise<Exercise[]> {
  const ai = getAI();
  const prompt = `Gere exatamente 5 exercícios para a tarefa "${task.title}" (${task.type}) do Celpe-Bras. 
  Nível: ${profile.targetLevel}.
  OBRIGATÓRIO: Todos os exercícios DEVEM ser do tipo 'choice' (múltipla escolha) com 4 opções.
  Inclua uma 'explanation' (explicação/解析) curta em Português e Chinês para cada um.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            type: { type: Type.STRING }
          },
          required: ["id", "question", "options", "answer", "explanation", "type"]
        }
      }
    }
  });

  if (!response.text) throw new Error("Empty response from AI");
  return JSON.parse(response.text);
}

export async function generatePlanFromAI(profile: UserProfile) {
  const ai = getAI();
  const prompt = `Com base em: "${profile.personalDescription}", sugira meta semanal e estágio para Celpe-Bras.
  Nível: ${profile.targetLevel}. 
  Responda em JSON bilíngue (Português/Chinês).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedStage: { type: Type.STRING },
          suggestedGoal: { type: Type.STRING }
        },
        required: ["suggestedStage", "suggestedGoal"]
      }
    }
  });

  if (!response.text) throw new Error("Empty response from AI");
  return JSON.parse(response.text);
}

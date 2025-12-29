
import { GoogleGenAI, Type } from "@google/genai";
import { TaskType, Exercise, DailySentence, UserProfile } from "./types";

export async function generateDailySentence(profile: UserProfile): Promise<DailySentence> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `Com base em: "${profile.personalDescription}", sugira metas semanais divididas em 4 partes para Celpe-Bras.
  Nível: ${profile.targetLevel}. 
  Responda em JSON bilíngue (Português/Chinês) com campos: vocabulary, grammar, skills, habits.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedStage: { type: Type.STRING },
          weeklyGoals: {
            type: Type.OBJECT,
            properties: {
              vocabulary: { type: Type.STRING },
              grammar: { type: Type.STRING },
              skills: { type: Type.STRING },
              habits: { type: Type.STRING }
            },
            required: ["vocabulary", "grammar", "skills", "habits"]
          }
        },
        required: ["suggestedStage", "weeklyGoals"]
      }
    }
  });

  if (!response.text) throw new Error("Empty response from AI");
  return JSON.parse(response.text);
}

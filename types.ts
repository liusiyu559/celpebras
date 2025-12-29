
export enum TaskType {
  VOCABULARY = 'Vocabulário / 词汇',
  GRAMMAR = 'Gramática / 语法',
  WRITING = 'Escrita / 写作',
  LISTENING = 'Audição / 听力',
  SPEAKING = 'Oralidade / 口语',
  READING = 'Leitura / 阅读'
}

export interface Exercise {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  type: 'choice' | 'text' | 'voice';
}

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  isCompleted: boolean;
  dateAssigned: string; 
  isCarryOver?: boolean;
  exercises?: Exercise[]; // Saved for history
  userAnswers?: Record<number, string>; // Saved for history
}

export interface UserProfile {
  name: string;
  avatar?: string;
  targetLevel: 'Intermediário' | 'Intermediário Superior' | 'Avançado' | 'Avançado Superior';
  dailyTime: number; 
  examDate: string;
  currentStage: string;
  weeklyGoal: string;
  personalDescription: string;
}

export interface DailySentence {
  pattern: string;
  meaning: string;
  example: string;
  exercise: Exercise;
}

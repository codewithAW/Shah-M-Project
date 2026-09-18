import { supabase } from './supabase/client';

export interface QuizGenerationParams {
  topic: string;
  contextText?: string;
  numQuestions: number;
  difficulty: string;
  types: string[];
}

export const aiService = {
  async generateQuiz(params: QuizGenerationParams) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error("Not authenticated");

    const response = await fetch('/api/ai/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || "Failed to generate AI quiz");
    }

    return response.json();
  },

  async generateCompilerQuiz(formData: FormData) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error("Not authenticated");

    const response = await fetch('/api/ai/generate-quiz/compiler', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do NOT set Content-Type to application/json, let browser set multipart/form-data with boundary
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || "Failed to generate AI quiz");
    }

    return response.json();
  },

  async generateQuizFromFile(formData: FormData) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error("Not authenticated");

    const response = await fetch('/api/ai/generate-quiz-from-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || "Failed to generate AI quiz from file");
    }

    return response.json();
  }
};

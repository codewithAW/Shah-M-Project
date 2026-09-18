import { supabase } from './supabase/client';
import type { Quiz, QuizQuestion, QuizQuestionOption } from '../types';

export const quizService = {
  // Quizzes
  async getMyQuizzes() {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, courses(title)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getQuizzesByCourse(courseId: string) {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, courses(title)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getQuiz(id: string) {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, courses(title)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createQuiz(quizData: Partial<Quiz>) {
    const { data, error } = await supabase
      .from('quizzes')
      .insert(quizData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateQuiz(id: string, quizData: Partial<Quiz>) {
    const user = (await supabase.auth.getUser()).data.user;

    const isPublishing = quizData.status === 'published';
    let oldQuiz: any = null;
    if (isPublishing) {
      const { data } = await supabase.from('quizzes').select('status, title, course_id').eq('id', id).single();
      oldQuiz = data;
    }

    const { data, error } = await supabase
      .from('quizzes')
      .update(quizData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    // Create notifications for enrolled students if it was just published
    if (isPublishing && oldQuiz?.status !== 'published' && user) {
      const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('course_id', data.course_id).eq('status', 'active');
      
      if (enrollments && enrollments.length > 0) {
        const notifications = enrollments.map(e => ({
          user_id: e.student_id,
          type: 'QUIZ_PUBLISHED',
          title: 'New Quiz',
          message: `A new quiz "${data.title}" has been published.`,
          link: `/quizzes/${data.id}`,
          course_id: data.course_id,
          created_by: user.id
        }));
        
        supabase.from('notifications').insert(notifications).then(res => {
          if (res.error) console.error("Batch Notify Error:", res.error);
        });
      }
    }

    return data;
  },

  async deleteQuiz(id: string) {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Questions and Options
  async getQuizQuestions(quizId: string, forStudent: boolean = false) {
    // For students, RLS handles stripping the correct answer depending on configuration, 
    // but we can just fetch normally and trust the secure View/RLS logic.
    // However, our Postgres setup uses basic RLS. The frontend shouldn't query `is_correct` when `forStudent` is true.
    const { data: questions, error: qErr } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });
    
    if (qErr) throw qErr;

    if (questions.length === 0) return [];

    const questionIds = questions.map(q => q.id);
    const { data: options, error: oErr } = await supabase
      .from('quiz_question_options')
      .select('*')
      .in('question_id', questionIds)
      .order('option_order', { ascending: true });
      
    if (oErr) throw oErr;

    // Attach options to questions (strip is_correct if forStudent)
    return questions.map(q => ({
      ...q,
      options: options?.filter(o => o.question_id === q.id).map(o => {
        if (forStudent) {
          const { is_correct, ...safeOption } = o;
          return safeOption;
        }
        return o;
      }) || []
    }));
  },

  async createQuestion(questionData: Partial<QuizQuestion>, options: Partial<QuizQuestionOption>[] = []) {
    const { data: question, error: qErr } = await supabase
      .from('quiz_questions')
      .insert(questionData)
      .select()
      .single();
      
    if (qErr) throw qErr;

    if (options.length > 0) {
      const optionsToInsert = options.map(o => ({ ...o, question_id: question.id }));
      const { error: oErr } = await supabase
        .from('quiz_question_options')
        .insert(optionsToInsert);
      if (oErr) console.error("Error inserting options:", oErr);
    }
    
    return question;
  },

  async deleteQuestion(id: string) {
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Attempts
  async startAttempt(quizId: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const response = await fetch('/api/quiz/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quizId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to start quiz attempt");
    }

    return await response.json();
  },

  async getAttempt(attemptId: string) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(*)')
      .eq('id', attemptId)
      .single();
    if (error) throw error;
    return data;
  },

  async getAttemptAnswers(attemptId: string) {
    const { data, error } = await supabase
      .from('quiz_answers')
      .select('*, quiz_questions(*, quiz_question_options(*))')
      .eq('attempt_id', attemptId);
    if (error) throw error;
    return data;
  },
  
  async getStudentAttempts(quizId: string, studentId: string) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .order('started_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getQuizSubmissions(quizId: string) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*, profiles(full_name, roll_number)')
      .eq('quiz_id', quizId)
      .in('status', ['submitted', 'auto_submitted', 'graded', 'cheating_detected'])
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async giveStudentAnotherChance(attemptId: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`/api/quiz/attempt/${attemptId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || "Failed to give another chance");
    }
  },

  // Server-side submission
  async submitQuizAttempt(attemptId: string, answers: any[], isCheating: boolean = false) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ attemptId, answers, isCheating })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || "Failed to submit quiz");
    }

    return response.json();
  },

  async logIntegrityEvent(attemptId: string, eventType: string, metadata?: any) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return;

    try {
      await fetch('/api/quiz/integrity-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          attemptId,
          eventType,
          metadata
        })
      });
    } catch (err) {
      console.error("Failed to log integrity event", err);
    }
  },

  async submitCheatingEvent(attemptId: string, violationEvent: string, metadata?: any) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const response = await fetch('/api/quiz/cheating', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ attemptId, violationEvent, metadata })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || "Failed to submit cheating event");
    }

    return response.json();
  }
};

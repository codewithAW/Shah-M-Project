// @ts-nocheck
import type { Course, Lecture, Assignment, Quiz, Notification, Result } from '../types';

// FUTURE PHASE MOCK DATA
// This data will be replaced when Assignments, Quizzes, and Results are migrated to the database.

export const mockAssignments: Assignment[] = [
  {
    id: 'a-1',
    courseId: 'c-1',
    title: 'Mid-term Integration Project',
    description: 'Solve the provided complex integrals and write a brief explanation of your methodology for each.',
    dueDate: '2026-10-15T23:59:59Z',
    totalMarks: 100,
    status: 'published'
  },
  {
    id: 'a-2',
    courseId: 'c-2',
    title: 'Kinematics Lab Report',
    description: 'Analyze the dataset from the virtual lab and calculate acceleration, velocity, and displacement.',
    dueDate: '2026-10-20T23:59:59Z',
    totalMarks: 50,
    status: 'published'
  }
];

export const mockQuizzes: Quiz[] = [
  {
    id: 'q-1',
    courseId: 'c-1',
    title: 'Calculus II Concept Check 1',
    description: 'Test your understanding of the first 3 chapters. This quiz is timed.',
    timeLimit: 30,
    totalMarks: 50,
    status: 'published',
    questions: [
      {
        id: 'qq-1',
        type: 'mcq',
        text: 'What is the integral of e^x?',
        options: ['e^x', 'x^e', 'ln(x)', '1/x'],
        correctOptionIndex: 0,
        marks: 5
      },
      {
        id: 'qq-2',
        type: 'written',
        text: 'Explain the fundamental theorem of calculus in your own words.',
        marks: 15
      }
    ]
  }
];


export const mockResults: Result[] = [
  {
    id: 'res-1',
    studentId: 's-1',
    courseId: 'c-1',
    assessmentId: 'q-1',
    type: 'quiz',
    score: 45,
    totalMarks: 50,
    feedback: 'Excellent work on the written portion.',
    date: '2026-09-12'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'n-1',
    userId: 's-1',
    title: 'New Assignment Posted',
    message: 'Mid-term Integration Project has been posted in Calculus II.',
    date: '2026-09-15T10:00:00Z',
    read: false,
    type: 'info'
  },
  {
    id: 'n-2',
    userId: 's-1',
    title: 'Quiz Graded',
    message: 'Your Calculus II Concept Check 1 has been graded. Score: 45/50.',
    date: '2026-09-13T14:30:00Z',
    read: true,
    type: 'success'
  }
];

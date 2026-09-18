import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { quizService } from '../../services/quizService';
import { useAuth } from '../../hooks/useAuth';
import type { Quiz as QuizType, QuizQuestion, QuizAttempt } from '../../types';

export function Quiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true' && profile?.role === 'teacher';
  
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<any[]>([]);

  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { optionId: string | null, text: string | null }>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCheating, setIsCheating] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const leaveTimeRef = useRef<number>(0);
  const tabTimeoutRef = useRef<number | null>(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadQuizData = useCallback(async () => {
    setIsLoading(true);
    try {
      const qData = await quizService.getQuiz(quizId!);
      setQuiz(qData);

      if (isPreview) {
        return;
      }

      // Check for active attempt
      const attempts = await quizService.getStudentAttempts(quizId!, profile!.id);
      
      if (attempts.length > 0) {
        setLatestAttempt(attempts[0]);
      }

      const active = attempts.find(a => a.status === 'in_progress');
      
      if (active) {
        setAttempt(active);
        // Do not auto-start; wait for user to click "Resume Quiz"
        const qs = await quizService.getQuizQuestions(quizId!, true);
        if (qs.length > 0) {
          setQuestions(qs);
        } else {
          // Edge case: quiz has no questions but attempt exists
          setQuestions([]);
        }
        
        // Restore local answers if available
        const localAns = localStorage.getItem(`quiz_answers_${active.id}`);
        if (localAns) {
          setAnswers(JSON.parse(localAns));
        }

        // Resume timer
        if (qData.duration_minutes) {
          const startTime = new Date(active.started_at).getTime();
          const elapsed = (Date.now() - startTime) / 1000;
          const remaining = Math.max(0, (qData.duration_minutes * 60) - Math.floor(elapsed));
          setTimeLeft(remaining);
        }
      } else if (attempts.length >= qData.max_attempts && !attempts.find(a => a.status==='in_progress')) {
        // Just let them view the intro screen which will show they reached max attempts
      }

    } catch (err: any) {
      console.error(err);
      Swal.fire("Failed to load quiz.");
    } finally {
      setIsLoading(false);
    }
  }, [quizId, profile, navigate]);

  // Load Quiz Data
  useEffect(() => {
    if (quizId && profile) loadQuizData();
  }, [quizId, profile, loadQuizData]);

  // Local Autosave
  useEffect(() => {
    if (attempt && hasStarted) {
      localStorage.setItem(`quiz_answers_${attempt.id}`, JSON.stringify(answers));
    }
  }, [answers, attempt, hasStarted]);

  // Exam Integrity Events
  useEffect(() => {
    if (!hasStarted || !quiz?.is_integrity_mode_enabled || !attempt || isSubmitted || isPreview) return;

    const logEvent = (type: string, meta: any) => {
      quizService.logIntegrityEvent(attempt.id, type, meta);
      setWarnings(prev => [...prev, type]);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        leaveTimeRef.current = Date.now();
        tabTimeoutRef.current = window.setTimeout(() => {
          submitAttemptRef.current?.(true, "App backgrounded for more than 5 seconds");
        }, 5000);
        logEvent('TAB_SWITCH', { time: new Date().toISOString() });
      } else {
        if (tabTimeoutRef.current) {
          clearTimeout(tabTimeoutRef.current);
          tabTimeoutRef.current = null;
        }
        const timeAway = Date.now() - leaveTimeRef.current;
        if (timeAway > 5000) {
          submitAttemptRef.current?.(true, "App backgrounded for more than 5 seconds");
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Warning!',
            text: `You left the quiz for ${Math.round(timeAway/1000)} seconds. Next time it exceeds 5 seconds, your quiz will be canceled.`,
            timer: 3000
          });
        }
      }
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        logEvent('FULLSCREEN_EXIT', { time: new Date().toISOString() });
        
        let timerInterval: any;
        Swal.fire({
          title: 'Fullscreen Exited!',
          html: 'You must remain in fullscreen mode. Returning in <b></b> seconds or quiz will be canceled.',
          icon: 'error',
          timer: 10000,
          timerProgressBar: true,
          showConfirmButton: true,
          confirmButtonText: 'Back to Full Screen',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            const b = Swal.getHtmlContainer()?.querySelector('b');
            timerInterval = setInterval(() => {
              if (b) {
                b.textContent = Math.ceil((Swal.getTimerLeft() || 0) / 1000).toString();
              }
            }, 100);
          },
          willClose: () => {
            clearInterval(timerInterval);
          }
        }).then((result) => {
          if (result.isConfirmed) {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          } else if (result.dismiss === Swal.DismissReason.timer) {
            submitAttemptRef.current?.(true, "Fullscreen exited for 10 seconds");
          }
        });
      }
    };

    const preventShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'C' || e.key === 'c' || e.key === 'V' || e.key === 'v')) ||
        (e.metaKey && (e.key === 'C' || e.key === 'c' || e.key === 'V' || e.key === 'v'))
      ) {
        e.preventDefault();
        logEvent('KEYBOARD_SHORTCUT', { key: e.key, time: new Date().toISOString() });
        submitAttemptRef.current?.(true, "Prohibited keyboard shortcut used (Cheating Detected)");
      }
    };

    const preventSelect = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("keydown", preventShortcuts);
    document.addEventListener("selectstart", preventSelect);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("keydown", preventShortcuts);
      document.removeEventListener("selectstart", preventSelect);
      if (tabTimeoutRef.current) clearTimeout(tabTimeoutRef.current);
      Swal.close();
    };
  }, [hasStarted, quiz?.is_integrity_mode_enabled, attempt, isSubmitted]);

  // Track state for unmount cheating detection
  const stateRef = useRef({ hasStarted, isSubmitted, attempt, isPreview, isIntegrity: quiz?.is_integrity_mode_enabled });
  useEffect(() => {
    stateRef.current = { hasStarted, isSubmitted, attempt, isPreview, isIntegrity: quiz?.is_integrity_mode_enabled };
  }, [hasStarted, isSubmitted, attempt, isPreview, quiz?.is_integrity_mode_enabled]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const { hasStarted, isSubmitted, attempt, isPreview, isIntegrity } = stateRef.current;
      if (hasStarted && !isSubmitted && attempt && isIntegrity && !isPreview) {
        // Submit instantly on page reload/close
        quizService.submitCheatingEvent(attempt.id, "Page closed or reloaded").catch(() => {});
        // Standard beforeunload warning (though modern browsers often ignore custom text)
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const { hasStarted, isSubmitted, attempt, isPreview, isIntegrity } = stateRef.current;
      // If the component unmounts while in progress (e.g. user clicked a sidebar link)
      if (hasStarted && !isSubmitted && attempt && isIntegrity && !isPreview) {
        // Send a request to mark the attempt as cheating detected
        quizService.submitCheatingEvent(attempt.id, "Page closed or reloaded").catch(() => {});
      }
    };
  }, []);

  const submitAttemptRef = useRef<((isAuto: boolean, reason?: string) => Promise<void>) | null>(null);

  const submitAttempt = useCallback(async (isAuto = false, reason = "Time is up!") => {
    if (isPreview) {
      Swal.fire("Preview Mode: Quiz submitted successfully.");
      setIsSubmitted(true);
      return;
    }
    if (!attempt || isSubmitting) return;
    setIsSubmitting(true);
    
    const isCheatingSubmit = isAuto && (reason !== "Time is up!" || document.hidden);
    if (isCheatingSubmit) {
      setIsCheating(true);
    }
    
    try {
      if (isCheatingSubmit) {
        await quizService.submitCheatingEvent(attempt.id, reason);
      } else {
        const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
          question_id: qId,
          selected_option_id: ans.optionId,
          answer_text: ans.text
        }));
        await quizService.submitQuizAttempt(attempt.id, formattedAnswers, false);
      }
      
      if (isCheatingSubmit && quiz?.is_integrity_mode_enabled) {
        quizService.logIntegrityEvent(attempt.id, 'AUTO_SUBMIT', { reason, time: new Date().toISOString() });
        Swal.fire({
          icon: 'error',
          title: 'Quiz Canceled',
          text: reason,
          confirmButtonText: 'Return to Dashboard'
        });
      } else if (isAuto) {
        Swal.fire({
          icon: 'info',
          title: 'Time is up!',
          text: 'Your quiz was automatically submitted.',
          confirmButtonText: 'View Results'
        });
      }

      // Clear local storage
      localStorage.removeItem(`quiz_answers_${attempt.id}`);
      setIsSubmitted(true);
      
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(()=>{});
      }
    } catch(err: any) {
      Swal.fire("Error submitting: " + err.message);
      setIsSubmitting(false);
    }
  }, [attempt, isSubmitting, answers, quiz, isPreview]);

  useEffect(() => {
    submitAttemptRef.current = submitAttempt;
  }, [submitAttempt]);

  // Timer
  useEffect(() => {
    if (hasStarted && !isSubmitted && !isSubmitting && timeLeft !== null && timeLeft > 0) {
      const id = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(id);
            if (submitAttemptRef.current) {
              submitAttemptRef.current(true, "Time is up!");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      timerRef.current = id;
      
      return () => {
        clearInterval(id);
      };
    }
    // Only re-run if these top-level state flags change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, isSubmitted, isSubmitting]);

  const handleStart = async () => {
    if (!quiz || !profile) return;
    try {
      if (quiz.is_integrity_mode_enabled) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {
            console.log("Fullscreen request denied or not supported");
          });
        }
      }

      if (isPreview) {
        const qs = await quizService.getQuizQuestions(quiz.id, true);
        if (qs.length === 0) {
          return Swal.fire("This quiz has no questions yet.");
        }
        setQuestions(qs);
        setHasStarted(true);
        if (quiz.duration_minutes) {
          setTimeLeft(quiz.duration_minutes * 60);
        }
        return;
      }

      const qs = await quizService.getQuizQuestions(quiz.id, true);
      
      if (qs.length === 0) {
        return Swal.fire("This quiz has no questions yet.");
      }

      if (attempt && attempt.status === 'in_progress') {
        setHasStarted(true);
        return;
      }

      setQuestions(qs);
      
      const newAttempt = await quizService.startAttempt(quiz.id);
      setAttempt(newAttempt);
      
      if (quiz.duration_minutes) {
        setTimeLeft(quiz.duration_minutes * 60);
      }
      setHasStarted(true);
    } catch(err: any) {
      Swal.fire(err.message);
    }
  };

  const handleViewResults = async () => {
    if (!latestAttempt) return;
    setShowResults(true);
    try {
      const data = await quizService.getAttemptAnswers(latestAttempt.id);
      setResultsData(data);
    } catch (err: any) {
      Swal.fire("Failed to load results: " + err.message);
      setShowResults(false);
    }
  };



  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const preventCopyPaste = (e: any) => {
    if (isPreview) return;
    if (quiz?.is_integrity_mode_enabled) {
      e.preventDefault();
      if (attempt) {
        quizService.logIntegrityEvent(attempt.id, e.type === 'copy' ? 'COPY_ATTEMPT' : 'PASTE_ATTEMPT', { time: new Date().toISOString() });
        submitAttemptRef.current?.(true, `Prohibited ${e.type} action detected (Cheating)`);
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (!quiz) return <div className="text-center p-20">Quiz not found</div>;

  if (isSubmitted) {
    if (isCheating) {
      return (
        <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
          <div className="h-24 w-24 rounded-full bg-error/20 text-error flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold text-error">Cheating Detected</h1>
          <p className="text-lg text-muted-foreground">
            You will not be able to restart the quiz. Good luck.
          </p>
          <div className="pt-8">
            <Link to="/dashboard">
              <GlassButton variant="secondary" size="lg">Return to Dashboard</GlassButton>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
        <div className="h-24 w-24 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold">Quiz Submitted Successfully!</h1>
        <p className="text-lg text-muted-foreground">
          Your answers have been securely recorded. Objective marks are calculated server-side.
        </p>
        <div className="pt-8">
          <Link to="/results">
            <GlassButton variant="primary" size="lg">View Results</GlassButton>
          </Link>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="max-w-3xl mx-auto">
        <GlassCard className="p-8 md:p-12 text-center border-t-4 border-t-primary">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{quiz.title}</h1>
          
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto whitespace-pre-wrap">{quiz.instructions || quiz.description}</p>
          
          {quiz.is_integrity_mode_enabled && !isPreview && (
            <div className="mb-8 p-4 rounded-xl border border-warning/50 bg-warning/10 text-left flex items-start gap-3 max-w-xl mx-auto">
              <AlertTriangle className="text-warning h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-warning mb-1">Exam Integrity Mode is Enabled</h4>
                <p className="text-sm text-foreground/80">
                  This quiz is monitored. Leaving the tab, exiting fullscreen, or attempting to copy/paste will be recorded and flagged to your teacher. Please ensure you are ready before starting.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-12">
            <div className="glass-panel p-4 rounded-xl">
              <div className="text-2xl font-bold text-foreground">{quiz.passing_percentage}%</div>
              <div className="text-xs text-muted-foreground">Passing Score</div>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <div className="text-2xl font-bold text-primary flex justify-center items-center gap-1">
                <Clock className="h-5 w-5" /> {quiz.duration_minutes || 'Unlimited'}
              </div>
              <div className="text-xs text-muted-foreground">Minutes</div>
            </div>
          </div>

          {!isPreview && (
            <div className="text-sm text-muted-foreground mb-8 text-left space-y-2 max-w-sm mx-auto">
              <p>• Make sure you have a stable internet connection.</p>
              <p>• Do not refresh the page during the quiz.</p>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            {latestAttempt?.status === 'cheating_detected' ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <GlassButton variant="secondary" size="lg" className="w-full sm:w-auto px-12 border-error text-error bg-error/10 cursor-not-allowed opacity-100 font-bold" disabled>
                  <AlertTriangle className="h-5 w-5 mr-2 inline-block" />
                  Cheating Detected
                </GlassButton>
                <p className="text-sm text-error/80 font-medium">No submission accepted.</p>
              </div>
            ) : ['submitted', 'auto_submitted', 'graded'].includes(latestAttempt?.status || '') ? (
              <>
                <GlassButton variant="secondary" size="lg" className="w-full sm:w-auto px-12 bg-success/20 text-success border-success cursor-not-allowed opacity-100 font-bold" disabled>
                  Quiz Submitted Successfully
                </GlassButton>
                <GlassButton variant="primary" size="lg" className="w-full sm:w-auto px-12" onClick={handleViewResults}>
                  View Results
                </GlassButton>
              </>
            ) : (
              <GlassButton variant="primary" size="lg" className="w-full sm:w-auto px-12" onClick={handleStart}>
                {isPreview ? 'Start Preview' : latestAttempt?.status === 'in_progress' ? 'Resume Quiz' : 'Start Quiz Now'}
              </GlassButton>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  if (showResults && latestAttempt) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Quiz Results: {quiz.title}</h2>
          <GlassButton variant="secondary" onClick={() => setShowResults(false)}>Back</GlassButton>
        </div>
        
        {resultsData.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div>
        ) : (
          resultsData.map((ans, idx) => {
            const q = ans.quiz_questions;
            const isCorrect = ans.is_correct;
            return (
              <GlassCard key={ans.id} className={`p-6 border-l-4 ${isCorrect === true ? 'border-l-success' : isCorrect === false ? 'border-l-error' : 'border-l-glass-highlight'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium"><span className="text-muted-foreground mr-2">{idx + 1}.</span> {q.question_text}</h3>
                  <div className={`text-sm font-bold ${isCorrect === true ? 'text-success' : isCorrect === false ? 'text-error' : 'text-muted-foreground'}`}>
                    {ans.marks_awarded} / {q.marks} Marks
                  </div>
                </div>

                {(q.question_type === 'mcq' || q.question_type === 'true_false') && q.quiz_question_options && (
                  <div className="space-y-2 mt-4 ml-6">
                    {q.quiz_question_options.map((opt: any) => {
                      // If the student selected this option
                      const isSelected = ans.selected_option_id === opt.id;
                      const isActuallyCorrect = opt.is_correct;
                      
                      let bgClass = 'bg-glass/50 border-glass-highlight';
                      let textClass = 'text-foreground';
                      
                      if (isSelected && isCorrect) {
                        bgClass = 'bg-success/20 border-success shadow-[0_0_10px_rgba(34,197,94,0.2)]';
                        textClass = 'text-success font-bold';
                      } else if (isSelected && !isCorrect) {
                        bgClass = 'bg-error/20 border-error shadow-[0_0_10px_rgba(239,68,68,0.2)]';
                        textClass = 'text-error font-bold';
                      } else if (isActuallyCorrect) {
                        // Highlight the actual correct answer that they missed
                        bgClass = 'bg-success/10 border-success/50 border-dashed';
                        textClass = 'text-success font-semibold';
                      }

                      return (
                        <div key={opt.id} className={`p-3 rounded-lg border ${bgClass} transition-colors flex justify-between items-center`}>
                          <span className={textClass}>{opt.option_text}</span>
                          {isSelected && <span className="text-xs opacity-70 ml-2">(Your Answer)</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {(q.question_type === 'short_answer' || q.question_type === 'written') && (
                  <div className="mt-4 ml-6 p-4 rounded-lg bg-glass/20 border border-glass-highlight">
                    <p className="text-sm font-medium mb-1 text-muted-foreground">Your Answer:</p>
                    <p className="text-sm">{ans.answer_text || 'No answer provided'}</p>
                  </div>
                )}
              </GlassCard>
            );
          })
        )}
      </div>
    );
  }

  if (latestAttempt?.status === 'cheating_detected' && hasStarted) {
    // If somehow bypassed via state, force fallback to cheating screen
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
        <div className="h-24 w-24 rounded-full bg-error/20 text-error flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold text-error">Cheating Detected</h1>
        <p className="text-lg text-muted-foreground">
          You will not be able to restart the quiz. Good luck.
        </p>
        <div className="pt-8">
          <Link to="/dashboard">
            <GlassButton variant="secondary" size="lg">Return to Dashboard</GlassButton>
          </Link>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestionIdx];

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <GlassCard className="p-12">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Questions Found</h2>
          <p className="text-muted-foreground">This quiz does not have any questions available.</p>
          <GlassButton variant="primary" className="mt-6" onClick={() => navigate('/dashboard')}>Return to Dashboard</GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="max-w-4xl mx-auto" 
      onCopy={preventCopyPaste} 
      onPaste={preventCopyPaste}
      onContextMenu={e => {
        if (quiz?.is_integrity_mode_enabled && !isPreview) {
          e.preventDefault();
          if (attempt) {
            quizService.logIntegrityEvent(attempt.id, 'CONTEXT_MENU', { time: new Date().toISOString() });
            submitAttemptRef.current?.(true, "Right-click context menu prohibited (Cheating)");
          }
        }
      }}
    >
      {warnings.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-warning/20 border border-warning/50 text-warning text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Warning: Integrity violation recorded ({warnings[warnings.length-1]}). Please remain focused on the quiz.
        </div>
      )}

      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-glass-highlight sticky top-16 bg-background/80 backdrop-blur-md z-10">
        <div>
          <h2 className="text-xl font-bold">{quiz.title}</h2>
          <p className="text-sm text-muted-foreground">Question {currentQuestionIdx + 1} of {questions.length}</p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-error/20 text-error animate-pulse' : 'bg-primary/10 text-primary'}`}>
            <Clock className="h-5 w-5" /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-glass-highlight rounded-full mb-12 overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <GlassCard className="p-8 mb-8 min-h-[300px]">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-medium leading-relaxed">{question.question_text}</h3>
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap ml-4">
            {question.marks} Marks
          </span>
        </div>

        {(question.question_type === 'mcq' || question.question_type === 'true_false') && question.options && (
          <div className="space-y-3 mt-8">
            {question.options.map((option, idx) => {
              const isSelected = answers[question.id]?.optionId === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setAnswers(prev => ({ ...prev, [question.id]: { optionId: option.id, text: null } }))}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary' 
                      : 'border-glass-highlight bg-glass/50 hover:bg-glass hover:border-muted-foreground'
                  }`}
                >
                  <span className="inline-block w-6 font-medium opacity-50 mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {option.option_text}
                </button>
              );
            })}
          </div>
        )}

        {(question.question_type === 'short_answer' || question.question_type === 'written') && (
          <div className="mt-8">
            <textarea
              className="w-full h-48 rounded-xl border border-glass-highlight bg-glass/50 p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-colors"
              placeholder="Type your detailed answer here..."
              value={answers[question.id]?.text || ''}
              onChange={e => setAnswers(prev => ({ ...prev, [question.id]: { optionId: null, text: e.target.value } }))}
            ></textarea>
          </div>
        )}
      </GlassCard>

      {/* Navigation */}
      <div className="flex justify-between items-center mb-20">
        <GlassButton 
          variant="secondary" 
          onClick={handlePrev}
          disabled={currentQuestionIdx === 0}
        >
          Previous
        </GlassButton>

        {currentQuestionIdx === questions.length - 1 ? (
          <GlassButton variant="primary" onClick={() => submitAttempt(false)} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </GlassButton>
        ) : (
          <GlassButton variant="primary" onClick={handleNext}>
            Next Question
          </GlassButton>
        )}
      </div>
    </div>
  );
}

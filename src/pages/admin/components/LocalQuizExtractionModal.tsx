import { useState } from 'react';
import { X, FileText, UploadCloud, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { GlassInput } from '../../../components/ui/GlassInput';
import { extractTextFromFile, parseQuestions } from '../../../utils/localQuizParser';
import type { DraftQuestion } from '../../../utils/localQuizParser';
import { quizService } from '../../../services/quizService';
import type { Quiz } from '../../../types';
import Swal from 'sweetalert2';


export function LocalQuizExtractionModal({ quiz, onClose }: { quiz: Quiz, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleProcess = async () => {
    if (!file) return Swal.fire('Please select a file.');
    setIsProcessing(true);
    setProgressText('Initializing...');
    setProgressValue(0);

    try {
      const text = await extractTextFromFile(file, (status, progress) => {
        setProgressText(status);
        setProgressValue(progress);
      });
      
      setProgressText('Parsing questions...');
      const parsed = await parseQuestions(text);
      setDraftQuestions(parsed);
    } catch (err: any) {
      Swal.fire("Extraction failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateQuestion = (idx: number, updates: Partial<DraftQuestion>) => {
    if (!draftQuestions) return;
    const newQs = [...draftQuestions];
    newQs[idx] = { ...newQs[idx], ...updates };
    setDraftQuestions(newQs);
  };

  const updateOption = (qIdx: number, oIdx: number, text: string) => {
    if (!draftQuestions) return;
    const newQs = [...draftQuestions];
    newQs[qIdx].options![oIdx].option_text = text;
    setDraftQuestions(newQs);
  };

  const setCorrectOption = (qIdx: number, oIdx: number) => {
    if (!draftQuestions) return;
    const newQs = [...draftQuestions];
    newQs[qIdx].options = newQs[qIdx].options!.map((o, i) => ({ ...o, is_correct: i === oIdx }));
    // Clear validation warning if any
    newQs[qIdx].validationWarning = undefined;
    setDraftQuestions(newQs);
  };

  const handleSave = async () => {
    if (!draftQuestions) return;
    
    // Validate
    for (let i = 0; i < draftQuestions.length; i++) {
      const q = draftQuestions[i];
      if (!q.question_text.trim()) {
        return Swal.fire(`Question ${i+1} has empty text.`);
      }
      if (q.question_type === 'mcq' && q.options) {
        if (q.options.length < 2) return Swal.fire(`Question ${i+1} must have at least 2 options.`);
        if (!q.options.some(o => o.is_correct)) return Swal.fire(`Question ${i+1} requires a correct option selected.`);
      }
    }

    setIsSaving(true);
    try {
      // Get max order
      const existing = await quizService.getQuizQuestions(quiz.id);
      let order = existing.length > 0 ? Math.max(...existing.map(e => e.question_order)) + 1 : 1;

      for (const q of draftQuestions) {
        const options = (q.question_type === 'mcq' || q.question_type === 'true_false') && q.options 
          ? q.options.map((o, idx) => ({
              option_text: o.option_text,
              option_order: idx + 1,
              is_correct: o.is_correct
            }))
          : [];

        await quizService.createQuestion({
          quiz_id: quiz.id,
          question_type: q.question_type,
          question_text: q.question_text,
          marks: q.marks || 1,
          explanation: q.explanation || '',
          question_order: order++
        }, options);
      }
      Swal.fire("Local Quiz Extraction Saved!");
      onClose();
    } catch(err: any) {
      Swal.fire("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-5xl p-0 flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-glass-highlight flex justify-between items-center bg-glass-highlight/30">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2"><FileText className="text-primary" /> Local Quiz Extractor</h3>
            <p className="text-sm text-muted-foreground">Extract questions from PDF or Image offline (No API required)</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {!draftQuestions ? (
            <div className="max-w-md mx-auto py-12 space-y-8">
              <div className="text-center">
                <UploadCloud className="h-16 w-16 mx-auto mb-4 text-primary opacity-50" />
                <h4 className="text-lg font-semibold">Upload Document</h4>
                <p className="text-sm text-muted-foreground">Supported formats: PDF, JPG, PNG, WEBP</p>
              </div>

              <div className="p-4 rounded-xl border border-glass-highlight bg-glass/20">
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-primary animate-pulse">{progressText}</span>
                    <span>{Math.round(progressValue)}%</span>
                  </div>
                  <div className="w-full h-2 bg-glass-highlight rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressValue}%` }}></div>
                  </div>
                </div>
              )}

              <GlassButton variant="primary" className="w-full" onClick={handleProcess} disabled={isProcessing || !file}>
                {isProcessing ? 'Processing...' : 'Start Extraction'}
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-6 pb-12">
              <div className="flex justify-between items-end border-b border-glass-highlight pb-4">
                <div>
                  <h4 className="font-bold text-xl">Review Extracted Questions</h4>
                  <p className="text-sm text-muted-foreground">
                    Found {draftQuestions.length} questions. Please review and fix any OCR errors.
                  </p>
                </div>
                <GlassButton variant="primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save to Quiz'}
                </GlassButton>
              </div>

              {draftQuestions.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  No questions could be extracted. Please ensure the document is clear.
                </div>
              ) : (
                <div className="space-y-6">
                  {draftQuestions.map((q, qIdx) => (
                    <div key={q.id} className="p-5 rounded-xl border border-glass-highlight bg-glass/20 relative">
                      {q.validationWarning && (
                        <div className="mb-4 p-3 rounded-lg bg-warning/20 border border-warning/50 text-warning text-sm font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          {q.validationWarning}
                        </div>
                      )}
                      
                      <div className="flex gap-4 mb-4">
                        <div className="w-1/3">
                          <label className="block text-xs font-medium mb-1 text-muted-foreground">Type</label>
                          <select 
                            className="w-full h-9 px-3 rounded-lg border border-glass-highlight bg-glass/50 text-sm focus:outline-none" 
                            value={q.question_type} 
                            onChange={e => updateQuestion(qIdx, { question_type: e.target.value as any })}
                          >
                            <option value="mcq">Multiple Choice</option>
                            <option value="true_false">True / False</option>
                            <option value="short_answer">Short Answer</option>
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium mb-1 text-muted-foreground">Marks</label>
                          <GlassInput type="number" min="1" value={q.marks} onChange={e => updateQuestion(qIdx, { marks: Number(e.target.value) })} />
                        </div>
                        <div className="ml-auto">
                           <GlassButton variant="ghost" size="sm" className="text-error" onClick={() => setDraftQuestions(draftQuestions.filter((_, i) => i !== qIdx))}>
                             <Trash2 className="h-4 w-4" />
                           </GlassButton>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">Question Text</label>
                        <textarea 
                          className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-glass-highlight bg-glass/50 text-sm focus:outline-none focus:border-primary resize-y" 
                          value={q.question_text} 
                          onChange={e => updateQuestion(qIdx, { question_text: e.target.value })} 
                        />
                      </div>

                      {q.question_type === 'mcq' && q.options && (
                        <div className="pl-4 border-l-2 border-glass-highlight space-y-2">
                          <label className="block text-xs font-medium text-muted-foreground">Options (Select Correct)</label>
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                name={`correct-${q.id}`} 
                                checked={opt.is_correct} 
                                onChange={() => setCorrectOption(qIdx, oIdx)} 
                                className="w-4 h-4 accent-primary" 
                              />
                              <input 
                                type="text"
                                className={`flex-1 h-9 px-3 rounded-lg border text-sm focus:outline-none ${opt.is_correct ? 'border-success/50 bg-success/10 text-success' : 'border-glass-highlight bg-glass/50'}`}
                                value={opt.option_text} 
                                onChange={e => updateOption(qIdx, oIdx, e.target.value)} 
                              />
                              <GlassButton 
                                variant="ghost" size="sm" className="text-error px-2 py-0" 
                                onClick={() => updateQuestion(qIdx, { options: q.options!.filter((_, i) => i !== oIdx) })}
                              >
                                X
                              </GlassButton>
                            </div>
                          ))}
                          <GlassButton variant="secondary" size="sm" onClick={() => updateQuestion(qIdx, { options: [...q.options!, { option_text: '', is_correct: false }] })}>
                            <Plus className="h-3 w-3 mr-1" /> Add Option
                          </GlassButton>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

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
    <div className="modal-overlay" style={{ zIndex: 60 }}>
      <GlassCard className="modal-content" style={{ maxWidth: '56rem', padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="d-flex justify-between items-center p-6 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div>
            <h3 className="font-bold text-xl d-flex items-center gap-2" style={{ color: 'var(--color-foreground)' }}>
              <FileText style={{ color: 'var(--color-primary)' }} /> Local Quiz Extractor
            </h3>
            <p className="text-sm font-medium text-muted mt-1">Extract questions from PDF or Image offline (No API required)</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted-foreground)' }}>
            <X style={{ height: '1.25rem', width: '1.25rem' }} />
          </button>
        </div>
        
        <div className="d-flex gap-6 p-6" style={{ flex: 1, overflowY: 'hidden' }}>
          
          {/* Controls - Only show when no draft questions exist */}
          {!draftQuestions && (
            <div style={{ width: '100%' }}>
              <div className="form-group mb-6">
                <label className="form-label mb-3 block">Source File (PDF or Image)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <label className="cursor-pointer m-0">
                    <div className={`btn ${file ? 'btn-danger' : 'btn-primary'} shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2 px-6`} style={{ opacity: isProcessing ? 0.5 : 1, pointerEvents: isProcessing ? 'none' : 'auto' }}>
                      <UploadCloud size={20} />
                      <span>{file ? 'Wrong file! choose another one' : 'choose a file'}</span>
                    </div>
                    <input 
                      type="file" 
                      accept=".pdf,image/*" 
                      style={{ display: 'none' }} 
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      disabled={isProcessing}
                    />
                  </label>
                  
                  {file && (
                    <div 
                      className="text-sm font-medium px-4 py-2"
                      style={{ 
                        backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        color: 'rgb(22, 163, 74)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        maxWidth: '250px',
                        borderRadius: '0.75rem'
                      }}
                    >
                      <FileText size={16} className="shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {isProcessing && (
                <div className="mb-4">
                  <div className="d-flex justify-between text-xs mb-1 font-bold">
                    <span>{progressText}</span>
                    <span>{Math.round(progressValue)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--color-primary)', transition: 'all 0.3s', width: `${progressValue}%` }}></div>
                  </div>
                </div>
              )}

              <GlassButton variant="primary" className="w-full gap-2 mt-4" onClick={handleProcess} disabled={isProcessing || !file}>
                {isProcessing ? 'Processing...' : 'Start Extraction'}
              </GlassButton>
            </div>
          )}

          {/* Preview - Only show when draft questions exist */}
          {draftQuestions && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div className="d-flex flex-col gap-6 pb-12">
                <div className="d-flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                  <div>
                    <h4 className="font-bold text-lg">Review Extracted Questions</h4>
                    <p className="text-sm text-muted mt-1">
                      Found {draftQuestions.length} questions. Please review and fix any OCR errors.
                    </p>
                  </div>
                </div>

                {draftQuestions.length === 0 ? (
                  <div className="empty-state" style={{ height: '200px' }}>
                    <p className="empty-state-desc">No questions could be extracted. Please ensure the document is clear.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-col gap-6">
                    {draftQuestions.map((q, qIdx) => (
                      <div key={q.id} className="p-5 relative" style={{ background: 'rgba(0,0,0,0.03)', border: '2px solid rgba(0,0,0,0.15)', borderRadius: '1rem' }}>
                        {q.validationWarning && (
                          <div className="mb-4 p-3 rounded-lg text-sm font-semibold d-flex items-center gap-2" style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--color-warning)', border: '1px solid rgba(245,158,11,0.5)' }}>
                            <AlertTriangle style={{ height: '1rem', width: '1rem' }} />
                            {q.validationWarning}
                          </div>
                        )}
                        
                        <div className="d-flex gap-4 mb-4">
                          <div style={{ flex: '1 1 33%' }}>
                            <label className="form-label text-xs">Type</label>
                            <select 
                              className="form-input w-full h-9 px-3" 
                              value={q.question_type} 
                              onChange={e => updateQuestion(qIdx, { question_type: e.target.value as any })}
                            >
                              <option value="mcq">Multiple Choice</option>
                              <option value="true_false">True / False</option>
                              <option value="short_answer">Short Answer</option>
                            </select>
                          </div>
                          <div style={{ width: '6rem' }}>
                            <label className="form-label text-xs">Marks</label>
                            <GlassInput type="number" min="1" value={q.marks} onChange={e => updateQuestion(qIdx, { marks: Number(e.target.value) })} />
                          </div>
                          <div className="ml-auto d-flex items-end">
                             <GlassButton variant="ghost" size="sm" className="text-danger" onClick={() => setDraftQuestions(draftQuestions.filter((_, i) => i !== qIdx))}>
                               <Trash2 style={{ height: '1rem', width: '1rem' }} />
                             </GlassButton>
                          </div>
                        </div>

                        <div className="form-group mb-4">
                          <label className="form-label text-xs font-bold text-primary">Question {qIdx + 1}</label>
                          <textarea 
                            className="form-input w-full mt-1"
                            style={{ minHeight: '60px', resize: 'vertical' }}
                            value={q.question_text} 
                            onChange={e => updateQuestion(qIdx, { question_text: e.target.value })} 
                          />
                        </div>

                        {q.question_type === 'mcq' && q.options && (
                          <div className="pl-4 d-flex flex-col gap-2" style={{ borderLeft: '2px solid rgba(0,0,0,0.1)' }}>
                            <label className="form-label text-xs">Options (Select Correct)</label>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="d-flex items-center gap-2">
                                <input 
                                  type="radio" 
                                  name={`correct-${q.id}`} 
                                  checked={opt.is_correct} 
                                  onChange={() => setCorrectOption(qIdx, oIdx)} 
                                  style={{ accentColor: 'var(--color-primary)', width: '1rem', height: '1rem' }} 
                                />
                                <span className="font-bold text-sm text-muted w-4 text-center">{String.fromCharCode(65 + oIdx)}.</span>
                                <input 
                                  type="text"
                                  className="form-input flex-1 h-9 px-3"
                                  style={opt.is_correct ? { borderColor: 'rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.1)', color: '#064e3b', fontWeight: '500' } : {}}
                                  value={opt.option_text} 
                                  onChange={e => updateOption(qIdx, oIdx, e.target.value)} 
                                />
                                <GlassButton 
                                  variant="ghost" size="sm" className="text-danger px-2 py-0" 
                                  onClick={() => updateQuestion(qIdx, { options: q.options!.filter((_, i) => i !== oIdx) })}
                                >
                                  <X style={{ height: '1rem', width: '1rem' }} />
                                </GlassButton>
                              </div>
                            ))}
                            <GlassButton variant="secondary" size="sm" className="w-fit mt-2" onClick={() => updateQuestion(qIdx, { options: [...q.options!, { option_text: '', is_correct: false }] })}>
                              <Plus style={{ height: '0.75rem', width: '0.75rem', marginRight: '0.25rem' }} /> Add Option
                            </GlassButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-end gap-3" style={{ background: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <GlassButton variant="ghost" onClick={onClose}>Cancel</GlassButton>
          {draftQuestions && draftQuestions.length > 0 && (
            <GlassButton variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save to Quiz'}
            </GlassButton>
          )}
          {draftQuestions && (
            <GlassButton 
              variant="danger" 
              onClick={() => {
                setDraftQuestions(null);
                setFile(null);
              }}
            >
              Choosed the wrong file ?
            </GlassButton>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

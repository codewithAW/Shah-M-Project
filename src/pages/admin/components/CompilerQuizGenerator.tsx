import { useState } from 'react';
import { Sparkles, X, Wand2, UploadCloud, FileText } from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { GlassInput } from '../../../components/ui/GlassInput';
import { aiService } from '../../../services/aiService';
import { quizService } from '../../../services/quizService';
import type { Quiz } from '../../../types';
import Swal from 'sweetalert2';


interface CompilerQuizGeneratorProps {
  quiz: Quiz;
  onClose: () => void;
}

export function CompilerQuizGenerator({ quiz, onClose }: CompilerQuizGeneratorProps) {
  const [sourceType, setSourceType] = useState<'lecture' | 'pdf' | 'image'>('lecture');
  const [lectureContext, setLectureContext] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftQuiz, setDraftQuiz] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('numQuestions', numQuestions.toString());
      formData.append('sourceType', sourceType);
      
      if (sourceType === 'lecture') {
        if (!lectureContext.trim()) throw new Error("Please provide lecture text.");
        formData.append('lectureContext', lectureContext);
      } else {
        if (!file) throw new Error("Please upload a file.");
        formData.append('file', file);
      }

      const res = await aiService.generateCompilerQuiz(formData);
      setDraftQuiz(res);
    } catch (err: any) {
      Swal.fire(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!draftQuiz) return;
    setIsSaving(true);
    try {
      let order = 1;
      for (const q of draftQuiz.questions) {
        const options = q.options?.map((o: any, idx: number) => ({
          option_text: o.option_text,
          option_order: idx + 1,
          is_correct: o.is_correct
        })) || [];

        await quizService.createQuestion({
          quiz_id: quiz.id,
          question_type: q.question_type,
          question_text: q.question_text,
          marks: q.marks || 1,
          explanation: q.explanation || '',
          question_order: order++
        }, options);
      }
      Swal.fire("AI Questions added successfully!");
      onClose();
    } catch (err: any) {
      Swal.fire("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-4xl p-0 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-glass-highlight flex justify-between items-center bg-glass-highlight/30">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-accent" /> Compiler AI Generator</h3>
            <p className="text-sm text-muted-foreground">Draft advanced questions for: {quiz.title}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          {/* Controls */}
          <div className="w-full md:w-1/3 space-y-6">
            
            <div>
              <label className="block text-sm font-medium mb-2">Source Material Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setSourceType('lecture')}
                  className={`py-2 text-xs font-medium rounded-xl border flex flex-col items-center gap-1 transition-all ${sourceType === 'lecture' ? 'bg-primary/20 border-primary text-primary' : 'border-glass-highlight bg-glass/20 hover:bg-glass/40'}`}
                >
                  <FileText className="h-4 w-4" /> Text
                </button>
                <button 
                  onClick={() => setSourceType('pdf')}
                  className={`py-2 text-xs font-medium rounded-xl border flex flex-col items-center gap-1 transition-all ${sourceType === 'pdf' ? 'bg-primary/20 border-primary text-primary' : 'border-glass-highlight bg-glass/20 hover:bg-glass/40'}`}
                >
                  <FileText className="h-4 w-4" /> PDF
                </button>
                <button 
                  onClick={() => setSourceType('image')}
                  className={`py-2 text-xs font-medium rounded-xl border flex flex-col items-center gap-1 transition-all ${sourceType === 'image' ? 'bg-primary/20 border-primary text-primary' : 'border-glass-highlight bg-glass/20 hover:bg-glass/40'}`}
                >
                  <UploadCloud className="h-4 w-4" /> Image
                </button>
              </div>
            </div>

            {sourceType === 'lecture' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Paste Lecture Text</label>
                <textarea 
                  className="w-full h-32 px-4 py-3 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none"
                  value={lectureContext} onChange={e => setLectureContext(e.target.value)} placeholder="E.g., Lexical analysis is the first phase..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Upload {sourceType === 'pdf' ? 'PDF Document' : 'Image Diagram'}</label>
                <div className="border-2 border-dashed border-glass-highlight rounded-xl p-4 text-center bg-glass/20">
                  <input 
                    type="file" 
                    accept={sourceType === 'pdf' ? "application/pdf" : "image/*"}
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs"
                  />
                  {file && <p className="text-xs text-primary mt-2">{file.name}</p>}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Number of Questions</label>
              <GlassInput type="number" min="1" max="50" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} />
            </div>

            <GlassButton variant="secondary" className="w-full gap-2 border-accent text-accent mt-4" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full" /> : <Wand2 className="h-4 w-4" />}
              {isGenerating ? 'Analyzing & Generating...' : 'Generate Questions'}
            </GlassButton>
          </div>

          {/* Preview */}
          <div className="flex-1 border-l border-glass-highlight pl-8 overflow-y-auto pr-2">
            {!draftQuiz ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center space-y-4">
                <Sparkles className="h-12 w-12 opacity-30" />
                <div>
                  <p className="font-semibold">Gemini 2.5 Flash Integration</p>
                  <p className="text-sm mt-1 max-w-sm">Upload a compiler syllabus, AST diagram, or DFA image to automatically extract deep, contextual quiz questions.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-12">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-lg">AI Generated Draft</h4>
                  <GlassButton variant="primary" size="sm" onClick={handleSaveDraft} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Accept All Questions'}
                  </GlassButton>
                </div>
                {draftQuiz.questions.map((q: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-glass-highlight bg-glass/30">
                    <div className="flex justify-between">
                      <span className="font-mono text-xs text-primary mb-2 block uppercase">{q.question_type} • {q.marks} Marks</span>
                    </div>
                    <p className="font-medium mb-3 text-sm">{idx + 1}. {q.question_text}</p>
                    {q.options && (
                      <div className="space-y-2 ml-4 mb-3">
                        {q.options.map((opt: any, oIdx: number) => (
                          <div key={oIdx} className={`text-xs px-3 py-1.5 rounded-md border ${opt.is_correct ? 'bg-success/20 border-success/30 text-success font-medium' : 'border-glass-highlight'}`}>
                            {opt.option_text}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 border-t border-glass-highlight pt-3 bg-background/30 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Explanation:</span> {q.explanation}</p>
                      {q.source_reference && <p className="text-[10px] text-primary mt-1">Source: {q.source_reference}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Sparkles, X, Settings2, List, Wand2, Eye, FileText } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassBadge } from '../../components/ui/GlassBadge';
import { courseService } from '../../services/courseService';
import { quizService } from '../../services/quizService';
import { aiService } from '../../services/aiService';
import { CompilerQuizGenerator } from './components/CompilerQuizGenerator';
import { LocalQuizExtractionModal } from './components/LocalQuizExtractionModal';
import type { Course, Quiz, QuizQuestion, QuestionType } from '../../types';
import Swal from 'sweetalert2';


export function AdminQuizzes() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  
  // Quiz Details Form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    duration_minutes: 30,
    max_attempts: 1,
    passing_percentage: 50,
    is_integrity_mode_enabled: false
  });

  const fetchCourses = useCallback(async () => {
    try {
      const data = await courseService.getTeacherCourses();
      setCourses(data);
      if (data.length > 0) setSelectedCourse(data[0].id);
    } catch (err: any) {
      Swal.fire(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchQuizzes = useCallback(async (courseId: string) => {
    setIsLoading(true);
    try {
      const data = await quizService.getQuizzesByCourse(courseId);
      setQuizzes(data);
    } catch (err: any) {
      Swal.fire(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      fetchQuizzes(selectedCourse);
    }
  }, [selectedCourse, fetchQuizzes]);

  // Quiz Modal Handlers
  const handleOpenQuizModal = (quiz?: Quiz) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setFormData({
        title: quiz.title,
        description: quiz.description || '',
        instructions: quiz.instructions || '',
        duration_minutes: quiz.duration_minutes || 30,
        max_attempts: quiz.max_attempts,
        passing_percentage: quiz.passing_percentage,
        is_integrity_mode_enabled: quiz.is_integrity_mode_enabled || false
      });
    } else {
      if (!selectedCourse) return Swal.fire("Select a course");
      setEditingQuiz(null);
      setFormData({ title: '', description: '', instructions: '', duration_minutes: 30, max_attempts: 1, passing_percentage: 50, is_integrity_mode_enabled: false });
    }
    setIsQuizModalOpen(true);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuiz) {
        await quizService.updateQuiz(editingQuiz.id, formData);
      } else {
        await quizService.createQuiz({ ...formData, course_id: selectedCourse });
      }
      setIsQuizModalOpen(false);
      fetchQuizzes(selectedCourse);
    } catch (err: any) {
      Swal.fire(err.message);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Delete quiz?')) return;
    try {
      await quizService.deleteQuiz(id);
      fetchQuizzes(selectedCourse);
    } catch (err: any) {
      Swal.fire(err.message);
    }
  };

  const handleStatusToggle = async (quiz: Quiz) => {
    const newStatus = quiz.status === 'published' ? 'draft' : 'published';
    try {
      await quizService.updateQuiz(quiz.id, { 
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null 
      });
      fetchQuizzes(selectedCourse);
    } catch (err: any) {
      Swal.fire(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quizzes</h2>
          <p className="text-muted-foreground">Manage assessments and questions</p>
        </div>
        <div className="w-full sm:w-auto flex flex-wrap gap-2 items-center">
          <select 
            className="w-full sm:w-64 h-10 px-4 rounded-xl border border-glass-highlight bg-glass/80 backdrop-blur-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="" disabled className="bg-background text-foreground">Select a course</option>
            {courses.map(c => (
              <option key={c.id} value={c.id} className="bg-background text-foreground">{c.title}</option>
            ))}
          </select>
          <GlassButton variant="secondary" className="shrink-0" onClick={async () => {
            if (!quizzes.length) return Swal.fire('No quizzes to export');
            const { exportToExcel } = await import('../../utils/exportUtils');
            exportToExcel(quizzes, [
              { header: 'Title', key: 'title' },
              { header: 'Status', key: 'status' },
              { header: 'Duration (mins)', key: 'duration_minutes' },
              { header: 'Max Attempts', key: 'max_attempts' },
              { header: 'Passing %', key: 'passing_percentage' }
            ], 'Quizzes_Export');
          }}>Export Excel</GlassButton>
          <GlassButton variant="secondary" className="shrink-0" onClick={async () => {
            if (!quizzes.length) return Swal.fire('No quizzes to export');
            const { exportToPDF } = await import('../../utils/exportUtils');
            exportToPDF(quizzes, [
              { header: 'Title', key: 'title' },
              { header: 'Status', key: 'status' },
              { header: 'Duration (mins)', key: 'duration_minutes' },
              { header: 'Max Attempts', key: 'max_attempts' },
              { header: 'Passing %', key: 'passing_percentage' }
            ], 'Quizzes_Export', 'Quizzes List');
          }}>Export PDF</GlassButton>
          <GlassButton variant="primary" className="gap-2 shrink-0" onClick={() => handleOpenQuizModal()} disabled={!selectedCourse}>
            <Plus className="h-4 w-4" /> Create Quiz
          </GlassButton>
        </div>
      </div>

      <GlassCard className="p-4 sm:p-6 min-h-[400px]">
        {isLoading ? (
           <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
        ) : quizzes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p>No quizzes found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-glass-highlight bg-glass/30 hover:bg-glass/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground flex items-center gap-3">
                    {quiz.title}
                    {quiz.status === 'published' ? (
                      <GlassBadge variant="success" className="text-[10px] px-2 py-0">Published</GlassBadge>
                    ) : (
                      <GlassBadge variant="warning" className="text-[10px] px-2 py-0">Draft</GlassBadge>
                    )}
                    {quiz.is_integrity_mode_enabled && (
                      <GlassBadge variant="primary" className="text-[10px] px-2 py-0 border-primary/50 text-primary bg-primary/10">Integrity Mode</GlassBadge>
                    )}
                  </h4>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{quiz.duration_minutes} mins</span>
                    <span>Max Attempts: {quiz.max_attempts}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* AI button moved inside Questions Modal */}
                  <GlassButton variant="primary" size="sm" className="gap-2" onClick={() => { setEditingQuiz(quiz); setIsQuestionsModalOpen(true); }}>
                    <List className="h-4 w-4" /> Questions
                  </GlassButton>
                  <Link to={`/quiz/${quiz.id}?preview=true`}>
                    <GlassButton variant="secondary" size="sm" className="gap-2 text-accent">
                      <Eye className="h-4 w-4" /> View
                    </GlassButton>
                  </Link>
                  {quiz.status === 'published' && (
                    <GlassButton variant="secondary" size="sm" className="gap-2" onClick={() => { setEditingQuiz(quiz); setIsSubmissionsModalOpen(true); }}>
                      <List className="h-4 w-4" /> Submissions
                    </GlassButton>
                  )}
                  <GlassButton variant="ghost" size="sm" onClick={() => handleStatusToggle(quiz)}>
                    {quiz.status === 'published' ? 'Unpublish' : 'Publish'}
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" onClick={() => handleOpenQuizModal(quiz)}>
                    <Settings2 className="h-4 w-4" />
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-error hover:bg-error/10" onClick={() => handleDeleteQuiz(quiz.id)}>
                    <Trash2 className="h-4 w-4" />
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Quiz Metadata Modal */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl p-6">
            <h3 className="text-2xl font-bold mb-6">{editingQuiz ? 'Edit Quiz Settings' : 'Create Quiz'}</h3>
            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title</label>
                <GlassInput required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Duration (mins)</label>
                  <GlassInput type="number" min="1" required value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max Attempts</label>
                  <GlassInput type="number" min="1" required value={formData.max_attempts} onChange={e => setFormData({...formData, max_attempts: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Passing %</label>
                  <GlassInput type="number" min="1" max="100" required value={formData.passing_percentage} onChange={e => setFormData({...formData, passing_percentage: Number(e.target.value)})} />
                </div>
              </div>
              <div className="p-4 rounded-xl border border-glass-highlight bg-glass/20 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Exam Integrity Mode</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Enables fullscreen, tab monitoring, and copy/paste prevention.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.is_integrity_mode_enabled} onChange={e => setFormData({...formData, is_integrity_mode_enabled: e.target.checked})} />
                  <div className="w-11 h-6 bg-glass-highlight peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <GlassInput value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Instructions</label>
                <textarea 
                  className="w-full h-24 px-4 py-3 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  value={formData.instructions}
                  onChange={e => setFormData({...formData, instructions: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <GlassButton type="button" variant="ghost" onClick={() => setIsQuizModalOpen(false)}>Cancel</GlassButton>
                <GlassButton type="submit" variant="primary">Save Settings</GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* AI Quiz Generation Modal */}
      {isAIModalOpen && editingQuiz && (
        courses.find(c => c.id === selectedCourse)?.slug === 'compiler-construction' ? (
          <CompilerQuizGenerator 
            quiz={editingQuiz} 
            onClose={() => setIsAIModalOpen(false)}
          />
        ) : (
          <AIGeneratorModal 
            quiz={editingQuiz} 
            onClose={() => setIsAIModalOpen(false)}
          />
        )
      )}

      {/* Question Builder Modal */}
      {isQuestionsModalOpen && editingQuiz && (
        <QuestionBuilderModal 
          quiz={editingQuiz} 
          onClose={() => setIsQuestionsModalOpen(false)} 
          onOpenAI={() => setIsAIModalOpen(true)}
          onOpenLocal={() => setIsLocalModalOpen(true)}
        />
      )}
      {/* Local Extraction Modal */}
      {isLocalModalOpen && editingQuiz && (
        <LocalQuizExtractionModal
          quiz={editingQuiz}
          onClose={() => setIsLocalModalOpen(false)}
        />
      )}
      {/* Submissions Modal */}
      {isSubmissionsModalOpen && editingQuiz && (
        <QuizSubmissionsModal
          quiz={editingQuiz}
          onClose={() => setIsSubmissionsModalOpen(false)}
        />
      )}
    </div>
  );
}

// ==========================================
// Quiz Submissions Component
// ==========================================
function QuizSubmissionsModal({ quiz, onClose }: { quiz: Quiz, onClose: () => void }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submitted' | 'cheating' | 'all'>('submitted');

  const fetchSubmissions = useCallback(() => {
    setIsLoading(true);
    quizService.getQuizSubmissions(quiz.id)
      .then(data => setSubmissions(data))
      .catch(err => Swal.fire(err.message))
      .finally(() => setIsLoading(false));
  }, [quiz.id]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleGiveChance = async (attemptId: string) => {
    if (!confirm("Are you sure you want to delete this cheating attempt and give the student another chance?")) return;
    try {
      await quizService.giveStudentAnotherChance(attemptId);
      Swal.fire("Attempt deleted. The student can now take the quiz again.");
      fetchSubmissions();
    } catch (err: any) {
      Swal.fire("Failed to give chance: " + err.message);
    }
  };

  const normalSubmissions = submissions.filter(s => s.status !== 'cheating_detected');
  const cheatedSubmissions = submissions.filter(s => s.status === 'cheating_detected');

  const getDisplayedData = () => {
    if (activeTab === 'submitted') return normalSubmissions;
    if (activeTab === 'cheating') return cheatedSubmissions;
    return submissions;
  };

  const handleExportExcel = async () => {
    try {
      const { exportToExcel } = await import('../../utils/exportUtils');
      const cols = [
        { header: 'Name', key: 'profiles.full_name' },
        { header: 'Roll Number', key: 'profiles.roll_number' },
        { header: 'Attempt', key: 'attempt_number' },
        { header: 'Marks', key: 'score' },
        { header: 'Percentage', key: 'percentage' },
        { header: 'Status', key: 'status' }
      ];
      exportToExcel(getDisplayedData(), cols, `${quiz.title}_Submissions_${activeTab}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPDF = async () => {
    try {
      const { exportToPDF } = await import('../../utils/exportUtils');
      const cols = [
        { header: 'Name', key: 'profiles.full_name' },
        { header: 'Roll Number', key: 'profiles.roll_number' },
        { header: 'Attempt', key: 'attempt_number' },
        { header: 'Marks', key: 'score' },
        { header: 'Percentage', key: 'percentage' },
        { header: 'Status', key: 'status' }
      ];
      exportToPDF(getDisplayedData(), cols, `${quiz.title}_Submissions_${activeTab}`, `Quiz Submissions - ${quiz.title}`, `View: ${activeTab.toUpperCase()}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-5xl p-0 h-[85vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-glass-highlight flex justify-between items-center bg-glass-highlight/30">
          <div>
            <h3 className="text-xl font-bold">Quiz Submissions</h3>
            <p className="text-sm text-muted-foreground">{quiz.title}</p>
          </div>
          <div className="flex gap-2">
            <GlassButton variant="secondary" size="sm" onClick={handleExportExcel}>Export Excel</GlassButton>
            <GlassButton variant="secondary" size="sm" onClick={handleExportPDF}>Export PDF</GlassButton>
            <GlassButton variant="ghost" size="sm" onClick={onClose}>Close</GlassButton>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-glass-highlight bg-glass/20 px-6">
          <button 
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'submitted' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('submitted')}
          >
            Quiz Submitted Students ({normalSubmissions.length})
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cheating' ? 'border-error text-error' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('cheating')}
          >
            Cheating Detected Students ({cheatedSubmissions.length})
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('all')}
          >
            All Students ({submissions.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-10"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-glass-highlight">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-glass-highlight text-sm text-muted-foreground bg-glass/10">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Roll Number</th>
                    <th className="p-3 font-medium">Attempt</th>
                    <th className="p-3 font-medium">Marks</th>
                    <th className="p-3 font-medium">Percentage</th>
                    <th className="p-3 font-medium">Status</th>
                    {activeTab !== 'submitted' && <th className="p-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {getDisplayedData().length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted-foreground py-8">No records found.</td>
                    </tr>
                  ) : (
                    getDisplayedData().map(sub => (
                      <tr key={sub.id} className="border-b border-glass-highlight/50 hover:bg-glass/20 transition-colors">
                        <td className={`p-3 font-medium ${sub.status === 'cheating_detected' ? 'text-error' : ''}`}>{sub.profiles?.full_name}</td>
                        <td className={`p-3 ${sub.status === 'cheating_detected' ? 'text-error/80' : 'text-muted-foreground'}`}>{sub.profiles?.roll_number || '-'}</td>
                        <td className="p-3 text-sm">Attempt #{sub.attempt_number}</td>
                        <td className="p-3 font-medium">{sub.score !== null ? sub.score : '-'}</td>
                        <td className="p-3">
                          {sub.percentage !== null ? (
                            <span className={sub.passed ? 'text-success font-medium' : 'text-error font-medium'}>
                              {sub.percentage.toFixed(1)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3">
                          {sub.status === 'cheating_detected' ? (
                            <span className="text-error font-bold text-xs uppercase px-2 py-1 rounded bg-error/20">Cheating Detected</span>
                          ) : (
                            <GlassBadge variant={sub.status === 'graded' ? 'success' : 'warning'} className="text-[10px] uppercase">
                              {sub.status.replace('_', ' ')}
                            </GlassBadge>
                          )}
                        </td>
                        {activeTab !== 'submitted' && (
                          <td className="p-3">
                            {sub.status === 'cheating_detected' && (
                              <GlassButton variant="ghost" size="sm" className="text-primary hover:bg-primary/20 hover:text-primary-foreground border border-primary/50" onClick={() => handleGiveChance(sub.id)}>
                                Give a chance
                              </GlassButton>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ==========================================
// AI Generator Component
// ==========================================
function AIGeneratorModal({ quiz, onClose }: { quiz: Quiz, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  
  // Format options
  const [mcq, setMcq] = useState(true);
  const [fillInBlanks, setFillInBlanks] = useState(false);
  const [qa, setQa] = useState(false);
  const [all, setAll] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftQuiz, setDraftQuiz] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handle "All" checkbox logic
  const handleAllChange = (checked: boolean) => {
    setAll(checked);
    if (checked) {
      setMcq(false);
      setFillInBlanks(false);
      setQa(false);
    }
  };

  const handleFormatChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, checked: boolean) => {
    setter(checked);
    if (checked) {
      setAll(false);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      return Swal.fire('Please upload a PDF or Image file.');
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const types: string[] = [];
      if (all) {
        types.push('mcq', 'fill_in_the_blanks', 'short_answer');
      } else {
        if (mcq) types.push('mcq');
        if (fillInBlanks) types.push('fill_in_the_blanks');
        if (qa) types.push('short_answer');
      }

      if (types.length === 0) {
        setIsGenerating(false);
        return Swal.fire("Please select at least one question format.");
      }

      formData.append('types', JSON.stringify(types));

      const res = await aiService.generateQuizFromFile(formData);
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

        const combinedExplanation = [
          q.expected_answer ? `Expected Answer: ${q.expected_answer}` : '',
          q.explanation ? `Explanation: ${q.explanation}` : ''
        ].filter(Boolean).join('\n\n');

        await quizService.createQuestion({
          quiz_id: quiz.id,
          question_type: q.question_type,
          question_text: q.question_text,
          marks: q.marks || 1,
          explanation: combinedExplanation,
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
            <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-accent" /> AI Quiz Generator</h3>
            <p className="text-sm text-muted-foreground">Generate questions from PDF or Image</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          {/* Controls */}
          <div className="w-full md:w-1/3 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Source File (PDF or Image)</label>
              <input 
                type="file" 
                accept=".pdf,image/*" 
                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium mb-1 border-b border-glass-highlight pb-1">Question Formats</label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-glass-highlight bg-glass/50" checked={all} onChange={e => handleAllChange(e.target.checked)} />
                <span className="text-sm font-medium text-primary">All Formats (Mixed)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-glass-highlight bg-glass/50" checked={mcq} onChange={e => handleFormatChange(setMcq, e.target.checked)} />
                <span className="text-sm">Multiple Choice (MCQs)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-glass-highlight bg-glass/50" checked={fillInBlanks} onChange={e => handleFormatChange(setFillInBlanks, e.target.checked)} />
                <span className="text-sm">Fill in the Blanks</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-glass-highlight bg-glass/50" checked={qa} onChange={e => handleFormatChange(setQa, e.target.checked)} />
                <span className="text-sm">Question Answers</span>
              </label>
            </div>

            <GlassButton variant="secondary" className="w-full gap-2 border-accent text-accent mt-6" onClick={handleGenerate} disabled={isGenerating || !file}>
              {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full" /> : <Wand2 className="h-4 w-4" />}
              {isGenerating ? 'Analyzing File...' : 'Generate Questions'}
            </GlassButton>
          </div>

          {/* Preview */}
          <div className="flex-1 border-l border-glass-highlight pl-8 overflow-y-auto pr-2">
            {!draftQuiz ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                <Sparkles className="h-12 w-12 mb-4 opacity-30 text-accent" />
                <p>Upload a PDF or Image and select your formats.<br/>The AI will generate questions based purely on the file content.</p>
              </div>
            ) : (
              <div className="space-y-4 pb-12">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-lg">Generated Draft</h4>
                  <GlassButton variant="primary" size="sm" onClick={handleSaveDraft} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Accept & Add to Quiz'}
                  </GlassButton>
                </div>
                {draftQuiz.questions.map((q: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-glass-highlight bg-glass/30">
                    <div className="flex justify-between">
                      <span className="font-mono text-sm text-primary mb-2 block uppercase">{q.question_type} • {q.marks} Marks</span>
                    </div>
                    <p className="font-medium mb-3">{idx + 1}. {q.question_text}</p>
                    
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-2 ml-4 mb-3">
                        {q.options.map((opt: any, oIdx: number) => (
                          <div key={oIdx} className={`text-sm px-3 py-1 rounded-md border ${opt.is_correct ? 'bg-success/20 border-success/30 text-success' : 'border-glass-highlight'}`}>
                            {opt.option_text}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {q.expected_answer && (
                      <div className="mt-2 bg-glass/20 p-2 rounded text-sm border border-glass-highlight">
                        <span className="font-semibold text-primary">Expected Answer: </span>
                        {q.expected_answer}
                      </div>
                    )}
                    
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground mt-2 border-t border-glass-highlight pt-2"><span className="font-semibold">Explanation:</span> {q.explanation}</p>
                    )}
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

// ==========================================
// Question Builder Component
// ==========================================
function QuestionBuilderModal({ quiz, onClose, onOpenAI, onOpenLocal }: { quiz: Quiz, onClose: () => void, onOpenAI: () => void, onOpenLocal: () => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New question form
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState<QuestionType>('mcq');
  const [newText, setNewText] = useState('');
  const [newMarks, setNewMarks] = useState(1);
  const [newExplanation, setNewExplanation] = useState('');
  
  // Options builder
  const [options, setOptions] = useState([{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await quizService.getQuizQuestions(quiz.id);
      setQuestions(data);
    } catch(err: any) {
      Swal.fire(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [quiz.id]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleAddQuestion = async () => {
    if (!newText.trim()) return;
    try {
      const formattedOptions = (newType === 'mcq' || newType === 'true_false') 
        ? options.map((o, idx) => ({ option_text: o.text, option_order: idx + 1, is_correct: o.isCorrect }))
        : [];
      
      const nextOrder = questions.length > 0 ? Math.max(...questions.map(q => q.question_order)) + 1 : 1;

      await quizService.createQuestion({
        quiz_id: quiz.id,
        question_type: newType,
        question_text: newText,
        marks: newMarks,
        explanation: newExplanation,
        question_order: nextOrder
      }, formattedOptions);

      setIsAdding(false);
      loadQuestions();
      setNewText('');
      setNewExplanation('');
      setOptions([{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);
    } catch(err: any) {
      Swal.fire("Failed to add question: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete question?")) return;
    await quizService.deleteQuestion(id);
    loadQuestions();
  }

  return (
    <div className="fixed inset-0 z-[55] bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-4xl p-0 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-glass-highlight flex justify-between items-center bg-glass-highlight/30">
          <div>
            <h3 className="text-xl font-bold">Questions: {quiz.title}</h3>
            <p className="text-sm text-muted-foreground">Add and organize quiz questions</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
             <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
          ) : (
            <div className="space-y-6">
              
              {/* List */}
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-glass-highlight bg-glass/20 flex gap-4">
                    <div className="font-bold text-muted-foreground w-6">{idx + 1}.</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="uppercase text-xs font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">{q.question_type}</span>
                        <GlassButton variant="ghost" size="sm" className="h-6 w-6 p-0 text-error" onClick={() => handleDelete(q.id)}>
                          <Trash2 className="h-3 w-3" />
                        </GlassButton>
                      </div>
                      <p className="font-medium">{q.question_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">Marks: {q.marks}</p>
                      {q.options && q.options.length > 0 && (
                        <div className="mt-3 ml-2 space-y-1">
                          {q.options.map(opt => (
                            <div key={opt.id} className={`text-xs px-2 py-1 rounded border ${opt.is_correct ? 'bg-success/20 border-success/30 text-success' : 'border-glass-highlight text-muted-foreground'}`}>
                              {opt.option_text} {opt.is_correct && '✓'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add form */}
              {isAdding ? (
                <div className="p-6 rounded-xl border border-primary/50 bg-primary/5 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select className="w-full h-10 px-4 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none" value={newType} onChange={e => setNewType(e.target.value as any)}>
                        <option value="mcq">Multiple Choice</option>
                        <option value="true_false">True / False</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="written">Written / Essay</option>
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium mb-1">Marks</label>
                      <GlassInput type="number" min="1" value={newMarks} onChange={e => setNewMarks(Number(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Question Text</label>
                    <textarea className="w-full h-20 px-4 py-3 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={newText} onChange={e => setNewText(e.target.value)} />
                  </div>
                  
                  {newType === 'mcq' && (
                    <div className="space-y-2 pl-4 border-l-2 border-glass-highlight">
                      <label className="block text-sm font-medium">Options</label>
                      {options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input type="radio" name="correctOpt" checked={opt.isCorrect} onChange={() => setOptions(options.map((o, i) => ({ ...o, isCorrect: i === oIdx })))} className="w-4 h-4 accent-primary" />
                          <GlassInput value={opt.text} onChange={e => setOptions(options.map((o, i) => i === oIdx ? { ...o, text: e.target.value } : o))} placeholder={`Option ${oIdx + 1}`} />
                          <GlassButton variant="ghost" size="sm" onClick={() => setOptions(options.filter((_, i) => i !== oIdx))} className="text-error px-2 py-0">X</GlassButton>
                        </div>
                      ))}
                      <GlassButton variant="secondary" size="sm" onClick={() => setOptions([...options, { text: '', isCorrect: false }])}>Add Option</GlassButton>
                    </div>
                  )}

                  {newType === 'true_false' && (
                    <div className="space-y-2 pl-4 border-l-2 border-glass-highlight">
                      <label className="block text-sm font-medium">Correct Answer</label>
                      <select className="w-full h-10 px-4 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none" onChange={e => setOptions([{ text: 'True', isCorrect: e.target.value === 'true' }, { text: 'False', isCorrect: e.target.value === 'false' }])}>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Explanation (Optional)</label>
                    <GlassInput value={newExplanation} onChange={e => setNewExplanation(e.target.value)} placeholder="Shown after quiz submission" />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-glass-highlight">
                    <GlassButton variant="ghost" onClick={() => setIsAdding(false)}>Cancel</GlassButton>
                    <GlassButton variant="primary" onClick={handleAddQuestion}>Save Question</GlassButton>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <GlassButton variant="secondary" className="h-28 flex-col gap-2 border-dashed border-glass-highlight hover:border-primary transition-colors" onClick={() => { setIsAdding(true); if(newType === 'true_false' && options.length===0) setOptions([{text:'True',isCorrect:true},{text:'False',isCorrect:false}])}}>
                    <Plus className="h-6 w-6" /> <span className="text-sm font-semibold">Add Manually</span>
                  </GlassButton>
                  <GlassButton variant="secondary" className="h-28 flex-col gap-2 border-dashed border-accent text-accent bg-accent/5 hover:bg-accent/10 transition-colors" onClick={onOpenAI}>
                    <Sparkles className="h-6 w-6" /> 
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold">Generate by AI</span>
                      <span className="text-[10px] opacity-70">via PDF / Image</span>
                    </div>
                  </GlassButton>
                  <GlassButton variant="secondary" className="h-28 flex-col gap-2 border-dashed border-primary text-primary bg-primary/5 hover:bg-primary/10 transition-colors" onClick={onOpenLocal}>
                    <FileText className="h-6 w-6" /> 
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold">Create Locally</span>
                      <span className="text-[10px] opacity-70">Offline Extract via PDF/Image</span>
                    </div>
                  </GlassButton>
                </div>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

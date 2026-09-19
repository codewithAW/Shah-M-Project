import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Sparkles, X, Settings2, List, Wand2, Eye, FileText, Upload, PauseCircle } from 'lucide-react';
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

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Delete quiz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-danger)',
      cancelButtonColor: 'var(--color-primary)',
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--color-glass-bg)',
      color: 'var(--color-foreground)'
    });
    if (!result.isConfirmed) return;
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
    <div className="dashboard-container">
      <div className="dashboard-header d-flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h2 className="dashboard-title text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Quizzes</h2>
          <p className="font-medium mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Manage assessments and questions</p>
        </div>
        <div className="d-flex flex-col gap-3" style={{ flex: '1 1 auto', alignItems: 'flex-end' }}>
          <div className="d-flex items-center gap-2 flex-wrap justify-end">
            <GlassButton className="admin-header-btn btn-export" style={{ flexShrink: 0 }} onClick={async () => {
              if (!quizzes.length) return Swal.fire('No quizzes to export');
              const { exportToExcel } = await import('../../utils/exportUtils');
              exportToExcel(quizzes, [
                { header: 'Title', key: 'title' },
                { header: 'Status', key: 'status' },
                { header: 'Duration (mins)', key: 'duration_minutes' },
                { header: 'Max Attempts', key: 'max_attempts' },
                { header: 'Passing %', key: 'passing_percentage' }
              ], 'Quizzes_Export');
            }}>Excel</GlassButton>
            <GlassButton className="shadow-sm admin-header-btn btn-export" style={{ flexShrink: 0 }} onClick={async () => {
              if (!quizzes.length) return Swal.fire('No quizzes to export');
              const { exportToPDF } = await import('../../utils/exportUtils');
              exportToPDF(quizzes, [
                { header: 'Title', key: 'title' },
                { header: 'Status', key: 'status' },
                { header: 'Duration (mins)', key: 'duration_minutes' },
                { header: 'Max Attempts', key: 'max_attempts' },
                { header: 'Passing %', key: 'passing_percentage' }
              ], 'Quizzes_Export', 'Quizzes List');
            }}>Pdf</GlassButton>
            <GlassButton className="gap-2 shadow-sm admin-header-btn btn-export" style={{ flexShrink: 0 }} onClick={() => handleOpenQuizModal()} disabled={!selectedCourse}>
              <Plus style={{ height: '1.25rem', width: '1.25rem' }} /> Create
            </GlassButton>
          </div>
          <select 
            className="form-input admin-header-select"
            style={{ width: '100%', minWidth: '16rem', maxWidth: '24rem', paddingRight: '2.5rem' }}
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="" disabled>Select a course</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <GlassCard className="p-6" style={{ minHeight: '400px' }}>
        {isLoading ? (
           <div className="d-flex items-center justify-center p-12">
             <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div>
           </div>
        ) : quizzes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Plus style={{ height: '3rem', width: '3rem', opacity: 0.5 }} />
            </div>
            <p className="empty-state-desc">No quizzes found.</p>
          </div>
        ) : (
          <div className="d-flex flex-col gap-4">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="d-flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-white/5 transition-all shadow-sm group" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 className="font-bold d-flex items-center gap-3">
                    {quiz.title}
                    {quiz.status === 'published' ? (
                      <GlassBadge variant="success" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Published</GlassBadge>
                    ) : (
                      <GlassBadge variant="warning" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Draft</GlassBadge>
                    )}
                    {quiz.is_integrity_mode_enabled && (
                      <GlassBadge variant="primary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Integrity Mode</GlassBadge>
                    )}
                  </h4>
                  <div className="d-flex gap-4 mt-2 text-sm text-muted font-medium">
                    <span>{quiz.duration_minutes} mins</span>
                    <span>Max Attempts: {quiz.max_attempts}</span>
                  </div>
                </div>
                <div className="d-flex items-center gap-2" style={{ flexShrink: 0 }}>
                  {/* AI button moved inside Questions Modal */}
                  <GlassButton variant="primary" size="sm" className="btn-icon shadow-sm" title="Questions" onClick={() => { setEditingQuiz(quiz); setIsQuestionsModalOpen(true); }}>
                    <List style={{ height: '1.25rem', width: '1.25rem' }} />
                  </GlassButton>
                  <Link to={`/quiz/${quiz.id}?preview=true`}>
                    <GlassButton variant="secondary" size="sm" className="btn-icon shadow-sm" title="View" style={{ color: 'var(--color-primary)' }}>
                      <Eye style={{ height: '1.25rem', width: '1.25rem' }} />
                    </GlassButton>
                  </Link>
                  {quiz.status === 'published' && (
                    <GlassButton variant="secondary" size="sm" className="btn-icon shadow-sm" title="Submissions" onClick={() => { setEditingQuiz(quiz); setIsSubmissionsModalOpen(true); }}>
                      <FileText style={{ height: '1.25rem', width: '1.25rem' }} />
                    </GlassButton>
                  )}
                  <GlassButton variant="ghost" size="sm" className="btn-icon shadow-sm text-primary" title={quiz.status === 'published' ? 'Unpublish' : 'Publish'} onClick={() => handleStatusToggle(quiz)}>
                    {quiz.status === 'published' ? <PauseCircle style={{ height: '1.25rem', width: '1.25rem' }} /> : <Upload style={{ height: '1.25rem', width: '1.25rem' }} />}
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="btn-icon text-primary shadow-sm" onClick={() => handleOpenQuizModal(quiz)}>
                    <Settings2 style={{ height: '1.25rem', width: '1.25rem' }} />
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="btn-icon text-danger shadow-sm" onClick={() => handleDelete(quiz.id)}>
                    <Trash2 style={{ height: '1.25rem', width: '1.25rem' }} />
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Quiz Metadata Modal */}
      {isQuizModalOpen && (
        <div className="modal-overlay">
          <GlassCard className="modal-content">
            <h3 className="modal-title">{editingQuiz ? 'Edit Quiz Settings' : 'Create Quiz'}</h3>
            <form onSubmit={handleSaveQuiz} className="d-flex flex-col gap-6">
              <div className="form-group">
                <label className="form-label">Title</label>
                <GlassInput required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="dashboard-grid cols-3">
                <div className="form-group">
                  <label className="form-label">Duration (mins)</label>
                  <GlassInput type="number" min="1" required value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Attempts</label>
                  <GlassInput type="number" min="1" required value={formData.max_attempts} onChange={e => setFormData({...formData, max_attempts: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Passing %</label>
                  <GlassInput type="number" min="1" max="100" required value={formData.passing_percentage} onChange={e => setFormData({...formData, passing_percentage: Number(e.target.value)})} />
                </div>
              </div>
              <div className="d-flex items-center justify-between p-4 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <h4 className="font-bold text-sm">Exam Integrity Mode</h4>
                  <p className="text-xs font-medium text-muted mt-1">Enables fullscreen, tab monitoring, and copy/paste prevention.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={formData.is_integrity_mode_enabled} onChange={e => setFormData({...formData, is_integrity_mode_enabled: e.target.checked})} />
                  <div style={{
                    width: '2.75rem', height: '1.5rem', borderRadius: '1rem',
                    background: formData.is_integrity_mode_enabled ? 'var(--color-primary)' : 'rgba(0,0,0,0.2)',
                    transition: 'all 0.2s', position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute', top: '2px', left: formData.is_integrity_mode_enabled ? 'calc(100% - 22px)' : '2px',
                      width: '1.25rem', height: '1.25rem', background: 'white', borderRadius: '50%',
                      transition: 'all 0.2s'
                    }}></div>
                  </div>
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <GlassInput value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Instructions</label>
                <textarea 
                  className="form-input"
                  style={{ height: '6rem', resize: 'none' }}
                  value={formData.instructions}
                  onChange={e => setFormData({...formData, instructions: e.target.value})}
                />
              </div>
              <div className="modal-footer">
                <GlassButton type="button" variant="ghost" onClick={() => setIsQuizModalOpen(false)}>Cancel</GlassButton>
                <GlassButton type="submit" variant="primary" className="shadow-sm">Save Settings</GlassButton>
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

  const handleIgnoreCheating = async (attemptId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this cheating attempt and give the student another chance?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-primary)',
      cancelButtonColor: 'var(--color-secondary)',
      confirmButtonText: 'Yes, ignore cheating!',
      background: 'var(--color-glass-bg)',
      color: 'var(--color-foreground)'
    });
    if (!result.isConfirmed) return;
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
    <div className="modal-overlay">
      <GlassCard className="modal-content" style={{ maxWidth: '64rem', padding: 0, height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="p-6 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
          <div className="d-flex flex-wrap justify-between items-start gap-4" style={{ paddingRight: '2.5rem' }}>
            <div>
              <h3 className="font-bold text-xl">Quiz Submissions</h3>
              <p className="text-sm font-medium text-muted">{quiz.title}</p>
            </div>
            <div className="d-flex gap-2 flex-wrap items-center">
              <GlassButton variant="secondary" size="sm" className="shadow-sm btn-export" onClick={handleExportExcel}>Excel</GlassButton>
              <GlassButton variant="secondary" size="sm" className="shadow-sm btn-export" onClick={handleExportPDF}>Pdf</GlassButton>
            </div>
          </div>
          <GlassButton 
            variant="ghost" 
            size="sm" 
            className="btn-icon text-muted-foreground" 
            onClick={onClose} 
            title="Close"
            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </GlassButton>
        </div>
        
        {/* Tabs */}
        <div className="d-flex px-6 border-b border-white/5 bg-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <button 
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'submitted' ? 'text-primary' : 'text-muted hover:text-foreground'}`}
            style={{ borderColor: activeTab === 'submitted' ? 'var(--color-primary)' : 'transparent', background: 'none', cursor: 'pointer' }}
            onClick={() => setActiveTab('submitted')}
          >
            Quiz Submitted Students ({normalSubmissions.length})
          </button>
          <button 
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'cheating' ? 'text-danger' : 'text-muted hover:text-foreground'}`}
            style={{ borderColor: activeTab === 'cheating' ? 'var(--color-danger)' : 'transparent', background: 'none', cursor: 'pointer' }}
            onClick={() => setActiveTab('cheating')}
          >
            Cheating Detected Students ({cheatedSubmissions.length})
          </button>
          <button 
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'all' ? 'text-primary' : 'text-muted hover:text-foreground'}`}
            style={{ borderColor: activeTab === 'all' ? 'var(--color-primary)' : 'transparent', background: 'none', cursor: 'pointer' }}
            onClick={() => setActiveTab('all')}
          >
            All Students ({submissions.length})
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
          {isLoading ? (
            <div className="d-flex items-center justify-center p-12">
              <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll Number</th>
                    <th>Attempt</th>
                    <th>Marks</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    {activeTab !== 'submitted' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {getDisplayedData().length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-8">No records found.</td>
                    </tr>
                  ) : (
                    getDisplayedData().map(sub => (
                      <tr key={sub.id}>
                        <td className={`font-medium ${sub.status === 'cheating_detected' ? 'text-danger' : ''}`}>{sub.profiles?.full_name}</td>
                        <td className={`${sub.status === 'cheating_detected' ? 'text-danger' : 'text-muted'}`}>{sub.profiles?.roll_number || '-'}</td>
                        <td className="text-sm">Attempt #{sub.attempt_number}</td>
                        <td className="font-medium">{sub.score !== null ? sub.score : '-'}</td>
                        <td>
                          {sub.percentage !== null ? (
                            <span className={sub.passed ? 'text-success font-medium' : 'text-danger font-medium'}>
                              {sub.percentage.toFixed(1)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          {sub.status === 'cheating_detected' ? (
                            <span className="text-danger font-bold text-xs" style={{ textTransform: 'uppercase', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(239,68,68,0.2)' }}>Cheating Detected</span>
                          ) : (
                            <GlassBadge variant={sub.status === 'graded' ? 'success' : 'warning'} style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                              {sub.status.replace('_', ' ')}
                            </GlassBadge>
                          )}
                        </td>
                        {activeTab !== 'submitted' && (
                          <td>
                            {sub.status === 'cheating_detected' && (
                              <GlassButton variant="ghost" size="sm" className="text-primary" style={{ border: '1px solid var(--color-primary)' }} onClick={() => handleIgnoreCheating(sub.id)}>
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
    <div className="modal-overlay" style={{ zIndex: 60 }}>
      <GlassCard className="modal-content" style={{ maxWidth: '56rem', padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="d-flex justify-between items-center p-6 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div>
            <h3 className="font-bold text-xl d-flex items-center gap-2" style={{ color: 'var(--color-foreground)' }}>
              <Sparkles style={{ color: 'var(--color-primary)' }} /> AI Quiz Generator
            </h3>
            <p className="text-sm font-medium text-muted mt-1">Generate questions from PDF or Image</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted-foreground)' }}>
            <X style={{ height: '1.25rem', width: '1.25rem' }} />
          </button>
        </div>
        
        <div className="d-flex flex-col md:flex-row gap-6 p-6" style={{ flex: 1, overflowY: 'auto' }}>
          {/* Controls */}
          <div className="d-flex flex-col gap-5 w-full" style={{ maxWidth: '20rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Source File (PDF or Image)</label>
              <input 
                type="file" 
                accept=".pdf,image/*" 
                className="form-input text-sm"
                style={{ padding: '0.375rem 0.5rem' }}
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
            
            <div className="d-flex flex-col gap-3">
              <label className="form-label" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>Question Formats</label>
              
              <label className="d-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} checked={all} onChange={e => handleAllChange(e.target.checked)} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>All Formats (Mixed)</span>
              </label>
              <label className="d-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} checked={mcq} onChange={e => handleFormatChange(setMcq, e.target.checked)} />
                <span className="text-sm">Multiple Choice (MCQs)</span>
              </label>
              <label className="d-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} checked={fillInBlanks} onChange={e => handleFormatChange(setFillInBlanks, e.target.checked)} />
                <span className="text-sm">Fill in the Blanks</span>
              </label>
              <label className="d-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} checked={qa} onChange={e => handleFormatChange(setQa, e.target.checked)} />
                <span className="text-sm">Question Answers</span>
              </label>
            </div>

            <GlassButton variant="secondary" className="w-full gap-2 mt-4" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} onClick={handleGenerate} disabled={isGenerating || !file}>
              {isGenerating ? <div className="animate-spin h-4 w-4 rounded-full" style={{ border: '2px solid var(--color-primary)', borderTopColor: 'transparent' }} /> : <Wand2 style={{ height: '1rem', width: '1rem' }} />}
              {isGenerating ? 'Analyzing File...' : 'Generate Questions'}
            </GlassButton>
          </div>

          {/* Preview */}
          <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem', overflowY: 'auto' }}>
            {!draftQuiz ? (
              <div className="empty-state" style={{ height: '100%', border: 'none', background: 'transparent' }}>
                <div className="empty-state-icon">
                  <Sparkles style={{ height: '3rem', width: '3rem', color: 'var(--color-primary)' }} />
                </div>
                <p className="empty-state-desc">Upload a PDF or Image and select your formats.<br/>The AI will generate questions based purely on the file content.</p>
              </div>
            ) : (
              <div className="d-flex flex-col gap-4 pb-12">
                <div className="d-flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg">Generated Draft</h4>
                  <GlassButton variant="primary" size="sm" onClick={handleSaveDraft} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Accept & Add to Quiz'}
                  </GlassButton>
                </div>
                {draftQuiz.questions.map((q: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="d-flex justify-between">
                      <span className="font-mono text-sm mb-2 block uppercase" style={{ color: 'var(--color-primary)' }}>{q.question_type} • {q.marks} Marks</span>
                    </div>
                    <p className="font-medium mb-3">{idx + 1}. {q.question_text}</p>
                    
                    {q.options && q.options.length > 0 && (
                      <div className="d-flex flex-col gap-2 ml-4 mb-3">
                        {q.options.map((opt: any, oIdx: number) => (
                          <div key={oIdx} className="text-sm px-3 py-1 rounded border d-flex items-center gap-2" style={{ 
                            background: opt.is_correct ? 'rgba(16,185,129,0.1)' : 'transparent',
                            borderColor: opt.is_correct ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                            color: opt.is_correct ? 'var(--color-success)' : 'inherit'
                          }}>
                            <span className="font-bold w-4 text-center opacity-70">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt.option_text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {q.expected_answer && (
                      <div className="mt-2 p-2 rounded text-sm border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="font-semibold text-primary">Expected Answer: </span>
                        {q.expected_answer}
                      </div>
                    )}
                    
                    {q.explanation && (
                      <p className="text-xs text-muted mt-2 pt-2 border-t border-white/10" style={{ borderTopStyle: 'solid', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                        <span className="font-bold">Explanation:</span> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-3" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <GlassButton variant="ghost" onClick={onClose}>Cancel</GlassButton>
          {draftQuiz && (
            <GlassButton variant="primary" onClick={handleSaveDraft} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save to Quiz'}
            </GlassButton>
          )}
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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Delete question?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--color-danger)',
      cancelButtonColor: 'var(--color-primary)',
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--color-glass-bg)',
      color: 'var(--color-foreground)'
    });
    if (!result.isConfirmed) return;
    await quizService.deleteQuestion(id);
    loadQuestions();
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 55 }}>
      <GlassCard className="modal-content" style={{ maxWidth: '56rem', padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="d-flex justify-between items-center p-6 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div>
            <h3 className="font-bold text-xl">Questions: {quiz.title}</h3>
            <p className="text-sm font-medium text-muted">Add and organize quiz questions</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted-foreground)' }}>
            <X style={{ height: '1.25rem', width: '1.25rem' }} />
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
          {isLoading ? (
             <div className="d-flex items-center justify-center p-12">
               <div className="animate-spin h-8 w-8 rounded-full" style={{ border: '4px solid var(--color-primary)', borderTopColor: 'transparent' }}></div>
             </div>
          ) : (
            <div className="d-flex flex-col gap-6">
              
              {/* List */}
              <div className="d-flex flex-col gap-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-white/10 d-flex gap-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="font-bold text-muted" style={{ width: '1.5rem' }}>{idx + 1}.</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex justify-between items-start mb-2">
                        <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-primary)', padding: '0.125rem 0.5rem', borderRadius: '1rem', background: 'rgba(99,102,241,0.1)' }}>{q.question_type}</span>
                        <GlassButton variant="ghost" size="sm" className="btn-icon text-danger p-0" style={{ height: '1.5rem', width: '1.5rem' }} onClick={() => handleDelete(q.id)}>
                          <Trash2 style={{ height: '0.75rem', width: '0.75rem' }} />
                        </GlassButton>
                      </div>
                      <p className="font-medium">{q.question_text}</p>
                      <p className="text-xs text-muted mt-1">Marks: {q.marks}</p>
                      {q.options && q.options.length > 0 && (
                        <div className="mt-3 ml-2 d-flex flex-col gap-1">
                          {q.options.map((opt, oIdx) => (
                            <div key={opt.id} className="text-xs px-2 py-1 rounded border d-flex items-center gap-2" style={{ 
                              background: opt.is_correct ? 'rgba(16,185,129,0.1)' : 'transparent',
                              borderColor: opt.is_correct ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                              color: opt.is_correct ? 'var(--color-success)' : 'var(--color-muted-foreground)'
                            }}>
                              <span className="font-bold w-4 text-center opacity-70">{String.fromCharCode(65 + oIdx)}.</span>
                              <span>{opt.option_text} {opt.is_correct && '✓'}</span>
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
                <div className="p-6 rounded-xl border border-primary" style={{ background: 'rgba(99,102,241,0.05)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="d-flex gap-4">
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="form-label">Type</label>
                      <select className="form-input" value={newType} onChange={e => setNewType(e.target.value as any)}>
                        <option value="mcq" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>Multiple Choice</option>
                        <option value="true_false" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>True / False</option>
                        <option value="short_answer" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>Short Answer</option>
                        <option value="written" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>Written / Essay</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ width: '6rem', marginBottom: 0 }}>
                      <label className="form-label">Marks</label>
                      <GlassInput type="number" min="1" value={newMarks} onChange={e => setNewMarks(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Question Text</label>
                    <textarea className="form-input" style={{ height: '5rem', resize: 'none' }} value={newText} onChange={e => setNewText(e.target.value)} />
                  </div>
                  
                  {newType === 'mcq' && (
                    <div className="d-flex flex-col gap-2 pl-4" style={{ borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                      <label className="form-label">Options</label>
                      {options.map((opt, oIdx) => (
                        <div key={oIdx} className="d-flex items-center gap-2">
                          <input type="radio" name="correctOpt" checked={opt.isCorrect} onChange={() => setOptions(options.map((o, i) => ({ ...o, isCorrect: i === oIdx })))} style={{ accentColor: 'var(--color-primary)' }} />
                          <span className="font-bold text-sm text-muted w-4 text-center">{String.fromCharCode(65 + oIdx)}.</span>
                          <GlassInput value={opt.text} onChange={e => setOptions(options.map((o, i) => i === oIdx ? { ...o, text: e.target.value } : o))} placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} />
                          <GlassButton variant="ghost" size="sm" onClick={() => setOptions(options.filter((_, i) => i !== oIdx))} className="text-danger">X</GlassButton>
                        </div>
                      ))}
                      <div>
                        <GlassButton variant="secondary" size="sm" onClick={() => setOptions([...options, { text: '', isCorrect: false }])}>Add Option</GlassButton>
                      </div>
                    </div>
                  )}

                  {newType === 'true_false' && (
                    <div className="d-flex flex-col gap-2 pl-4" style={{ borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                      <label className="form-label">Correct Answer</label>
                      <select className="form-input" onChange={e => setOptions([{ text: 'True', isCorrect: e.target.value === 'true' }, { text: 'False', isCorrect: e.target.value === 'false' }])}>
                        <option value="true" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>True</option>
                        <option value="false" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>False</option>
                      </select>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Explanation (Optional)</label>
                    <GlassInput value={newExplanation} onChange={e => setNewExplanation(e.target.value)} placeholder="Shown after quiz submission" />
                  </div>

                  <div className="d-flex justify-end gap-3 pt-4 border-t border-white/10">
                    <GlassButton variant="ghost" onClick={() => setIsAdding(false)}>Cancel</GlassButton>
                    <GlassButton variant="primary" onClick={handleAddQuestion}>Save Question</GlassButton>
                  </div>
                </div>
              ) : (
                <div className="dashboard-grid cols-3">
                  <GlassButton variant="secondary" className="d-flex flex-col gap-3 justify-center shadow-sm" style={{ height: '8rem', borderStyle: 'dashed', borderWidth: '1px' }} onClick={() => { setIsAdding(true); if(newType === 'true_false' && options.length===0) setOptions([{text:'True',isCorrect:true},{text:'False',isCorrect:false}])}}>
                    <Plus style={{ height: '1.75rem', width: '1.75rem', opacity: 0.8 }} /> <span className="text-sm font-bold tracking-tight">Add Manually</span>
                  </GlassButton>
                  <GlassButton variant="secondary" className="d-flex flex-col gap-3 justify-center shadow-sm" style={{ height: '8rem', borderStyle: 'dashed', borderWidth: '1px', borderColor: 'rgba(99,102,241,0.3)', color: 'var(--color-primary)' }} onClick={onOpenAI}>
                    <Sparkles style={{ height: '1.75rem', width: '1.75rem' }} /> 
                    <div className="d-flex flex-col items-center">
                      <span className="text-sm font-bold tracking-tight">Generate by AI</span>
                      <span className="font-medium opacity-80" style={{ fontSize: '10px', textTransform: 'uppercase' }}>via PDF / Image</span>
                    </div>
                  </GlassButton>
                  <GlassButton variant="secondary" className="d-flex flex-col gap-3 justify-center shadow-sm" style={{ height: '8rem', borderStyle: 'dashed', borderWidth: '1px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }} onClick={onOpenLocal}>
                    <FileText style={{ height: '1.75rem', width: '1.75rem' }} /> 
                    <div className="d-flex flex-col items-center">
                      <span className="text-sm font-bold tracking-tight">Create Locally</span>
                      <span className="font-medium opacity-80" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Extract offline</span>
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

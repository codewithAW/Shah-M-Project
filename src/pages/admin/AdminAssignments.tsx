import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, FileUp, X } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassBadge } from '../../components/ui/GlassBadge';
import { courseService } from '../../services/courseService';
import { lectureService } from '../../services/lectureService';
import { assignmentService } from '../../services/assignmentService';
import type { Course, Lecture, Assignment } from '../../types';
import Swal from 'sweetalert2';


export function AdminAssignments() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [lectures, setLectures] = useState<Lecture[]>([]);
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  
  // Grading Modal States
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]); // joined with profiles
  const [activeTab, setActiveTab] = useState<'links' | 'files' | 'all'>('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    max_marks: 100,
    lecture_id: ''
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

  const fetchLectures = useCallback(async (courseId: string) => {
    try {
      const data = await lectureService.getLecturesByCourse(courseId);
      setLectures(data);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const fetchAssignments = useCallback(async (courseId: string) => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getAssignmentsByCourse(courseId);
      setAssignments(data);
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
      fetchLectures(selectedCourse);
      fetchAssignments(selectedCourse);
    }
  }, [selectedCourse, fetchLectures, fetchAssignments]);

  const handleOpenCreateModal = () => {
    if (!selectedCourse) return;
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      instructions: '',
      due_date: '',
      max_marks: 100,
      lecture_id: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0,16) : '',
      max_marks: assignment.max_marks,
      lecture_id: assignment.lecture_id || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const payload: Partial<Assignment> = {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        max_marks: formData.max_marks,
        lecture_id: formData.lecture_id || null,
        course_id: selectedCourse
      };

      if (editingAssignment) {
        await assignmentService.updateAssignment(editingAssignment.id, payload);
      } else {
        await assignmentService.createAssignment({ ...payload, status: 'draft' });
      }
      setIsModalOpen(false);
      fetchAssignments(selectedCourse);
    } catch (err: any) {
      Swal.fire(`Error saving: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this assignment?',
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
      await assignmentService.deleteAssignment(id);
      fetchAssignments(selectedCourse);
    } catch (err: any) {
      Swal.fire(`Error deleting: ${err.message}`);
    }
  };

  const handleStatusToggle = async (assignment: Assignment) => {
    const newStatus = assignment.status === 'published' ? 'draft' : 'published';
    try {
      await assignmentService.updateAssignment(assignment.id, { 
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null 
      });
      fetchAssignments(selectedCourse);
    } catch(err: any) {
      Swal.fire(err.message);
    }
  };

  // Grading 
  const openGradingModal = async (assignment: Assignment) => {
    setSelectedAssignmentForGrading(assignment);
    try {
      const subs = await assignmentService.getSubmissionsByAssignment(assignment.id);
      setSubmissions(subs);
      setGradingModalOpen(true);
      setActiveTab('all');
    } catch(err: any) {
      Swal.fire(err.message);
    }
  };

  const handleGradeSubmit = async (submissionId: string, marks: number, feedback: string) => {
    try {
      await assignmentService.gradeSubmission(submissionId, marks, feedback);
      const subs = await assignmentService.getSubmissionsByAssignment(selectedAssignmentForGrading!.id);
      setSubmissions(subs);
    } catch(err: any) {
      Swal.fire(err.message);
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header d-flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h2 className="dashboard-title text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Assignments</h2>
          <p className="font-medium mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Manage course assignments and grading</p>
        </div>
        
        <div className="d-flex flex-col gap-3" style={{ flex: '1 1 auto', alignItems: 'flex-end' }}>
          <div className="d-flex items-center gap-2 flex-wrap justify-end">
            <GlassButton className="admin-header-btn btn-export" style={{ flexShrink: 0 }} onClick={async () => {
              if (!assignments.length) return Swal.fire('No assignments to export');
              const { exportToExcel } = await import('../../utils/exportUtils');
              exportToExcel(assignments, [
                { header: 'Title', key: 'title' },
                { header: 'Description', key: 'description' },
                { header: 'Status', key: 'status' },
                { header: 'Due Date', key: 'due_date' },
                { header: 'Max Marks', key: 'max_marks' }
              ], 'Assignments_Export');
            }}>Excel</GlassButton>
            <GlassButton className="shadow-sm admin-header-btn btn-export" style={{ flexShrink: 0 }} onClick={async () => {
              if (!assignments.length) return Swal.fire('No assignments to export');
              const { exportToPDF } = await import('../../utils/exportUtils');
              exportToPDF(assignments, [
                { header: 'Title', key: 'title' },
                { header: 'Description', key: 'description' },
                { header: 'Status', key: 'status' },
                { header: 'Due Date', key: 'due_date' },
                { header: 'Max Marks', key: 'max_marks' }
              ], 'Assignments_Export', 'Assignments List');
            }}>Pdf</GlassButton>
            <GlassButton className="gap-2 shadow-sm admin-header-btn btn-export" style={{ flexShrink: 0 }} onClick={handleOpenCreateModal} disabled={!selectedCourse}>
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
        {!selectedCourse ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Plus style={{ height: '3rem', width: '3rem', opacity: 0.5 }} />
            </div>
            <p className="empty-state-desc">Select a course to view assignments.</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <p className="font-medium">No assignments found. Click 'Create Assignment'.</p>
          </div>
        ) : (
          <div className="d-flex flex-col gap-4">
            {assignments.map(assignment => (
              <div key={assignment.id} className="d-flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 transition-all shadow-sm group" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <h4 className="font-bold d-flex items-center gap-3">
                    {assignment.title}
                    {assignment.status === 'published' ? (
                      <GlassBadge variant="success" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Published</GlassBadge>
                    ) : (
                      <GlassBadge variant="warning" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Draft</GlassBadge>
                    )}
                  </h4>
                  <p className="text-sm font-medium text-muted mt-2">Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'No due date'}</p>
                </div>
                <div className="d-flex items-center gap-2" style={{ flexShrink: 0 }}>
                  <GlassButton variant="secondary" size="sm" className="shadow-sm" onClick={() => openGradingModal(assignment)}>Submissions</GlassButton>
                  <GlassButton variant="ghost" size="sm" className="shadow-sm font-medium" onClick={() => handleStatusToggle(assignment)}>
                    {assignment.status === 'published' ? 'Unpublish' : 'Publish'}
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="btn-icon text-primary shadow-sm" onClick={() => handleOpenEditModal(assignment)}>
                    <Edit style={{ height: '1.25rem', width: '1.25rem' }} />
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="btn-icon text-danger shadow-sm" onClick={() => handleDelete(assignment.id)}>
                    <Trash2 style={{ height: '1.25rem', width: '1.25rem' }} />
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <GlassCard className="modal-content">
            <h3 className="modal-title">{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</h3>
            <form onSubmit={handleSave} className="d-flex flex-col gap-6">
              <div className="form-group">
                <label className="form-label">Title</label>
                <GlassInput required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Assignment Title" />
              </div>
              <div className="dashboard-grid cols-2">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="form-input"
                    value={formData.due_date} 
                    onChange={e => setFormData({...formData, due_date: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <GlassInput type="number" min="0" required value={formData.max_marks} onChange={e => setFormData({...formData, max_marks: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Link to Lecture <span style={{ textTransform: 'lowercase', fontWeight: 500 }}>(Optional)</span></label>
                <select 
                  className="form-input"
                  value={formData.lecture_id}
                  onChange={e => setFormData({...formData, lecture_id: e.target.value})}
                >
                  <option value="" style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>None</option>
                  {lectures.map(l => (
                    <option key={l.id} value={l.id} style={{ background: 'var(--color-background)', color: 'var(--color-foreground)' }}>{l.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description (Short)</label>
                <GlassInput value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief overview" />
              </div>
              <div className="form-group">
                <label className="form-label">Detailed Instructions <span style={{ textTransform: 'lowercase', fontWeight: 500 }}>(Optional)</span></label>
                <textarea 
                  className="form-input"
                  style={{ height: '8rem', resize: 'none' }}
                  value={formData.instructions}
                  onChange={e => setFormData({...formData, instructions: e.target.value})}
                />
              </div>
              
              <div className="modal-footer">
                <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                <GlassButton type="submit" variant="primary" className="shadow-sm">Save Assignment</GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Grading Modal */}
      {gradingModalOpen && selectedAssignmentForGrading && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <GlassCard className="modal-content" style={{ maxWidth: '64rem', padding: 0, height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="p-6 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
              <div className="d-flex flex-wrap justify-between items-start gap-4 mb-4" style={{ paddingRight: '2.5rem' }}>
                <div>
                  <h3 className="font-bold text-xl">Submissions</h3>
                  <p className="text-sm font-medium text-muted">{selectedAssignmentForGrading.title} (Max: {selectedAssignmentForGrading.max_marks})</p>
                </div>
                <div className="d-flex flex-wrap gap-2 items-center">
                  <GlassButton variant="secondary" size="sm" className="shadow-sm btn-export" onClick={async () => {
                    if (!submissions.length) return Swal.fire('No submissions to export');
                    const { exportToExcel } = await import('../../utils/exportUtils');
                    const formatted = submissions.map(s => ({
                      full_name: s.profiles?.full_name || '-',
                      roll_number: s.profiles?.roll_number || '-',
                      status: s.status,
                      marks: s.marks || 0,
                      github: s.github_url || '',
                      live: s.live_url || '',
                      file: s.file_url || ''
                    }));
                    exportToExcel(formatted, [
                      { header: 'Student Name', key: 'full_name' },
                      { header: 'Roll Number', key: 'roll_number' },
                      { header: 'Status', key: 'status' },
                      { header: 'Marks', key: 'marks' },
                      { header: 'Github URL', key: 'github' },
                      { header: 'Live URL', key: 'live' },
                      { header: 'File URL', key: 'file' }
                    ], `Submissions_${selectedAssignmentForGrading.title.replace(/\s+/g, '_')}`);
                  }}>Excel</GlassButton>
                  <GlassButton variant="secondary" size="sm" className="shadow-sm btn-export" onClick={async () => {
                    if (!submissions.length) return Swal.fire('No submissions to export');
                    const { exportToPDF } = await import('../../utils/exportUtils');
                    const formatted = submissions.map(s => ({
                      full_name: s.profiles?.full_name || '-',
                      roll_number: s.profiles?.roll_number || '-',
                      status: s.status,
                      marks: s.marks || 0,
                      links: [s.github_url ? 'GitHub' : '', s.live_url ? 'Live' : '', s.file_url ? 'File' : ''].filter(Boolean).join(', ') || 'None'
                    }));
                    exportToPDF(formatted, [
                      { header: 'Student Name', key: 'full_name' },
                      { header: 'Roll Number', key: 'roll_number' },
                      { header: 'Status', key: 'status' },
                      { header: 'Marks', key: 'marks' },
                      { header: 'Attachments', key: 'links' }
                    ], `Submissions_${selectedAssignmentForGrading.title.replace(/\s+/g, '_')}`, `Submissions for ${selectedAssignmentForGrading.title}`);
                  }}>Pdf</GlassButton>
                </div>
              </div>
              <GlassButton 
                variant="ghost" 
                size="sm" 
                className="btn-icon text-muted-foreground" 
                onClick={() => setGradingModalOpen(false)} 
                title="Close"
                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </GlassButton>
              <div className="d-flex gap-2">
                <GlassButton 
                  variant={activeTab === 'all' ? 'primary' : 'ghost'} 
                  size="sm" 
                  className={activeTab === 'all' ? 'shadow-sm' : ''}
                  onClick={() => setActiveTab('all')}
                >
                  All Submissions
                </GlassButton>
                <GlassButton 
                  variant={activeTab === 'links' ? 'primary' : 'ghost'} 
                  size="sm" 
                  className={activeTab === 'links' ? 'shadow-sm' : ''}
                  onClick={() => setActiveTab('links')}
                >
                  Links
                </GlassButton>
                <GlassButton 
                  variant={activeTab === 'files' ? 'primary' : 'ghost'} 
                  size="sm" 
                  className={activeTab === 'files' ? 'shadow-sm' : ''}
                  onClick={() => setActiveTab('files')}
                >
                  Files
                </GlassButton>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
              {submissions.length === 0 ? (
                <div className="empty-state" style={{ height: '100%', border: 'none', background: 'transparent' }}>
                  <div className="empty-state-icon">
                    <FileUp style={{ height: '2.5rem', width: '2.5rem', opacity: 0.5 }} />
                  </div>
                  <p className="empty-state-desc">No submissions yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  {activeTab === 'all' && (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Roll Number</th>
                          <th>Via</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map(sub => (
                          <SubmissionRowAll 
                            key={sub.id} 
                            sub={sub} 
                            maxMarks={selectedAssignmentForGrading.max_marks} 
                            onSave={(marks, feedback) => handleGradeSubmit(sub.id, marks, feedback)} 
                          />
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'links' && (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Roll Number</th>
                          <th>Git Repo</th>
                          <th>Live URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.filter(s => s.github_url || s.live_url).length === 0 ? (
                          <tr><td colSpan={4} className="text-center text-muted py-6">No link submissions</td></tr>
                        ) : submissions.filter(s => s.github_url || s.live_url).map(sub => (
                          <tr key={sub.id}>
                            <td className="font-bold">{sub.profiles?.full_name}</td>
                            <td className="text-muted">{sub.profiles?.roll_number || '-'}</td>
                            <td>
                              {sub.github_url ? <a href={sub.github_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.github_url}</a> : <span className="text-muted text-sm opacity-60">No preview</span>}
                            </td>
                            <td>
                              {sub.live_url ? <a href={sub.live_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.live_url}</a> : <span className="text-muted text-sm opacity-60">No preview</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'files' && (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Roll Number</th>
                          <th>File</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.filter(s => s.file_url).length === 0 ? (
                          <tr><td colSpan={3} className="text-center text-muted py-6">No file submissions</td></tr>
                        ) : submissions.filter(s => s.file_url).map(sub => (
                          <tr key={sub.id}>
                            <td className="font-bold">{sub.profiles?.full_name}</td>
                            <td className="text-muted">{sub.profiles?.roll_number || '-'}</td>
                            <td>
                              <a href={sub.file_url!} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                <GlassButton variant="secondary" size="sm" className="gap-2 shadow-sm">
                                  <FileUp style={{ height: '1rem', width: '1rem' }} /> View File
                                </GlassButton>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function SubmissionRowAll({ sub, maxMarks, onSave }: { sub: any, maxMarks: number, onSave: (m: number, f: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [marks, setMarks] = useState<string>(sub.marks !== undefined && sub.marks !== null ? sub.marks.toString() : '');
  const [feedback, setFeedback] = useState(sub.feedback || '');

  const via: string[] = [];
  if (sub.file_url) via.push('FILE');
  if (sub.github_url || sub.live_url) via.push('LINK');
  const viaDisplay = via.length > 0 ? via.join(' + ') : 'TEXT ONLY';

  const handleSave = () => {
    const numMarks = marks === '' ? 0 : Number(marks);
    if (numMarks > maxMarks || numMarks < 0) return Swal.fire(`Marks must be between 0 and ${maxMarks}`);
    onSave(numMarks, feedback);
    setIsExpanded(false);
  };

  return (
    <>
      <tr>
        <td className="font-bold">{sub.profiles?.full_name}</td>
        <td className="text-muted">{sub.profiles?.roll_number || '-'}</td>
        <td>
          <GlassBadge variant="default" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{viaDisplay}</GlassBadge>
        </td>
        <td>
          {sub.status === 'graded' ? (
            <span className="text-success text-sm font-bold">{sub.marks}/{maxMarks}</span>
          ) : (
            <span className="text-warning text-sm font-bold opacity-80">Needs Grading</span>
          )}
        </td>
        <td>
          <GlassButton variant={isExpanded ? 'primary' : 'ghost'} size="sm" onClick={() => setIsExpanded(!isExpanded)} className={isExpanded ? 'shadow-sm' : ''}>
            {isExpanded ? 'Close' : 'Grade'}
          </GlassButton>
        </td>
      </tr>
      {isExpanded && (
        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
          <td colSpan={5} style={{ padding: '1.5rem' }}>
            <div className="d-flex flex-col gap-5" style={{ maxWidth: '48rem' }}>
              {(sub.file_url || sub.github_url || sub.live_url) && (
                <div className="d-flex flex-wrap gap-3">
                  {sub.file_url && (
                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary shadow-sm btn-sm">
                      View File
                    </a>
                  )}
                  {sub.github_url && (
                    <a href={sub.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary shadow-sm btn-sm">
                      GitHub Repo
                    </a>
                  )}
                  {sub.live_url && (
                    <a href={sub.live_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary shadow-sm btn-sm">
                      Live URL
                    </a>
                  )}
                </div>
              )}
              {sub.submission_text && (
                <div className="p-4 rounded-xl border border-white/5 text-sm font-medium" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="font-bold text-muted block mb-2" style={{ textTransform: 'uppercase', fontSize: '10px' }}>Comments:</span>
                  {sub.submission_text}
                </div>
              )}
              <div className="d-flex flex-col sm:flex-row gap-5 items-end p-5 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Marks (/{maxMarks})</label>
                  <GlassInput type="number" min="0" max={maxMarks} value={marks} onChange={e => setMarks(e.target.value)} style={{ width: '8rem' }} />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Feedback</label>
                  <GlassInput value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Good job..." />
                </div>
                <GlassButton variant="primary" onClick={handleSave} className="shadow-sm" style={{ width: '100%', maxWidth: 'max-content' }}>Save Grade</GlassButton>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

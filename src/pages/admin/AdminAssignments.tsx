import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, FileUp } from 'lucide-react';
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
    if (!confirm('Are you sure you want to delete this assignment?')) return;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assignments</h2>
          <p className="text-muted-foreground">Manage course assignments and grading</p>
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
            if (!assignments.length) return Swal.fire('No assignments to export');
            const { exportToExcel } = await import('../../utils/exportUtils');
            exportToExcel(assignments, [
              { header: 'Title', key: 'title' },
              { header: 'Description', key: 'description' },
              { header: 'Status', key: 'status' },
              { header: 'Due Date', key: 'due_date' },
              { header: 'Max Marks', key: 'max_marks' }
            ], 'Assignments_Export');
          }}>Export Excel</GlassButton>
          <GlassButton variant="secondary" className="shrink-0" onClick={async () => {
            if (!assignments.length) return Swal.fire('No assignments to export');
            const { exportToPDF } = await import('../../utils/exportUtils');
            exportToPDF(assignments, [
              { header: 'Title', key: 'title' },
              { header: 'Description', key: 'description' },
              { header: 'Status', key: 'status' },
              { header: 'Due Date', key: 'due_date' },
              { header: 'Max Marks', key: 'max_marks' }
            ], 'Assignments_Export', 'Assignments List');
          }}>Export PDF</GlassButton>
          <GlassButton variant="primary" className="gap-2 shrink-0" onClick={handleOpenCreateModal} disabled={!selectedCourse}>
            <Plus className="h-4 w-4" /> Create Assignment
          </GlassButton>
        </div>
      </div>

      <GlassCard className="p-4 sm:p-6 min-h-[400px]">
        {!selectedCourse ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p>Select a course to view assignments.</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p>No assignments found. Click 'Create Assignment'.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(assignment => (
              <div key={assignment.id} className="flex items-center justify-between p-4 rounded-xl border border-glass-highlight bg-glass/30 hover:bg-glass/50 transition-colors">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-3">
                    {assignment.title}
                    {assignment.status === 'published' ? (
                      <GlassBadge variant="success" className="text-[10px] px-2 py-0">Published</GlassBadge>
                    ) : (
                      <GlassBadge variant="warning" className="text-[10px] px-2 py-0">Draft</GlassBadge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'No due date'}</p>
                </div>
                <div className="flex gap-2">
                  <GlassButton variant="secondary" size="sm" onClick={() => openGradingModal(assignment)}>Submissions</GlassButton>
                  <GlassButton variant="ghost" size="sm" onClick={() => handleStatusToggle(assignment)}>
                    {assignment.status === 'published' ? 'Unpublish' : 'Publish'}
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" onClick={() => handleOpenEditModal(assignment)}>
                    <Edit className="h-4 w-4" />
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" className="h-8 w-8 p-0 text-error hover:bg-error/10" onClick={() => handleDelete(assignment.id)}>
                    <Trash2 className="h-4 w-4" />
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Title</label>
                <GlassInput required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Assignment Title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1">Due Date</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full h-10 px-4 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.due_date} 
                    onChange={e => setFormData({...formData, due_date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1">Max Marks</label>
                  <GlassInput type="number" min="0" required value={formData.max_marks} onChange={e => setFormData({...formData, max_marks: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Link to Lecture (Optional)</label>
                <select 
                  className="w-full h-10 px-4 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none appearance-none"
                  value={formData.lecture_id}
                  onChange={e => setFormData({...formData, lecture_id: e.target.value})}
                >
                  <option value="" className="bg-background text-foreground">None</option>
                  {lectures.map(l => (
                    <option key={l.id} value={l.id} className="bg-background text-foreground">{l.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Description (Short)</label>
                <GlassInput value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief overview" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Detailed Instructions <span className="text-xs text-muted-foreground font-normal">(Optional)</span></label>
                <textarea 
                  className="w-full h-32 px-4 py-3 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  value={formData.instructions}
                  onChange={e => setFormData({...formData, instructions: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                <GlassButton type="submit" variant="primary">Save Assignment</GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Grading Modal */}
      {gradingModalOpen && selectedAssignmentForGrading && (
        <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-5xl p-0 h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-glass-highlight bg-glass-highlight/30">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold">Submissions</h3>
                  <p className="text-sm text-muted-foreground">{selectedAssignmentForGrading.title} (Max: {selectedAssignmentForGrading.max_marks})</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <GlassButton variant="secondary" size="sm" onClick={async () => {
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
                  }}>Export Excel</GlassButton>
                  <GlassButton variant="secondary" size="sm" onClick={async () => {
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
                  }}>Export PDF</GlassButton>
                  <GlassButton variant="ghost" size="sm" onClick={() => setGradingModalOpen(false)}>Close</GlassButton>
                </div>
              </div>
              <div className="flex gap-2">
                <GlassButton 
                  variant={activeTab === 'all' ? 'primary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveTab('all')}
                >
                  All Submissions
                </GlassButton>
                <GlassButton 
                  variant={activeTab === 'links' ? 'primary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveTab('links')}
                >
                  Links
                </GlassButton>
                <GlassButton 
                  variant={activeTab === 'files' ? 'primary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveTab('files')}
                >
                  Files
                </GlassButton>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {submissions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No submissions yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {activeTab === 'all' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-glass-highlight text-sm text-muted-foreground">
                          <th className="p-3 font-medium">Name</th>
                          <th className="p-3 font-medium">Roll Number</th>
                          <th className="p-3 font-medium">Via</th>
                          <th className="p-3 font-medium">Status</th>
                          <th className="p-3 font-medium">Action</th>
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
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-glass-highlight text-sm text-muted-foreground">
                          <th className="p-3 font-medium">Name</th>
                          <th className="p-3 font-medium">Roll Number</th>
                          <th className="p-3 font-medium">Git Repo</th>
                          <th className="p-3 font-medium">Live URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.filter(s => s.github_url || s.live_url).length === 0 ? (
                          <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No link submissions</td></tr>
                        ) : submissions.filter(s => s.github_url || s.live_url).map(sub => (
                          <tr key={sub.id} className="border-b border-glass-highlight/50 hover:bg-glass/20">
                            <td className="p-3 font-medium">{sub.profiles?.full_name}</td>
                            <td className="p-3 text-muted-foreground">{sub.profiles?.roll_number || '-'}</td>
                            <td className="p-3">
                              {sub.github_url ? <a href={sub.github_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block max-w-[200px]">{sub.github_url}</a> : <span className="text-muted-foreground text-sm">No preview</span>}
                            </td>
                            <td className="p-3">
                              {sub.live_url ? <a href={sub.live_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block max-w-[200px]">{sub.live_url}</a> : <span className="text-muted-foreground text-sm">No preview</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'files' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-glass-highlight text-sm text-muted-foreground">
                          <th className="p-3 font-medium">Name</th>
                          <th className="p-3 font-medium">Roll Number</th>
                          <th className="p-3 font-medium">File</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.filter(s => s.file_url).length === 0 ? (
                          <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No file submissions</td></tr>
                        ) : submissions.filter(s => s.file_url).map(sub => (
                          <tr key={sub.id} className="border-b border-glass-highlight/50 hover:bg-glass/20">
                            <td className="p-3 font-medium">{sub.profiles?.full_name}</td>
                            <td className="p-3 text-muted-foreground">{sub.profiles?.roll_number || '-'}</td>
                            <td className="p-3">
                              <a href={sub.file_url!} target="_blank" rel="noreferrer">
                                <GlassButton variant="secondary" size="sm" className="gap-2">
                                  <FileUp className="h-4 w-4" /> View File
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
  const [marks, setMarks] = useState(sub.marks || 0);
  const [feedback, setFeedback] = useState(sub.feedback || '');

  const via: string[] = [];
  if (sub.file_url) via.push('FILE');
  if (sub.github_url || sub.live_url) via.push('LINK');
  const viaDisplay = via.length > 0 ? via.join(' + ') : 'TEXT ONLY';

  const handleSave = () => {
    if (marks > maxMarks || marks < 0) return Swal.fire(`Marks must be between 0 and ${maxMarks}`);
    onSave(marks, feedback);
    setIsExpanded(false);
  };

  return (
    <>
      <tr className="border-b border-glass-highlight/50 hover:bg-glass/20 transition-colors">
        <td className="p-3 font-medium">{sub.profiles?.full_name}</td>
        <td className="p-3 text-muted-foreground">{sub.profiles?.roll_number || '-'}</td>
        <td className="p-3">
          <GlassBadge variant="default" className="text-[10px] uppercase">{viaDisplay}</GlassBadge>
        </td>
        <td className="p-3">
          {sub.status === 'graded' ? (
            <span className="text-success text-sm font-medium">{sub.marks}/{maxMarks}</span>
          ) : (
            <span className="text-warning text-sm">Needs Grading</span>
          )}
        </td>
        <td className="p-3">
          <GlassButton variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Close' : 'Grade'}
          </GlassButton>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-glass/10 border-b border-glass-highlight">
          <td colSpan={5} className="p-4">
            <div className="flex flex-col gap-4 max-w-2xl">
              {sub.submission_text && (
                <div className="bg-background/50 p-3 rounded-lg border border-glass-highlight text-sm">
                  <span className="font-semibold text-muted-foreground block mb-1">Comments:</span>
                  {sub.submission_text}
                </div>
              )}
              <div className="flex gap-4 items-end bg-background/50 p-4 rounded-xl border border-glass-highlight/50">
                <div>
                  <label className="block text-xs mb-1">Marks (/{maxMarks})</label>
                  <GlassInput type="number" min="0" max={maxMarks} value={marks} onChange={e => setMarks(Number(e.target.value))} className="w-24" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs mb-1">Feedback</label>
                  <GlassInput value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Good job..." />
                </div>
                <GlassButton variant="primary" onClick={handleSave}>Save Grade</GlassButton>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

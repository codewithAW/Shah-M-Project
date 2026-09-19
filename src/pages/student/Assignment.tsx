import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle, Clock, FileUp, ExternalLink, Shield } from 'lucide-react';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassBadge } from '../../components/ui/GlassBadge';
import { assignmentService } from '../../services/assignmentService';
import { resourceService } from '../../services/resourceService';
import { useAuth } from '../../hooks/useAuth';
import type { Assignment as AssignmentType, AssignmentSubmission } from '../../types';
import Swal from 'sweetalert2';


export function Assignment() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { profile } = useAuth();
  
  const [assignment, setAssignment] = useState<AssignmentType | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');

  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [submissionMode, setSubmissionMode] = useState<'file' | 'links'>('file');
  const [activeView, setActiveView] = useState<'details' | 'instructions' | 'remarks' | null>(null);
  const [showDueDate, setShowDueDate] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const aData = await assignmentService.getAssignment(assignmentId!);
      setAssignment(aData);
      
      const sData = await assignmentService.getStudentSubmission(assignmentId!, profile!.id);
      if (sData) setSubmission(sData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, profile]);

  useEffect(() => {
    if (assignmentId && profile) {
      loadData();
    }
  }, [assignmentId, profile, loadData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!assignment || !profile) return;
    if (submissionMode === 'file' && !file && !submissionText) return Swal.fire("Please provide a file or text submission.");
    if (submissionMode === 'links' && !githubUrl && !liveUrl && !submissionText) return Swal.fire("Please provide at least one link or text submission.");

    setIsUploading(true);
    try {
      let fileUrl = null;
      let driveFileId = null;
      let fileName = null;

      if (submissionMode === 'file' && file) {
        const result = await resourceService.uploadResourceFileStudent(file);
        fileUrl = result.file.webViewLink;
        driveFileId = result.file.id;
        fileName = result.file.name;
      }

      await assignmentService.createOrUpdateSubmission({
        assignment_id: assignment.id,
        student_id: profile.id,
        submission_text: submissionText,
        drive_file_id: driveFileId,
        file_name: fileName,
        file_url: fileUrl,
        github_url: submissionMode === 'links' ? githubUrl : null,
        live_url: submissionMode === 'links' ? liveUrl : null,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      });

      Swal.fire("Submitted successfully!");
      loadData();
    } catch (err: any) {
      Swal.fire("Submission failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (!assignment) {
    return <div className="text-center p-20 text-muted-foreground">Assignment not found.</div>;
  }

  const isClosed = assignment.due_date ? new Date() > new Date(assignment.due_date) : false;
  const status = submission ? submission.status : 'not_submitted';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-h1 font-extrabold text-primary" style={{ letterSpacing: '-0.02em' }}>Assignment Info</h2>
      </div>

      <GlassCard className="p-8 border-t-4 border-t-primary relative overflow-hidden">
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '2rem', opacity: 0.1, pointerEvents: 'none' }}>
          <FileText style={{ width: '8rem', height: '8rem' }} />
        </div>
        
        <div className="relative z-10 d-flex flex-col items-center gap-4 mb-8 text-center" style={{ width: '100%' }}>
          <div>
            <h1 className="text-h2 font-bold mb-4" style={{ color: 'var(--color-foreground)' }}>{assignment.title}</h1>
            <div className="d-flex items-center justify-center gap-3">
              {/* @ts-ignore */}
              {assignment.courses?.title && (
                <>
                  <Shield className="h-5 w-5" style={{ color: '#4f46e5' }} />
                  {/* @ts-ignore */}
                  <span className="font-medium text-lg" style={{ color: '#334155' }}>{assignment.courses.title}</span>
                  <span className="font-medium" style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>({assignment.max_marks} Points)</span>
                </>
              )}
            </div>
          </div>
          <div className="d-flex flex-col items-center gap-3 mt-6">
            <button 
              onClick={() => setShowDueDate(!showDueDate)} 
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              title="Click to view due date"
            >
              <GlassBadge variant={status === 'graded' ? 'success' : status === 'not_submitted' ? (isClosed ? 'error' : 'warning') : 'primary'} style={{ textTransform: 'uppercase', fontSize: 'var(--font-size-xs)' }}>
                {isClosed && status === 'not_submitted' ? 'CLOSED' : status.replace('_', ' ')}
              </GlassBadge>
            </button>
            {showDueDate && assignment.due_date && (
              <span className={`d-flex items-center gap-2 font-medium ${isClosed ? 'text-danger' : 'text-muted'}`}>
                <Clock style={{ height: '1rem', width: '1rem' }} /> Due {new Date(assignment.due_date).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="relative z-10 border-t border-glass-highlight pt-8">
          
          <div className="d-flex justify-center gap-6 mb-8 mt-4">
            <button 
              onClick={() => setActiveView(activeView === 'details' ? null : 'details')}
              style={{
                background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                color: activeView === 'details' ? '#4f46e5' : '#64748b',
                borderBottom: activeView === 'details' ? '2px solid #4f46e5' : '2px solid transparent',
              }}
            >
              Details
            </button>
            {assignment.instructions && (
              <button 
                onClick={() => setActiveView(activeView === 'instructions' ? null : 'instructions')}
                style={{
                  background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                  color: activeView === 'instructions' ? '#4f46e5' : '#64748b',
                  borderBottom: activeView === 'instructions' ? '2px solid #4f46e5' : '2px solid transparent',
                }}
              >
                Instructions
              </button>
            )}
            {status === 'graded' && (
              <button 
                onClick={() => setActiveView(activeView === 'remarks' ? null : 'remarks')}
                style={{
                  background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                  color: activeView === 'remarks' ? '#4f46e5' : '#64748b',
                  borderBottom: activeView === 'remarks' ? '2px solid #4f46e5' : '2px solid transparent',
                }}
              >
                Teacher Remarks
              </button>
            )}
          </div>

          {activeView === 'details' && assignment.description && (
            <div className="p-6 text-center mb-8" style={{ border: '1px solid rgba(var(--color-primary-rgb), 0.2)', background: 'rgba(var(--color-primary-rgb), 0.05)', borderRadius: 'var(--radius-2xl)' }}>
              <p className="text-h4 font-semibold text-foreground" style={{ lineHeight: 1.6 }}>{assignment.description}</p>
            </div>
          )}

          {activeView === 'instructions' && assignment.instructions && (
            <div className="mb-8">
              <p className="text-muted leading-relaxed whitespace-pre-line p-6 text-center" style={{ fontSize: 'var(--font-size-lg)', border: '1px solid rgba(var(--color-primary-rgb), 0.15)', background: 'rgba(var(--color-primary-rgb), 0.03)', borderRadius: 'var(--radius-2xl)' }}>
                {assignment.instructions}
              </p>
            </div>
          )}

          {status === 'graded' && submission && activeView === 'remarks' && (
            <div className="mb-8 p-6 text-center" style={{ borderRadius: 'var(--radius-2xl)', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)' }}>
              <div className="d-flex flex-col items-center gap-4">
                <div className="d-flex flex-col items-center justify-center text-success" style={{ height: '7rem', width: '7rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', border: '4px solid rgba(16, 185, 129, 0.3)' }}>
                  <span className="text-h2 font-bold">{submission.marks}</span>
                  <span className="text-xs uppercase font-bold tracking-wider" style={{ letterSpacing: '0.05em', marginTop: '-0.25rem' }}>/ {assignment.max_marks} Pts</span>
                </div>
                <div>
                  <h3 className="text-h3 font-bold text-success mb-2">Graded</h3>
                  <p className="italic text-foreground">"{submission.feedback || 'No feedback provided.'}"</p>
                </div>
              </div>
            </div>
          )}

          {status === 'not_submitted' ? (
            <h3 className="text-h3 font-bold mb-4 text-center mt-8">Your Submission</h3>
          ) : null}
          
          {status === 'not_submitted' ? (
            isClosed ? (
              <div className="p-6 text-center" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-2xl)' }}>
                <h3 className="text-h4 font-bold text-danger mb-2">Submissions Closed</h3>
                <p className="text-muted">The due date for this assignment has passed.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-4 border-b border-glass-highlight pb-4">
                  <GlassButton variant={submissionMode === 'file' ? 'primary' : 'ghost'} size="sm" onClick={() => setSubmissionMode('file')}>
                    Upload File
                  </GlassButton>
                  <GlassButton variant={submissionMode === 'links' ? 'primary' : 'ghost'} size="sm" onClick={() => setSubmissionMode('links')}>
                    Provide Links
                  </GlassButton>
                </div>

                {submissionMode === 'file' ? (
                  <div className="py-2" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <label className="cursor-pointer m-0">
                      <div className={`btn ${file ? 'btn-danger' : 'btn-primary'} shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2 px-6`}>
                        <UploadCloud size={20} />
                        <span>{file ? 'Wrong file! choose another one' : 'choose a file'}</span>
                      </div>
                      <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
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
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 ml-1">GitHub Repository URL (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://github.com/username/repo"
                        className="form-input w-full"
                        value={githubUrl}
                        onChange={e => setGithubUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 ml-1">Live URL (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://my-app.vercel.app"
                        className="form-input w-full"
                        value={liveUrl}
                        onChange={e => setLiveUrl(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <textarea 
                  placeholder="Optional text submission or comments..."
                  className="form-input w-full mt-4 resize-none"
                  style={{ minHeight: '8rem' }}
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                />

                <div className="flex justify-end pt-4">
                  <GlassButton variant="primary" size="lg" onClick={handleSubmit} disabled={isUploading}>
                    {isUploading ? 'Submitting...' : 'Submit Assignment'}
                  </GlassButton>
                </div>
              </div>
            )
          ) : (
            <div style={{ background: 'var(--color-glass-bg)', borderRadius: '1rem', padding: '3rem 2rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', width: '100%', maxWidth: '850px', margin: '2rem auto 0 auto' }}>
              <div className="d-flex flex-col items-center justify-center gap-2 mb-10">
                <div className="d-flex items-center gap-3">
                  <CheckCircle className="h-8 w-8" style={{ color: '#4f46e5' }} />
                  <h3 className="text-h3 font-bold" style={{ color: 'var(--color-foreground)', margin: 0 }}>Submission Recorded</h3>
                </div>
                <p className="text-sm" style={{ color: '#64748b' }}>Submitted on {new Date(submission!.submitted_at!).toLocaleString('en-GB', { hour12: true })}</p>
              </div>

              {(submission?.github_url || submission?.live_url) && (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #f1f5f9', borderRadius: '1rem', background: 'var(--color-glass-bg)' }}>
                  {submission?.github_url && (
                    <div className="d-flex items-center gap-4 p-4" style={{ flex: 1, border: '1px solid #f1f5f9', borderRadius: '0.75rem', background: 'var(--color-glass-bg)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <div className="d-flex items-center justify-center" style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: '#e0e7ff', color: 'var(--color-foreground)', flexShrink: 0 }}>
                        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '0.25rem' }}>GitHub Repository</h4>
                        <a href={submission.github_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.875rem', color: '#4f46e5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {submission.github_url} <ExternalLink className="h-3 w-3" style={{ flexShrink: 0 }} />
                        </a>
                      </div>
                    </div>
                  )}

                  {submission?.live_url && (
                    <div className="d-flex items-center gap-4 p-4" style={{ flex: 1, border: '1px solid #f1f5f9', borderRadius: '0.75rem', background: 'var(--color-glass-bg)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <div className="d-flex items-center justify-center" style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: '#dcfce7', color: '#14532d', flexShrink: 0 }}>
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: '0.25rem' }}>Live URL</h4>
                        <a href={submission.live_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.875rem', color: '#4f46e5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {submission.live_url} <ExternalLink className="h-3 w-3" style={{ flexShrink: 0 }} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {submission?.submission_text && (
                <div style={{ border: '1px solid #f1f5f9', borderRadius: '1rem', background: 'var(--color-glass-bg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-foreground)' }}>Text Submission:</p>
                  <p className="text-sm" style={{ color: '#64748b' }}>{submission.submission_text}</p>
                </div>
              )}
              
              {submission?.file_url && (
                <a href={submission.file_url} target="_blank" rel="noreferrer" className="d-flex justify-between items-center p-4 mt-2" style={{ border: '1px solid #f1f5f9', borderRadius: '1rem', background: 'var(--color-glass-bg)', textDecoration: 'none' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Attached File:</p>
                    <p className="text-sm" style={{ color: '#64748b' }}>{submission.file_name}</p>
                  </div>
                  <FileUp className="h-5 w-5" style={{ color: '#4f46e5' }} />
                </a>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

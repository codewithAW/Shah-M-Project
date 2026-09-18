import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle, Clock, AlertCircle, FileUp } from 'lucide-react';
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
      <div className="flex items-center gap-2 text-sm text-primary font-medium">
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <span className="text-muted-foreground">Assignment</span>
      </div>

      <GlassCard className="p-8 border-t-4 border-t-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <FileText className="w-32 h-32" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
            {/* @ts-ignore */}
            <p className="text-muted-foreground text-lg">{assignment.courses?.title}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <GlassBadge variant={status === 'graded' ? 'success' : status === 'not_submitted' ? (isClosed ? 'error' : 'warning') : 'primary'} className="text-sm px-3 py-1 uppercase">
              {isClosed && status === 'not_submitted' ? 'CLOSED' : status.replace('_', ' ')}
            </GlassBadge>
            {assignment.due_date && (
              <span className={`text-sm font-medium flex items-center gap-1.5 ${isClosed ? 'text-error' : 'text-muted-foreground'}`}>
                <Clock className="h-4 w-4" /> Due {new Date(assignment.due_date).toLocaleString()}
              </span>
            )}
            <span className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
              <AlertCircle className="h-4 w-4" /> {assignment.max_marks} Points
            </span>
          </div>
        </div>

        <div className="relative z-10 border-t border-glass-highlight pt-8">
          {assignment.description && (
            <p className="text-lg font-medium mb-4">{assignment.description}</p>
          )}
          {assignment.instructions && (
            <>
              <h3 className="text-xl font-bold mb-4">Instructions</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-8 p-4 rounded-xl border border-glass-highlight bg-glass/20">
                {assignment.instructions}
              </p>
            </>
          )}

          {status === 'graded' && submission && (
            <div className="mb-8 p-6 rounded-2xl border border-success/30 bg-success/10 flex flex-col sm:flex-row items-center gap-6">
              <div className="h-24 w-24 shrink-0 rounded-full bg-success/20 flex flex-col items-center justify-center text-success border-4 border-success/30">
                <span className="text-2xl font-bold">{submission.marks}</span>
                <span className="text-xs uppercase font-bold tracking-wider">Marks</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-success mb-2">Graded</h3>
                <p className="italic text-foreground">"{submission.feedback || 'No feedback provided.'}"</p>
              </div>
            </div>
          )}

          <h3 className="text-xl font-bold mb-4">Your Submission</h3>
          
          {status === 'not_submitted' ? (
            isClosed ? (
              <div className="p-6 border border-error/30 bg-error/10 rounded-2xl text-center">
                <h3 className="text-xl font-bold text-error mb-2">Submissions Closed</h3>
                <p className="text-muted-foreground">The due date for this assignment has passed.</p>
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
                  <label className="block border-2 border-dashed border-glass-highlight rounded-2xl p-8 text-center bg-background/50 hover:bg-glass/50 transition-colors cursor-pointer group">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Upload File (Optional)</h4>
                    <p className="text-sm text-muted-foreground mb-4">{file ? file.name : "Select a document to attach"}</p>
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 ml-1">GitHub Repository URL (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://github.com/username/repo"
                        className="w-full h-10 px-4 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={githubUrl}
                        onChange={e => setGithubUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 ml-1">Live URL (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://my-app.vercel.app"
                        className="w-full h-10 px-4 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={liveUrl}
                        onChange={e => setLiveUrl(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <textarea 
                  placeholder="Optional text submission or comments..."
                  className="w-full h-32 px-4 py-3 rounded-xl border border-glass-highlight bg-glass/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mt-4"
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
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl p-6 flex items-center justify-between border-primary/30">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Submission Recorded</h4>
                    <p className="text-xs text-muted-foreground">Submitted on {new Date(submission!.submitted_at!).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              {submission?.submission_text && (
                <div className="p-4 border border-glass-highlight rounded-xl bg-glass/30">
                  <p className="text-sm font-semibold mb-2">Text:</p>
                  <p className="text-sm text-muted-foreground">{submission.submission_text}</p>
                </div>
              )}

              {submission?.github_url && (
                <div className="p-4 border border-glass-highlight rounded-xl bg-glass/30">
                  <p className="text-sm font-semibold mb-2">GitHub Repository:</p>
                  <a href={submission.github_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">{submission.github_url}</a>
                </div>
              )}

              {submission?.live_url && (
                <div className="p-4 border border-glass-highlight rounded-xl bg-glass/30">
                  <p className="text-sm font-semibold mb-2">Live URL:</p>
                  <a href={submission.live_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">{submission.live_url}</a>
                </div>
              )}

              {submission?.file_url && (
                <a href={submission.file_url} target="_blank" rel="noreferrer" className="block p-4 border border-glass-highlight rounded-xl bg-glass/30 hover:bg-glass/50 transition-colors flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">Attached File:</p>
                    <p className="text-sm text-muted-foreground">{submission.file_name}</p>
                  </div>
                  <FileUp className="h-5 w-5 text-primary" />
                </a>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
